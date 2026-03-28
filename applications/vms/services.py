from __future__ import annotations

from dataclasses import dataclass

from django.db import transaction
from django.utils import timezone

from .models import (
    BlacklistEntry,
    DenialLog,
    EntryExitLog,
    SecurityIncident,
    VMSSetting,
    VerificationLog,
    Visit,
    Visitor,
    VisitorPass,
    calculate_valid_until,
)
from .selectors import get_current_staff


class RegistrationError(Exception):
    pass


class WorkflowError(Exception):
    pass


@transaction.atomic
def register_visitor(data):
    id_number = data["id_number"]
    if BlacklistEntry.objects.filter(id_number=id_number, active=True).exists():
        raise RegistrationError("Visitor is blacklisted.")

    visitor_defaults = {
        "full_name": data["full_name"],
        "id_type": data["id_type"],
        "contact_phone": data["contact_phone"],
        "contact_email": data.get("contact_email", ""),
        "photo_reference": data.get("photo_reference", ""),
    }
    visitor, _ = Visitor.objects.update_or_create(id_number=id_number, defaults=visitor_defaults)

    visit = Visit.objects.create(
        visitor=visitor,
        purpose=data["purpose"],
        host_name=data["host_name"],
        host_department=data["host_department"],
        host_contact=data.get("host_contact", ""),
        expected_duration_minutes=data.get("expected_duration_minutes", 60),
        status=Visit.REGISTERED,
        is_vip=bool(data.get("is_vip", False)),
    )
    return visitor, visit


@transaction.atomic
def verify_visitor(data, user):
    visit = Visit.objects.select_for_update().get(pk=data["visit_id"])
    verifier = get_current_staff(user)

    VerificationLog.objects.create(
        visit=visit,
        verifier=verifier,
        method=data.get("method", VerificationLog.MANUAL),
        result=bool(data["result"]),
        notes=data.get("notes", ""),
    )

    if not data["result"]:
        visit.status = Visit.DENIED
        visit.denial_reason = "Verification failed"
        visit.denial_remarks = data.get("notes", "")
        visit.save(update_fields=["status", "denial_reason", "denial_remarks"])
        DenialLog.objects.create(
            visit=visit,
            reason=visit.denial_reason,
            remarks=visit.denial_remarks,
            escalated=True,
        )
        raise WorkflowError("Verification failed; visit denied.")

    visit.status = Visit.ID_VERIFIED
    visit.verified_at = timezone.now()
    visit.save(update_fields=["status", "verified_at"])
    return visit


@transaction.atomic
def issue_pass(data):
    visit = Visit.objects.select_for_update().select_related("visitor").get(pk=data["visit_id"])

    if visit.status in [Visit.DENIED, Visit.EXITED]:
        raise WorkflowError("Cannot issue pass for denied/exited visit.")
    if visit.status not in [Visit.ID_VERIFIED, Visit.PASS_ISSUED]:
        raise WorkflowError("Visit must be ID verified before issuing pass.")

    valid_from = timezone.now()
    valid_until = calculate_valid_until(valid_from, visit.expected_duration_minutes, is_vip=visit.is_vip)

    visitor_pass, _ = VisitorPass.objects.update_or_create(
        visit=visit,
        defaults={
            "valid_from": valid_from,
            "valid_until": valid_until,
            "authorized_zones": data.get("authorized_zones", "public"),
            "status": VisitorPass.ISSUED,
            "is_vip_pass": visit.is_vip,
        },
    )

    qr_data_uri = visitor_pass.generate_qr_data_uri()
    visitor_pass.barcode_data = qr_data_uri
    visitor_pass.save(update_fields=["barcode_data"])

    visit.status = Visit.PASS_ISSUED
    visit.pass_issued_at = timezone.now()
    visit.save(update_fields=["status", "pass_issued_at"])

    return visit, visitor_pass, qr_data_uri


@transaction.atomic
def record_entry(data, user):
    visit = Visit.objects.select_for_update().get(pk=data["visit_id"])
    if visit.status not in [Visit.PASS_ISSUED, Visit.INSIDE]:
        raise WorkflowError("Visit must have a pass issued to record entry.")

    EntryExitLog.objects.create(
        visit=visit,
        action=EntryExitLog.ENTRY,
        gate_name=data["gate_name"],
        recorded_by=get_current_staff(user),
        items_declared=data.get("items_declared", ""),
    )

    if visit.entry_at is None:
        visit.entry_at = timezone.now()
    visit.status = Visit.INSIDE
    visit.save(update_fields=["status", "entry_at"])
    return visit


