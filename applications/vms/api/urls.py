from django.urls import path

from .views import (
    ActiveVisitorsView,
    ApproveVisitView,
    BlacklistEntryView,
    BlacklistView,
    DenyEntryView,
    ImportExportView,
    IssuePassView,
    RecentVisitsView,
    RecordEntryView,
    RecordExitView,
    RegisterVisitorView,
    ReportsView,
    SecurityIncidentView,
    SettingsView,
    VerifyVisitorView,
    vms_ui,
)

app_name = "vms"

urlpatterns = [
    path("ui/", vms_ui, name="ui"),
    path("register/", RegisterVisitorView.as_view(), name="register"),
    path("verify/", VerifyVisitorView.as_view(), name="verify"),
    path("pass/", IssuePassView.as_view(), name="pass"),
    path("entry/", RecordEntryView.as_view(), name="entry"),
    path("exit/", RecordExitView.as_view(), name="exit"),
    path("deny/", DenyEntryView.as_view(), name="deny"),
    path("approve/", ApproveVisitView.as_view(), name="approve"),
    path("blacklist/", BlacklistView.as_view(), name="blacklist"),
    path("blacklist/<str:id_number>/", BlacklistEntryView.as_view(), name="blacklist_entry"),
    path("reports/", ReportsView.as_view(), name="reports"),
    path("settings/", SettingsView.as_view(), name="settings"),
    path("import-export/", ImportExportView.as_view(), name="import_export"),
    path("active/", ActiveVisitorsView.as_view(), name="active"),
    path("recent/", RecentVisitsView.as_view(), name="recent"),
    path("incidents/", SecurityIncidentView.as_view(), name="incidents"),
]

