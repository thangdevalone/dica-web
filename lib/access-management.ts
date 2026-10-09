import type { PermissionGrant, Role, User } from "./api/types"

export function isOrganizationAdmin(grants: PermissionGrant[]): boolean {
  return grants.some(
    (grant) =>
      grant.roleCode === "ADMIN_OWNER" && grant.scopeType === "ORGANIZATION"
  )
}

export function canManageRole(grants: PermissionGrant[], role: Role): boolean {
  if (isOrganizationAdmin(grants)) return true
  if (role.code === "ADMIN_OWNER" || !role.permissions) return false
  const held = new Set(
    grants
      .filter((grant) => grant.scopeType === "ORGANIZATION")
      .flatMap((grant) => grant.permissions)
  )
  return role.permissions.every((permission) =>
    held.has(permission.permissionCode)
  )
}

export function canManageUser(grants: PermissionGrant[], user: User): boolean {
  return (
    Boolean(user.grants) &&
    user.grants!.every(
      (grant) => Boolean(grant.role) && canManageRole(grants, grant.role!)
    )
  )
}

/** Order-independent fingerprint; display-name edits do not invalidate data. */
export function authorizationKey(grants: PermissionGrant[]): string {
  return JSON.stringify(
    grants
      .map((grant) => ({
        id: grant.id,
        roleCode: grant.roleCode,
        scopeType: grant.scopeType,
        facilityId: grant.facilityId,
        stockLocationId: grant.stockLocationId,
        departmentId: grant.departmentId,
        permissions: [...grant.permissions].sort(),
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  )
}
