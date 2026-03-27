from __future__ import annotations

from typing import Optional

from .models import SecurityIncident, Visit


def get_current_staff(user) -> Optional[object]:
    if not getattr(user, "is_authenticated", False):
        return None
    return user


def get_active_visitors():
    return Visit.objects.filter(status__in=[Visit.INSIDE, Visit.PASS_ISSUED]).order_by("-registered_at")


def get_recent_visits(limit: int = 5):
    return Visit.objects.order_by("-registered_at")[:limit]


def get_incidents(limit: int = 20):
    return SecurityIncident.objects.order_by("-created_at")[:limit]

