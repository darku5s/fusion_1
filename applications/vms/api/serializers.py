from rest_framework import serializers

from applications.vms.models import (
    BlacklistEntry,
    DenialLog,
    EntryExitLog,
    ID_TYPES,
    SecurityIncident,
    VMSSetting,
    VerificationLog,
    Visit,
    Visitor,
    VisitorPass,
)


class VisitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitor
        fields = "__all__"


class VisitorPassSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorPass
        fields = "__all__"


class VerificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationLog
        fields = "__all__"


class DenialLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DenialLog
        fields = "__all__"


class EntryExitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntryExitLog
        fields = "__all__"


class SecurityIncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityIncident
        fields = "__all__"


class VisitSerializer(serializers.ModelSerializer):
    visitor = VisitorSerializer(read_only=True)
    gate_name = serializers.SerializerMethodField()
    authorized_zones = serializers.SerializerMethodField()

    class Meta:
        model = Visit
        fields = "__all__"

    def get_gate_name(self, obj: Visit):
        last = obj.movement_logs.order_by("-created_at").first()
        return last.gate_name if last else ""

    def get_authorized_zones(self, obj: Visit):
        try:
            return obj.visitor_pass.authorized_zones
        except VisitorPass.DoesNotExist:
            return ""


class BlacklistEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlacklistEntry
        fields = "__all__"


class VMSSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = VMSSetting
        fields = "__all__"


class RegisterVisitorSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    id_number = serializers.CharField(max_length=64)
    id_type = serializers.ChoiceField(choices=ID_TYPES)
    contact_phone = serializers.CharField(max_length=20)
    contact_email = serializers.EmailField(required=False, allow_blank=True)
    photo_reference = serializers.CharField(max_length=256, required=False, allow_blank=True)

    purpose = serializers.CharField(max_length=200)
    host_name = serializers.CharField(max_length=120)
    host_department = serializers.CharField(max_length=120)
    host_contact = serializers.CharField(max_length=50, required=False, allow_blank=True)
    expected_duration_minutes = serializers.IntegerField(min_value=5, default=60)
    is_vip = serializers.BooleanField(default=False)


class VerifyVisitorSerializer(serializers.Serializer):
    visit_id = serializers.IntegerField()
    method = serializers.ChoiceField(choices=[("manual", "manual"), ("biometric", "biometric")], default="manual")
    result = serializers.BooleanField()
    notes = serializers.CharField(required=False, allow_blank=True)


class IssuePassSerializer(serializers.Serializer):
    visit_id = serializers.IntegerField()
    authorized_zones = serializers.CharField(max_length=200, default="public")


class RecordMovementSerializer(serializers.Serializer):
    visit_id = serializers.IntegerField()
    gate_name = serializers.CharField(max_length=120)
    items_declared = serializers.CharField(required=False, allow_blank=True)


class DenyEntrySerializer(serializers.Serializer):
    visit_id = serializers.IntegerField()
    reason = serializers.CharField(max_length=120)
    remarks = serializers.CharField(required=False, allow_blank=True)
    escalated = serializers.BooleanField(default=False)


class SecurityIncidentCreateSerializer(serializers.Serializer):
    visit_id = serializers.IntegerField(required=False)
    visitor_id = serializers.IntegerField(required=False)
    severity = serializers.ChoiceField(choices=[("critical", "critical"), ("high", "high"), ("medium", "medium"), ("low", "low")])
    issue_type = serializers.ChoiceField(
        choices=[
            ("unauthorized_access", "unauthorized_access"),
            ("policy_violation", "policy_violation"),
            ("equipment_failure", "equipment_failure"),
            ("suspicious_behavior", "suspicious_behavior"),
            ("other", "other"),
        ]
    )
    description = serializers.CharField()

