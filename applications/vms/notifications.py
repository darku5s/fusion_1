from .models import VMSAlert

def create_alert(title, message, level=VMSAlert.INFO):
    """Creates a VMS alert that will be visible in the logs/dashboard."""
    return VMSAlert.objects.create(
        title=title,
        message=message,
        level=level
    )

def notify_denial(visit):
    create_alert(
        title=f"Visit Denied: {visit.visitor.full_name}",
        message=f"Visit #{visit.id} was denied. Reason: {visit.denial_reason}",
        level=VMSAlert.WARNING
    )

def notify_incident(incident):
    level = VMSAlert.CRITICAL if incident.requires_escalation else VMSAlert.SECURITY
    create_alert(
        title=f"Security Incident: {incident.issue_type}",
        message=f"Incident recorded by {incident.recorded_by}. Description: {incident.description}",
        level=level
    )

def notify_lost_pass(visit, vpass):
    create_alert(
        title=f"Lost Pass: {vpass.pass_number} (Visit #{visit.id})",
        message=f"Visitor {visit.visitor.full_name}'s pass {vpass.pass_number} was reported lost.",
        level=VMSAlert.WARNING
    )

def notify_blacklist_hit(id_number):
    create_alert(
        title="Blacklisted Visitor Detected",
        message=f"An attempt was made to register/verify visitor with ID: {id_number}, who is currently blacklisted.",
        level=VMSAlert.CRITICAL
    )

def notify_vip_arrival(visit):
    create_alert(
        title=f"VIP Arrival: {visit.visitor.full_name}",
        message=f"VIP Visitor {visit.visitor.full_name} (Level {visit.vip_level}) has arrived. Routine protocols in effect.",
        level=VMSAlert.SECURITY
    )

def log_vip_activity(visit, summary):
    from .models import SecurityIncident
    SecurityIncident.objects.create(
        visit=visit,
        visitor=visit.visitor,
        severity=SecurityIncident.LOW,
        issue_type=SecurityIncident.OTHER,
        description=f"VIP Activity Log: {summary}",
    )
