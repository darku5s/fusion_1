from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.http import HttpResponse
from django.utils import timezone

from applications.vms.models import DenialLog, Visit

from applications.vms.api.serializers import (
    BlacklistEntrySerializer,
    DenialLogSerializer,
    DenyEntrySerializer,
    IssuePassSerializer,
    RecordMovementSerializer,
    RegisterVisitorSerializer,
    SecurityIncidentCreateSerializer,
    SecurityIncidentSerializer,
    VisitSerializer,
    VerifyVisitorSerializer,
    VMSSettingSerializer,
    VisitorPassSerializer,
)
from applications.vms.selectors import get_active_visitors, get_incidents, get_recent_visits
from applications.vms.services import (
    RegistrationError,
    WorkflowError,
    clear_blacklist_entry,
    deny_entry,
    export_visitors_as_json,
    generate_visitor_report,
    get_blacklist_entries,
    get_system_settings,
    import_visitors_list,
    issue_pass,
    log_incident,
    record_entry,
    record_exit,
    register_visitor,
    set_blacklist_entry,
    set_system_setting,
    verify_visitor,
)


class RegisterVisitorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RegisterVisitorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            visitor, visit = register_visitor(serializer.validated_data)
        except RegistrationError as e:
            return Response({"detail": str(e)}, status=400)

        return Response(
            {
                "visitor": VisitSerializer(visit).data["visitor"],
                "visit_id": visit.id,
                "status": visit.status,
                "registered_at": visit.registered_at,
            },
            status=201,
        )


class VerifyVisitorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyVisitorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            visit = verify_visitor(serializer.validated_data, request.user)
        except WorkflowError as e:
            return Response({"detail": str(e), "visit_status": "denied"}, status=400)

        return Response({"detail": "Verification recorded.", "visit_status": visit.status}, status=200)


class IssuePassView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = IssuePassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            visit, vpass, qr = issue_pass(serializer.validated_data)
        except WorkflowError as e:
            return Response({"detail": str(e)}, status=400)

        return Response(
            {
                "detail": "Pass issued.",
                "visit_status": visit.status,
                "pass": VisitorPassSerializer(vpass).data,
                "qr_code": qr,
            },
            status=200,
        )


class RecordEntryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RecordMovementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            visit = record_entry(serializer.validated_data, request.user)
        except WorkflowError as e:
            return Response({"detail": str(e)}, status=400)

        return Response({"detail": "Entry recorded.", "visit_status": visit.status}, status=200)


class RecordExitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RecordMovementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            visit = record_exit(serializer.validated_data, request.user)
        except WorkflowError as e:
            return Response({"detail": str(e)}, status=400)

        return Response({"detail": "Exit recorded.", "visit_status": visit.status}, status=200)


class DenyEntryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DenyEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        visit, denial_log = deny_entry(serializer.validated_data)
        return Response(
            {"detail": "Visit denied.", "visit_status": visit.status, "denial_log": DenialLogSerializer(denial_log).data},
            status=200,
        )


class ApproveVisitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        visit_id = request.data.get("visit_id")
        approved = bool(request.data.get("approved", True))
        if not visit_id:
            return Response({"detail": "visit_id required"}, status=400)

        try:
            visit = Visit.objects.get(pk=visit_id)
        except Visit.DoesNotExist:
            return Response({"detail": "Visit not found"}, status=404)

        if approved:
            if visit.status in [Visit.REGISTERED, Visit.DENIED]:
                visit.status = Visit.ID_VERIFIED
                visit.verified_at = timezone.now()
                visit.denial_reason = ""
                visit.denial_remarks = ""
            visit.save(update_fields=["status", "verified_at", "denial_reason", "denial_remarks"])
            return Response({"detail": "Visit approved." , "visit_status": visit.status}, status=200)

        visit.status = Visit.DENIED
        visit.denial_reason = request.data.get("reason", "Host rejected")
        visit.denial_remarks = request.data.get("remarks", "")
        visit.save(update_fields=["status", "denial_reason", "denial_remarks"])
        DenialLog.objects.create(
            visit=visit,
            reason=visit.denial_reason,
            remarks=visit.denial_remarks,
            escalated=bool(request.data.get("escalated", False)),
        )
        return Response({"detail": "Visit rejected.", "visit_status": visit.status}, status=200)


class BlacklistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        active = request.query_params.get("active", "true").lower() != "false"
        entries = get_blacklist_entries(active_only=active)
        return Response(BlacklistEntrySerializer(entries, many=True).data, status=200)

    def post(self, request):
        serializer = BlacklistEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entry = set_blacklist_entry(serializer.validated_data)
        return Response(BlacklistEntrySerializer(entry).data, status=201)


class BlacklistEntryView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, id_number):
        clear_blacklist_entry(id_number)
        return Response({"detail": "Blacklist entry deactivated."}, status=204)


class ReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(generate_visitor_report(), status=200)


class SettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_system_settings(), status=200)

    def post(self, request):
        key = request.data.get("key")
        value = request.data.get("value")
        description = request.data.get("description", "")
        if not key or value is None:
            return Response({"detail": "key and value required"}, status=400)
        setting = set_system_setting(key, value, description)
        return Response(VMSSettingSerializer(setting).data, status=200)


class ImportExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = export_visitors_as_json()
        return Response(data, status=200)

    def post(self, request):
        visitors = request.data.get("visitors")
        if not isinstance(visitors, list):
            return Response({"detail": "visitors must be a list"}, status=400)
        created = import_visitors_list(visitors)
        return Response({"imported": len(created)}, status=201)


class ActiveVisitorsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        visits = get_active_visitors()
        return Response(VisitSerializer(visits, many=True).data, status=200)


class RecentVisitsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", "5"))
        except ValueError:
            limit = 5
        visits = get_recent_visits(limit=limit)
        return Response(VisitSerializer(visits, many=True).data, status=200)


class SecurityIncidentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", "20"))
        except ValueError:
            limit = 20
        incidents = get_incidents(limit=limit)
        return Response(SecurityIncidentSerializer(incidents, many=True).data, status=200)

    def post(self, request):
        serializer = SecurityIncidentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        incident = log_incident(serializer.validated_data, request.user)
        return Response(SecurityIncidentSerializer(incident).data, status=201)


