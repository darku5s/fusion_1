from django.core.management.base import BaseCommand
from applications.vms.models import VMSSetting

class Command(BaseCommand):
    help = 'Populates the database with default VMS system settings'

    def handle(self, *args, **options):
        defaults = [
            {
                'key': 'CAMPUS_MAX_CAPACITY',
                'value': '200',
                'description': 'Maximum number of visitors allowed inside the campus simultaneously.'
            },
            {
                'key': 'VIP_EXTRA_DURATION_MINS',
                'value': '60',
                'description': 'Additional duration (in minutes) granted to VIP visitors automatically.'
            },
            {
                'key': 'DEFAULT_VISIT_DURATION_MINS',
                'value': '60',
                'description': 'The default duration for a standard visit if not specified.'
            },
            {
                'key': 'REQUIRE_ID_VERIFICATION',
                'value': 'true',
                'description': 'Whether ID verification is mandatory before issuing a pass (true/false).'
            },
            {
                'key': 'ALLOWED_ID_TYPES',
                'value': 'passport,aadhaar,national_id,driver_license',
                'description': 'Comma-separated list of allowed ID types.'
            }
        ]

        for item in defaults:
            setting, created = VMSSetting.objects.get_or_create(
                key=item['key'],
                defaults={'value': item['value'], 'description': item['description']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created setting: {item["key"]}'))
            else:
                self.stdout.write(self.style.WARNING(f'Setting already exists: {item["key"]}'))

        self.stdout.write(self.style.SUCCESS('VMS settings population complete.'))
