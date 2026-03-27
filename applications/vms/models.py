import base64
import json
import uuid
from datetime import timedelta
from io import BytesIO

import pyqrcode
from django.conf import settings
from django.db import models
from django.utils import timezone


ID_TYPES = [
    ("passport", "Passport"),
    ("national_id", "National ID"),
    ("driver_license", "Driver License"),
    ("aadhaar", "Aadhaar Card"),
]


class Visitor(models.Model):
    full_name = models.CharField(max_length=120)
    id_number = models.CharField(max_length=64, unique=True)
    id_type = models.CharField(max_length=20, choices=ID_TYPES)
    contact_phone = models.CharField(max_length=20)
    contact_email = models.EmailField(blank=True)
    photo_reference = models.CharField(max_length=256, blank=True)

    def __str__(self) -> str:
        return f"{self.full_name} ({self.id_number})"


class BlacklistEntry(models.Model):
    id_number = models.CharField(max_length=64, db_index=True)
    reason = models.CharField(max_length=200)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Blacklist Entries"

    def __str__(self) -> str:
        return f"{self.id_number} ({'active' if self.active else 'inactive'})"


class Visit(models.Model):
    REGISTERED = "registered"
    ID_VERIFIED = "id_verified"
    PASS_ISSUED = "pass_issued"
    INSIDE = "inside"
    EXITED = "exited"
    DENIED = "denied"

    STATUSES = [
        (REGISTERED, "Registered"),
        (ID_VERIFIED, "ID Verified"),
        (PASS_ISSUED, "Pass Issued"),
        (INSIDE, "Inside"),
        (EXITED, "Exited"),
        (DENIED, "Denied"),
    ]

    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name="visits")
    purpose = models.CharField(max_length=200)
    host_name = models.CharField(max_length=120)
    host_department = models.CharField(max_length=120)
    host_contact = models.CharField(max_length=50, blank=True)
    expected_duration_minutes = models.PositiveIntegerField(default=60)
    status = models.CharField(max_length=20, choices=STATUSES, default=REGISTERED)
    registered_at = models.DateTimeField(auto_now_add=True)

    verified_at = models.DateTimeField(null=True, blank=True)
    pass_issued_at = models.DateTimeField(null=True, blank=True)
    entry_at = models.DateTimeField(null=True, blank=True)
    exit_at = models.DateTimeField(null=True, blank=True)

    denial_reason = models.CharField(max_length=200, blank=True)
    denial_remarks = models.TextField(blank=True)
    is_vip = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"Visit #{self.pk} - {self.visitor.full_name} ({self.status})"


def _generate_pass_number() -> str:
    return "VMS-" + uuid.uuid4().hex[:10]


def calculate_valid_until(start_time, duration_minutes, is_vip=False):
    extra = 60 if is_vip else 0
    return start_time + timedelta(minutes=int(duration_minutes) + extra)


class VisitorPass(models.Model):
    PENDING = "pending"
    ISSUED = "issued"
    RETURNED = "returned"
    LOST = "lost"

    STATUSES = [
        (PENDING, "Pending"),
        (ISSUED, "Issued"),
        (RETURNED, "Returned"),
        (LOST, "Lost"),
    ]

    visit = models.OneToOneField(Visit, on_delete=models.CASCADE, related_name="visitor_pass")
    pass_number = models.CharField(max_length=32, unique=True, default=_generate_pass_number)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField()
    authorized_zones = models.CharField(max_length=200, default="public")
    status = models.CharField(max_length=20, choices=STATUSES, default=PENDING)
    barcode_data = models.TextField(blank=True)
    is_vip_pass = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.pass_number

    def build_qr_payload(self):
        visit = self.visit
        return {
            "pass_number": self.pass_number,
            "visitor_name": visit.visitor.full_name,
            "valid_from": self.valid_from.isoformat(),
            "valid_until": self.valid_until.isoformat(),
            "authorized_zones": self.authorized_zones,
            "host": visit.host_name,
            "department": visit.host_department,
        }

    def generate_qr_data_uri(self) -> str:
        payload = self.build_qr_payload()
        qr = pyqrcode.create(json.dumps(payload, separators=(",", ":"), ensure_ascii=False))
        buf = BytesIO()
        qr.png(buf, scale=6)
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        return f"data:image/png;base64,{b64}"


class VerificationLog(models.Model):
    MANUAL = "manual"
    BIOMETRIC = "biometric"
    METHODS = [
        (MANUAL, "Manual"),
        (BIOMETRIC, "Biometric"),
    ]

    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name="verification_logs")
    verifier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="vms_verifications",
    )
    method = models.CharField(max_length=20, choices=METHODS)
    result = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class DenialLog(models.Model):
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name="denials")
    reason = models.CharField(max_length=120)
    remarks = models.TextField(blank=True)
    escalated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class EntryExitLog(models.Model):
    ENTRY = "entry"
    EXIT = "exit"
    ACTIONS = [
        (ENTRY, "Entry"),
        (EXIT, "Exit"),
    ]

    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name="movement_logs")
    action = models.CharField(max_length=10, choices=ACTIONS)
    gate_name = models.CharField(max_length=120)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="vms_movements",
    )
    items_declared = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class SecurityIncident(models.Model):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    SEVERITIES = [
        (CRITICAL, "Critical"),
        (HIGH, "High"),
        (MEDIUM, "Medium"),
        (LOW, "Low"),
    ]

    UNAUTHORIZED_ACCESS = "unauthorized_access"
    POLICY_VIOLATION = "policy_violation"
    EQUIPMENT_FAILURE = "equipment_failure"
    SUSPICIOUS_BEHAVIOR = "suspicious_behavior"
    OTHER = "other"
    ISSUE_TYPES = [
        (UNAUTHORIZED_ACCESS, "Unauthorized Access"),
        (POLICY_VIOLATION, "Policy Violation"),
        (EQUIPMENT_FAILURE, "Equipment Failure"),
        (SUSPICIOUS_BEHAVIOR, "Suspicious Behavior"),
        (OTHER, "Other"),
    ]

    visitor = models.ForeignKey(
        Visitor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incidents",
    )
    visit = models.ForeignKey(
        Visit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incidents",
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="vms_incidents",
    )
    severity = models.CharField(max_length=10, choices=SEVERITIES)
    issue_type = models.CharField(max_length=40, choices=ISSUE_TYPES)
    description = models.TextField()
    status = models.CharField(max_length=20, default="open")
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def requires_escalation(self) -> bool:
        return self.severity in {self.CRITICAL, self.HIGH}