def vms_ui(request):
    html = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VMS Frontend</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #f7f9fc; color: #1f2937; }
    .container { max-width: 1100px; margin: 0 auto; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
    .card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
    h1 { margin-top: 0; }
    h3 { margin: 0 0 10px 0; font-size: 18px; }
    label { display: block; margin: 6px 0 4px; font-size: 13px; font-weight: 600; }
    input, textarea, button { width: 100%; box-sizing: border-box; padding: 8px; border-radius: 8px; border: 1px solid #d1d5db; }
    textarea { min-height: 72px; resize: vertical; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .btn { cursor: pointer; background: #2563eb; color: #fff; border: none; margin-top: 10px; }
    .btn.secondary { background: #374151; }
    pre { background: #0f172a; color: #e2e8f0; border-radius: 10px; padding: 10px; overflow-x: auto; min-height: 120px; }
    .small { font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Visitor Management System</h1>
    <p class="small">Use a DRF token from your backend user. This page talks to existing endpoints under <code>/vms/</code>.</p>
    <div class="card">
      <label>Auth Token</label>
      <input id="token" placeholder="Paste token here" />
      <label style="margin-top:8px;">Base URL (optional)</label>
      <input id="baseUrl" value="/vms" />
    </div>

    <div class="grid" style="margin-top: 16px;">
      <div class="card">
        <h3>Register Visitor</h3>
        <div class="row">
          <input id="full_name" placeholder="Full name" />
          <input id="id_number" placeholder="ID number" />
        </div>
        <div class="row">
          <input id="id_type" placeholder="id_type (passport, aadhaar...)" />
          <input id="contact_phone" placeholder="Phone" />
        </div>
        <div class="row">
          <input id="contact_email" placeholder="Email" />
          <input id="photo_reference" placeholder="Photo reference (optional)" />
        </div>
        <div class="row">
          <input id="purpose" placeholder="Purpose" />
          <input id="host_name" placeholder="Host name" />
        </div>
        <div class="row">
          <input id="host_department" placeholder="Host department" />
          <input id="host_contact" placeholder="Host contact" />
        </div>
        <div class="row">
          <input id="expected_duration_minutes" placeholder="Expected duration (minutes)" value="60" />
          <input id="is_vip" placeholder="is_vip (true/false)" value="false" />
        </div>
        <button class="btn" onclick="registerVisitor()">POST /register/</button>
      </div>

      <div class="card">
        <h3>Verify + Pass + Entry + Exit</h3>
        <label>Visit ID</label>
        <input id="visit_id" placeholder="Visit id" />
        <div class="row">
          <input id="verify_result" placeholder="Verify result (true/false)" value="true" />
          <input id="verify_notes" placeholder="Verify notes (optional)" />
        </div>
        <label>Authorized zones</label>
        <input id="authorized_zones" placeholder="public,lab1" value="public" />
        <div class="row">
          <input id="gate_name" placeholder="Gate name" value="Main Gate" />
          <input id="items_declared" placeholder="Items declared (optional)" />
        </div>
        <div class="row">
          <button class="btn" onclick="verifyVisitor()">POST /verify/</button>
          <button class="btn" onclick="issuePass()">POST /pass/</button>
        </div>
        <div class="row">
          <button class="btn secondary" onclick="recordEntry()">POST /entry/</button>
          <button class="btn secondary" onclick="recordExit()">POST /exit/</button>
        </div>
      </div>

      <div class="card">
        <h3>Deny Entry</h3>
        <label>Visit ID</label>
        <input id="deny_visit_id" placeholder="Visit id" />
        <label>Reason</label>
        <input id="deny_reason" placeholder="Reason" />
        <label>Remarks</label>
        <textarea id="deny_remarks" placeholder="Remarks"></textarea>
        <button class="btn" onclick="denyEntry()">POST /deny/</button>
      </div>

      <div class="card">
        <h3>Quick Lists</h3>
        <button class="btn" onclick="fetchGet('/active/')">GET /active/</button>
        <button class="btn" onclick="fetchGet('/recent/')">GET /recent/</button>
        <button class="btn" onclick="fetchGet('/incidents/')">GET /incidents/</button>
        <button class="btn" onclick="fetchGet('/reports/')">GET /reports/</button>
        <button class="btn" onclick="fetchGet('/settings/')">GET /settings/</button>
        <button class="btn" onclick="fetchGet('/blacklist/')">GET /blacklist/</button>
      </div>

      <div class="card">
        <h3>Host Actions</h3>
        <div class="row">
          <input id="approve_visit_id" placeholder="Visit id" />
          <input id="approve_status" placeholder="approved true/false" value="true" />
        </div>
        <input id="approve_reason" placeholder="Reject reason" />
        <button class="btn" onclick="approveVisit()">POST /approve/</button>
      </div>

      <div class="card">
        <h3>Import / Export</h3>
        <button class="btn" onclick="fetchGet('/import-export/')">GET /import-export/</button>
        <button class="btn" onclick="importVisitors()">POST /import-export/</button>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <h3>Response</h3>
      <pre id="output">{ "status": "ready" }</pre>
    </div>
  </div>

  <script>
    function getHeaders() {
      const token = document.getElementById("token").value.trim();
      return {
        "Content-Type": "application/json",
        "Authorization": "Token " + token
      };
    }

    function base() {
      const b = document.getElementById("baseUrl").value.trim();
      return b.endsWith("/") ? b.slice(0, -1) : b;
    }

    function show(data) {
      document.getElementById("output").textContent = JSON.stringify(data, null, 2);
    }

    async function apiPost(path, payload) {
      try {
        const res = await fetch(base() + path, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        show({ status: res.status, data: data });
      } catch (err) {
        show({ error: String(err) });
      }
    }

    async function fetchGet(path) {
      try {
        const res = await fetch(base() + path, { headers: getHeaders() });
        const data = await res.json();
        show({ status: res.status, data: data });
      } catch (err) {
        show({ error: String(err) });
      }
    }

    function parseBool(v) {
      return String(v).toLowerCase() === "true";
    }

    function registerVisitor() {
      apiPost("/register/", {
        full_name: document.getElementById("full_name").value,
        id_number: document.getElementById("id_number").value,
        id_type: document.getElementById("id_type").value,
        contact_phone: document.getElementById("contact_phone").value,
        contact_email: document.getElementById("contact_email").value,
        photo_reference: document.getElementById("photo_reference").value,
        purpose: document.getElementById("purpose").value,
        host_name: document.getElementById("host_name").value,
        host_department: document.getElementById("host_department").value,
        host_contact: document.getElementById("host_contact").value,
        expected_duration_minutes: Number(document.getElementById("expected_duration_minutes").value || "60"),
        is_vip: parseBool(document.getElementById("is_vip").value)
      });
    }

    function verifyVisitor() {
      apiPost("/verify/", {
        visit_id: Number(document.getElementById("visit_id").value),
        method: "manual",
        result: parseBool(document.getElementById("verify_result").value),
        notes: document.getElementById("verify_notes").value
      });
    }

    function issuePass() {
      apiPost("/pass/", {
        visit_id: Number(document.getElementById("visit_id").value),
        authorized_zones: document.getElementById("authorized_zones").value
      });
    }

    function recordEntry() {
      apiPost("/entry/", {
        visit_id: Number(document.getElementById("visit_id").value),
        gate_name: document.getElementById("gate_name").value,
        items_declared: document.getElementById("items_declared").value
      });
    }

    function recordExit() {
      apiPost("/exit/", {
        visit_id: Number(document.getElementById("visit_id").value),
        gate_name: document.getElementById("gate_name").value,
        items_declared: document.getElementById("items_declared").value
      });
    }

    function denyEntry() {
      apiPost("/deny/", {
        visit_id: Number(document.getElementById("deny_visit_id").value),
        reason: document.getElementById("deny_reason").value,
        remarks: document.getElementById("deny_remarks").value,
        escalated: false
      });
    }

    function approveVisit() {
      apiPost("/approve/", {
        visit_id: Number(document.getElementById("approve_visit_id").value),
        approved: parseBool(document.getElementById("approve_status").value),
        reason: document.getElementById("approve_reason").value,
      });
    }

    function importVisitors() {
      const sample = [
        {
          id_number: "VIP-001",
          full_name: "Import Test",
          id_type: "national_id",
          contact_phone: "9999999999",
          contact_email: "import@test.com"
        }
      ];
      apiPost("/import-export/", {
        visitors: sample
      });
    }
  </script>
</body>
</html>"""
    return HttpResponse(html)

