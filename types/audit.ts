/**
 * Audit Logging, System Events & Notifications Domain Types
 */

export type NotificationType = "INFO" | "WARNING" | "ALERT" | "SUCCESS";

export interface AuditEvent {
  id: string;
  action: string;
  resource: string;
  performed_by: string;
  user_email: string;
  ip_address: string;
  timestamp: string;
  summary: string;
  changes?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  link?: string;
}
