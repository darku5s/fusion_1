import os
import django
import json
import hmac
import hashlib

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Fusion.settings.development')
# We need to make sure the base directory is in sys.path
import sys
sys.path.append(os.getcwd())
django.setup()

from applications.vms.models import VisitorPass, Visit, Visitor, VMSAlert
from django.conf import settings
from django.utils import timezone

def verify_qr_logic():
    print("--- Verifying QR Signing Logic ---")
    # Get any object or create a mock if none
    vpass = VisitorPass.objects.first()
    if not vpass:
        print("No VisitorPass found in DB. Skipping...")
        return

    payload = vpass.generate_qr_payload()
    signature = vpass.generate_signature(payload)
    
    print(f"Payload: {payload}")
    print(f"Signature: {signature}")
    
    # Manually verify
    message = json.dumps(payload, sort_keys=True).encode()
    expected_sig = hmac.new(settings.SECRET_KEY.encode(), message, hashlib.sha256).hexdigest()
    
    if signature == expected_sig:
        print("SUCCESS: Signature matches expected HMAC.")
    else:
        print("FAILURE: Signature mismatch!")

def verify_alert_generation():
    print("\n--- Verifying Alert Generation ---")
    from applications.vms.notifications import notify_denial
    
    visit = Visit.objects.first()
    if not visit:
         print("No Visit found in DB. Skipping...")
         return
         
    visit.denial_reason = "Test Verification Failure"
    notify_denial(visit)
    
    alert = VMSAlert.objects.filter(title__icontains=visit.visitor.full_name).last()
    if alert and alert.level == VMSAlert.WARNING:
        print(f"SUCCESS: Alert generated: {alert.title} - {alert.message}")
    else:
        print("FAILURE: Alert not found or incorrect level.")

if __name__ == "__main__":
    try:
        verify_qr_logic()
        verify_alert_generation()
    except Exception as e:
        print(f"Error during verification: {e}")
