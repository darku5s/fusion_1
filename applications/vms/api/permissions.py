from rest_framework import permissions

def is_in_group(user, group_name):
    return user.is_authenticated and (user.is_superuser or user.groups.filter(name=group_name).exists())

class IsVMSAdmin(permissions.BasePermission):
    """
    Allows access only to VMS Administrators.
    """
    def has_permission(self, request, view):
        return is_in_group(request.user, "VMS_Admin")

class IsVMSSecurityGuard(permissions.BasePermission):
    """
    Allows access only to VMS Security Guards.
    """
    def has_permission(self, request, view):
        return is_in_group(request.user, "VMS_Security")

class IsVMSStaff(permissions.BasePermission):
    """
    Allows access to both VMS Admins and Security Guards.
    """
    def has_permission(self, request, view):
        return is_in_group(request.user, "VMS_Admin") or is_in_group(request.user, "VMS_Security")

class IsVMSHost(permissions.BasePermission):
    """
    Allows access to users who are hosts of the specific visit or VMS Admins.
    """
    def has_permission(self, request, view):
        return is_in_group(request.user, "VMS_Admin") or is_in_group(request.user, "VMS_Host")

    def has_object_permission(self, request, view, obj):
        # Admins can do anything
        if is_in_group(request.user, "VMS_Admin"):
            return True
        # Hosts can only approve their own visits
        return obj.host == request.user


class IsVMSStudent(permissions.BasePermission):
    """
    Allows access only to VMS Students with limited privileges.
    """
    def has_permission(self, request, view):
        return is_in_group(request.user, "VMS_Student")


class IsVMSAdminOrStudent(permissions.BasePermission):
    """
    Allows access to VMS Administrators or Students.
    """
    def has_permission(self, request, view):
        return is_in_group(request.user, "VMS_Admin") or is_in_group(request.user, "VMS_Student")


class IsVMSAdminOrSecurity(permissions.BasePermission):
    """
    Allows access to VMS Administrators or Security Guards.
    """
    def has_permission(self, request, view):
        return is_in_group(request.user, "VMS_Admin") or is_in_group(request.user, "VMS_Security")
