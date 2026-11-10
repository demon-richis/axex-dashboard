import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeAnalyticsEvent } from "../src/lib/analytics.client.ts";

test("accepts the six approved product analytics events", () => {
  for (const event of [
    "add_axex_clicked",
    "dashboard_cta_clicked",
    "sample_case_opened",
    "sample_case_tab_changed",
    "faq_expanded",
    "landing_scroll_depth",
  ]) {
    assert.deepEqual(normalizeAnalyticsEvent({ event }), { event, properties: {} });
  }
});

test("keeps only allowlisted non-sensitive event properties", () => {
  assert.deepEqual(
    normalizeAnalyticsEvent({
      event: "sample_case_tab_changed",
      properties: {
        tab: "evidence",
        placement: "hero",
        percent: 90,
        topic: "faq-4",
        guildId: "private-guild",
        userId: "private-user",
        token: "secret",
      },
    }),
    {
      event: "sample_case_tab_changed",
      properties: { placement: "hero", tab: "evidence", topic: "faq-4", percent: 90 },
    },
  );
});

test("ignores unknown event names, malformed input and out-of-range properties", () => {
  assert.equal(normalizeAnalyticsEvent(null), null);
  assert.equal(normalizeAnalyticsEvent({ event: "oauth_login", properties: {} }), null);
  assert.deepEqual(
    normalizeAnalyticsEvent({
      event: "landing_scroll_depth",
      properties: { percent: 100, placement: "unknown", topic: "private text" },
    }),
    { event: "landing_scroll_depth", properties: {} },
  );
});
