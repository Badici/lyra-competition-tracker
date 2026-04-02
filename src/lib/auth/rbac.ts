import type { AuthUser, UserRole } from "@/types/models";

/** Admin, Django staff/superuser, or contest organizer — full admin UI. */
export function isPrivilegedUser(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.isStaff) return true;
  return user.role === "admin" || user.role === "organizer";
}

export function hasRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