@transaction.atomic
def record_exit(data, user):
    visit = Visit.objects.select_for_update().get(pk=data["visit_id"])
    if visit.status != Visit.INSIDE:
        raise WorkflowError("Visit must be inside to record exit.")

    EntryExitLog.objects.create(
        visit=visit,
        action=EntryExitLog.EXIT,
        gate_name=data["gate_name"],
        recorded_by=get_current_staff(user),
        items_declared=data.get("items_declared", ""),
    )

    visit.status = Visit.EXITED
    visit.exit_at = timezone.now()
    visit.save(update_fields=["status", "exit_at"])

    try:
        visitor_pass = visit.visitor_pass
    except VisitorPass.DoesNotExist:
        visitor_pass = None
    if visitor_pass is not None:
        visitor_pass.status = VisitorPass.RETURNED
        visitor_pass.save(update_fields=["status"])

    return visit


@transaction.atomic
def deny_entry(data):
    visit = Visit.objects.select_for_update().get(pk=data["visit_id"])
    visit.status = Visit.DENIED
    visit.denial_reason = data["reason"]
    visit.denial_remarks = data.get("remarks", "")
    visit.save(update_fields=["status", "denial_reason", "denial_remarks"])

    denial_log = DenialLog.objects.create(
        visit=visit,
        reason=data["reason"],
        remarks=data.get("remarks", ""),
        escalated=bool(data.get("escalated", False)),
    )
    return visit, denial_log


@transaction.atomic
def log_incident(data, user):
    incident = SecurityIncident.objects.create(
        visit_id=data.get("visit_id") or None,
        visitor_id=data.get("visitor_id") or None,
        recorded_by=get_current_staff(user),
        severity=data["severity"],
        issue_type=data["issue_type"],
        description=data["description"],
    )
    return incident


def get_blacklist_entries(active_only=True):
    queryset = BlacklistEntry.objects.all().order_by("-created_at")
    if active_only:
        queryset = queryset.filter(active=True)
    return queryset


@transaction.atomic
def set_blacklist_entry(data):
    entry, _ = BlacklistEntry.objects.update_or_create(
        id_number=data["id_number"],
        defaults={
            "reason": data.get("reason", "") ,
            "active": bool(data.get("active", True)),
        },
    )
    return entry


@transaction.atomic
def clear_blacklist_entry(id_number):
    BlacklistEntry.objects.filter(id_number=id_number).update(active=False)


def get_system_settings():
    return {s.key: s.value for s in VMSSetting.objects.all()}


@transaction.atomic
def set_system_setting(key: str, value: str, description: str = ""):
    setting, _ = VMSSetting.objects.update_or_create(
        key=key,
        defaults={"value": value, "description": description},
    )
    return setting


def generate_visitor_report():
    from django.db.models import Count

    total_visitors = Visitor.objects.count()
    total_visits = Visit.objects.count()
    active_visits = Visit.objects.filter(status__in=[Visit.INSIDE, Visit.PASS_ISSUED]).count()
    vip_visits = Visit.objects.filter(is_vip=True).count()
    denied_visits = Visit.objects.filter(status=Visit.DENIED).count()
    incidents_by_severity = (
        SecurityIncident.objects.values("severity").annotate(count=Count("id")).order_by("severity")
    )

    return {
        "total_visitors": total_visitors,
        "total_visits": total_visits,
        "active_visits": active_visits,
        "vip_visits": vip_visits,
        "denied_visits": denied_visits,
        "incidents_by_severity": list(incidents_by_severity),
    }


@transaction.atomic
def import_visitors_list(items):
    created = []
    for item in items:
        v, _ = Visitor.objects.update_or_create(
            id_number=item["id_number"],
            defaults={
                "full_name": item.get("full_name", ""),
                "id_type": item.get("id_type", "passport"),
                "contact_phone": item.get("contact_phone", ""),
                "contact_email": item.get("contact_email", ""),
                "photo_reference": item.get("photo_reference", ""),
            },
        )
        created.append(v)
    return created


def export_visitors_as_json():
    return list(Visitor.objects.values())

