export type AuditDetails = Record<string, unknown>;

function asDetails(value: unknown): AuditDetails {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as AuditDetails)
        : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AuditDetails) : {};
}

export function describeAuditAction(action: string, rawDetails: unknown): string {
  const details = asDetails(rawDetails);
  const role =
    details["role"] === "admin" ? "an admin" : details["role"] === "viewer" ? "a viewer" : null;

  switch (action) {
    case "add_admin":
      return role ? `Added ${role} to dashboard access` : "Added someone to dashboard access";
    case "change_role":
      return role ? `Changed role to ${role.replace(/^an? /, "")}` : "Changed a dashboard role";
    case "remove_admin":
      return "Removed someone from dashboard access";
    case "login":
      return "Signed in to the dashboard";
    default:
      return "Updated dashboard access";
  }
}

export function isGuildOnline(lastSeenAt: Date | string | number, nowMs = Date.now()): boolean {
  const timestamp =
    lastSeenAt instanceof Date ? lastSeenAt.getTime() : new Date(lastSeenAt).getTime();
  if (!Number.isFinite(timestamp)) return false;
  const ageMs = nowMs - timestamp;
  return ageMs >= -60_000 && ageMs <= 10 * 60_000;
}

export function relativeAge(value: Date | string | number, nowMs = Date.now()): string {
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Time unavailable";
  const seconds = Math.max(0, Math.floor((nowMs - timestamp) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} hr ago`;
  const days = Math.floor(seconds / 86_400);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.floor(months / 12);
  return `${years} yr${years === 1 ? "" : "s"} ago`;
}

export function isCalendarDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1970) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
