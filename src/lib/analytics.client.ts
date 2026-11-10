import { track } from "@vercel/analytics";

const allowedEvents = new Set([
  "add_axex_clicked",
  "dashboard_cta_clicked",
  "sample_case_opened",
  "sample_case_tab_changed",
  "faq_expanded",
  "landing_scroll_depth",
]);

export type AnalyticsEvent = {
  event: string;
  properties: Record<string, string | number | boolean>;
};

export function normalizeAnalyticsEvent(detail: unknown): AnalyticsEvent | null {
  if (!detail || typeof detail !== "object") return null;
  const input = detail as { event?: unknown; properties?: unknown };
  if (typeof input.event !== "string" || !allowedEvents.has(input.event)) return null;
  const properties =
    input.properties && typeof input.properties === "object"
      ? (input.properties as Record<string, unknown>)
      : {};
  const safe: Record<string, string | number | boolean> = {};
  const placement = properties["placement"];
  if (
    typeof placement === "string" &&
    ["navbar", "hero", "bottom", "mobile_sticky"].includes(placement)
  ) {
    safe["placement"] = placement;
  }
  const tab = properties["tab"];
  if (typeof tab === "string" && ["summary", "evidence", "timeline"].includes(tab)) {
    safe["tab"] = tab;
  }
  const topic = properties["topic"];
  if (typeof topic === "string" && /^faq-(?:[0-9]|1[0-5])$/.test(topic)) safe["topic"] = topic;
  const percent = properties["percent"];
  if (percent === 50 || percent === 90) safe["percent"] = percent;
  return { event: input.event, properties: safe };
}

export function sendAnalyticsEvent(detail: unknown): void {
  const normalized = normalizeAnalyticsEvent(detail);
  if (!normalized) return;
  try {
    track(normalized.event, normalized.properties);
  } catch {
    // Analytics is optional; tracking failures must not affect site interactions.
  }
}
