from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from applications.vms.models import BlacklistEntry, Visit
from applications.vms.services import RegistrationError, register_visitor


class VmsModuleTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="pass1234")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_register_visitor_creates_visitor_and_visit(self):
        visitor, visit = register_visitor(
            {
                "full_name": "Alice Visitor",
                "id_number": "ID123",
                "id_type": "passport",
                "contact_phone": "9999999999",
                "contact_email": "alice@example.com",
                "photo_reference": "",
                "purpose": "Meeting",
                "host_name": "Bob Host",
                "host_department": "CSE",
                "host_contact": "",
                "expected_duration_minutes": 60,
                "is_vip": False,
            }
        )

        self.assertIsNotNone(visitor.pk)
        self.assertIsNotNone(visit.pk)
        self.assertEqual(visit.status, Visit.REGISTERED)
        self.assertEqual(visit.visitor_id, visitor.id)

    def test_blacklisted_visitor_is_rejected(self):
        BlacklistEntry.objects.create(id_number="BLK1", reason="Banned", active=True)
        with self.assertRaises(RegistrationError):
            register_visitor(
                {
                    "full_name": "Bad Actor",
                    "id_number": "BLK1",
                    "id_type": "passport",
                    "contact_phone": "123",
                    "contact_email": "",
                    "photo_reference": "",
                    "purpose": "Test",
                    "host_name": "Host",
                    "host_department": "Dept",
                    "host_contact": "",
                    "expected_duration_minutes": 60,
                    "is_vip": False,
                }
            )

    def test_post_register_returns_201(self):
        resp = self.client.post(
            "/vms/register/",
            data={
                "full_name": "Alice Visitor",
                "id_number": "IDX1",
                "id_type": "passport",
                "contact_phone": "9999999999",
                "contact_email": "alice@example.com",
                "photo_reference": "",
                "purpose": "Meeting",
                "host_name": "Bob Host",
                "host_department": "CSE",
                "host_contact": "",
                "expected_duration_minutes": 60,
                "is_vip": False,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)

    def test_get_active_returns_200(self):
        # Create a visit that qualifies as active
        _, visit = register_visitor(
            {
                "full_name": "Alice Visitor",
                "id_number": "IDACTIVE",
                "id_type": "passport",
                "contact_phone": "9999999999",
                "contact_email": "",
                "photo_reference": "",
                "purpose": "Meeting",
                "host_name": "Bob Host",
                "host_department": "CSE",
                "host_contact": "",
                "expected_duration_minutes": 60,
                "is_vip": False,
            }
        )
        visit.status = Visit.PASS_ISSUED
        visit.save(update_fields=["status"])

        resp = self.client.get("/vms/active/")
        self.assertEqual(resp.status_code, 200)

    def test_reports_endpoint(self):
        resp = self.client.get("/vms/reports/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("total_visitors", resp.data)

    def test_blacklist_management(self):
        resp = self.client.post("/vms/blacklist/", data={"id_number": "BAD01", "reason": "Policy", "active": True}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["id_number"], "BAD01")

    def test_host_approve_reject(self):
        _, visit = register_visitor(
            {
                "full_name": "Charles",
                "id_number": "IDAPPROVE",
                "id_type": "passport",
                "contact_phone": "8888888888",
                "contact_email": "",
                "photo_reference": "",
                "purpose": "Meeting",
                "host_name": "Host",
                "host_department": "Dept",
                "host_contact": "",
                "expected_duration_minutes": 60,
                "is_vip": False,
            }
        )
        resp = self.client.post("/vms/approve/", data={"visit_id": visit.id, "approved": True}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["visit_status"], "id_verified")

    def test_import_export_visitors(self):
        resp = self.client.post(
            "/vms/import-export/",
            data={"visitors": [{"id_number": "IMP1", "full_name": "Imported", "id_type": "aadhaar", "contact_phone": "7777777777"}]},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        resp = self.client.get("/vms/import-export/")
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.data, list)

