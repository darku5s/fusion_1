from django.urls import path

from .views import (
    ActiveVisitorsView,
    DenyEntryView,
    IssuePassView,
    RecentVisitsView,
    RecordEntryView,
    RecordExitView,
    RegisterVisitorView,
    SecurityIncidentView,
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
    path("active/", ActiveVisitorsView.as_view(), name="active"),
    path("recent/", RecentVisitsView.as_view(), name="recent"),
    path("incidents/", SecurityIncidentView.as_view(), name="incidents"),
]

