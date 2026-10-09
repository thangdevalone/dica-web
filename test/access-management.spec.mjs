import assert from "node:assert/strict"
import test from "node:test"
import {
  authorizationKey,
  canManageRole,
  canManageUser,
  isOrganizationAdmin,
} from "../lib/access-management.ts"

const grant = (permissions, overrides = {}) => ({
  id: "g",
  roleCode: "DELEGATE",
  scopeType: "ORGANIZATION",
  facilityId: null,
  stockLocationId: null,
  departmentId: null,
  permissions,
  ...overrides,
})
const role = (code, permissions) => ({
  code,
  permissions: permissions.map((permissionCode) => ({ permissionCode })),
})

test("only organization ADMIN can manage protected roles and users", () => {
  const admin = role("ADMIN_OWNER", ["grant.assign"])
  const delegated = [grant(["grant.assign", "request.read"])]
  assert.equal(canManageRole(delegated, admin), false)
  assert.equal(canManageUser(delegated, { grants: [{ role: admin }] }), false)
  assert.equal(
    isOrganizationAdmin([
      grant([], {
        roleCode: "ADMIN_OWNER",
        scopeType: "FACILITY",
        facilityId: "A",
      }),
    ]),
    false
  )
  assert.equal(
    canManageRole([grant([], { roleCode: "ADMIN_OWNER" })], admin),
    true
  )
})
test("role choices respect permission scope and missing metadata fails closed", () => {
  const scoped = [
    grant(["grant.assign"]),
    grant(["request.read"], { scopeType: "FACILITY", facilityId: "A" }),
  ]
  assert.equal(canManageRole(scoped, role("STAFF", ["request.read"])), false)
  assert.equal(
    canManageRole([grant(["request.read"])], role("STAFF", ["request.read"])),
    true
  )
  assert.equal(canManageRole([grant([])], { code: "UNKNOWN" }), false)
  assert.equal(canManageUser([grant([])], {}), false)
})
test("permission fingerprints change with permissions/scopes but ignore ordering", () => {
  const a = [grant(["read", "write"])]
  assert.equal(
    authorizationKey(a),
    authorizationKey([grant(["write", "read"])])
  )
  assert.notEqual(authorizationKey(a), authorizationKey([grant(["read"])]))
  assert.notEqual(
    authorizationKey(a),
    authorizationKey([
      grant(["read", "write"], { scopeType: "FACILITY", facilityId: "A" }),
    ])
  )
})
