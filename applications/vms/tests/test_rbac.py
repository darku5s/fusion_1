from django.contrib.auth.models import Group, User
from django.test import TestCase
from rest_framework.test import APIClient
from applications.vms.models import Visit, Visitor

class VmsRbacTests(TestCase):
    def setUp(self):
        # Create Roles (Groups)
        self.admin_group = Group.objects.create(name="VMS_Admin")
        self.security_group = Group.objects.create(name="VMS_Security")
        self.host_group = Group.objects.create(name="VMS_Host")

        # Create Users
        self.admin_user = User.objects.create_user(username="vms_admin", password="password")
        self.admin_user.groups.add(self.admin_group)

        self.security_user = User.objects.create_user(username="vms_guard", password="password")
        self.security_user.groups.add(self.security_group)

        self.host_user = User.objects.create_user(username="vms_host", password="password")
        self.host_user.groups.add(self.host_group)

        self.regular_user = User.objects.create_user(username="regular_user", password="password")

        self.client = APIClient()

    def test_admin_access_to_reports(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/vms/reports/")
        self.assertEqual(response.status_code, 200)

    def test_security_denied_reports(self):
        self.client.force_authenticate(user=self.security_user)
        response = self.client.get("/vms/reports/")
        self.assertEqual(response.status_code, 403)

    def test_security_access_to_verify(self):
        # Setup a visit to verify
        visitor = Visitor.objects.create(full_name="Test", id_number="123", id_type="passport", contact_phone="123")
        visit = Visit.objects.create(visitor=visitor, purpose="Test", host_name="Host", host_department="Dept")
        
        self.client.force_authenticate(user=self.security_user)
        response = self.client.post("/vms/verify/", data={"visit_id": visit.id, "result": True}, format="json")
        self.assertEqual(response.status_code, 200)

    def test_admin_access_to_blacklist(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/vms/blacklist/")
        self.assertEqual(response.status_code, 200)

    def test_host_access_to_approve(self):
        visitor = Visitor.objects.create(full_name="Test", id_number="456", id_type="passport", contact_phone="123")
        visit = Visit.objects.create(visitor=visitor, purpose="Test", host_name="Host", host_department="Dept")
        
        self.client.force_authenticate(user=self.host_user)
        response = self.client.post("/vms/approve/", data={"visit_id": visit.id, "approved": True}, format="json")
        self.assertEqual(response.status_code, 200)

    def test_unauthorized_access_is_blocked(self):
        self.client.force_authenticate(user=self.regular_user)
        # Try to access admin endpoint
        response = self.client.get("/vms/blacklist/")
        self.assertEqual(response.status_code, 403)
        # Try to access security endpoint
        response = self.client.get("/vms/active/")
        self.assertEqual(response.status_code, 403)
