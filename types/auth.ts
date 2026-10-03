/**
 * Authentication, RBAC, Users, Roles & Permissions Domain Types
 */

export type UserKind = "INTERNAL" | "SUPPLIER";

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  kind: UserKind;
  role_name: string;
  facility_assigned?: string;
  active: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions_count: number;
}

export interface Permission {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  facilityId?: string;
}
