import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Fusion.settings.development')
import sys
sys.path.append(os.getcwd())
django.setup()

from applications.vms.models import VMSSetting, Visit, Visitor
from applications.vms.services import get_setting, register_visitor, RegistrationError
from django.utils import timezone

def test_settings_retrieval():
    print("--- Testing Settings Retrieval ---")
    val = get_setting("CAMPUS_MAX_CAPACITY")
    print(f"CAMPUS_MAX_CAPACITY: {val}")
    assert val == "200", f"Expected 200, got {val}"
    
    val_default = get_setting("NON_EXISTENT", "default_val")
    print(f"NON_EXISTENT (with default): {val_default}")
    assert val_default == "default_val"
    print("Success: Settings retrieval works.")

def test_capacity_check():
    print("\n--- Testing Capacity Check ---")
    # Set capacity to 0
    setting = VMSSetting.objects.get(key="CAMPUS_MAX_CAPACITY")
    original_val = setting.value
    setting.value = "0"
    setting.save()
    
    data = {
        "full_name": "Test Visitor",
        "id_number": "TEST-123",
        "id_type": "passport",
        "contact_phone": "1234567890",
        "purpose": "Testing",
        "host_name": "Admin",
        "host_department": "IT",
    }
    
    try:
        register_visitor(data)
        print("FAILURE: Registration succeeded despite 0 capacity!")
    except RegistrationError as e:
        print(f"SUCCESS: Registration blocked as expected: {e}")
    finally:
        # Restore capacity
        setting.value = original_val
        setting.save()

if __name__ == "__main__":
    try:
        test_settings_retrieval()
        test_capacity_check()
    except Exception as e:
        print(f"Error during verification: {e}")
        sys.exit(1)
