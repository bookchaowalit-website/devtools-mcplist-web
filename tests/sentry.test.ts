import assert from "node:assert/strict";
import { test } from "vitest";
import { scrubEvent, sentryOptions } from "@/lib/sentry";

test("Sentry stays disabled when no DSN is configured", () => {
  assert.equal(sentryOptions(undefined).enabled, false);
  assert.equal(sentryOptions("").enabled, false);
});

test("Sentry reports errors only: no PII, tracing, trace headers or breadcrumbs", () => {
  const options = sentryOptions("https://key@o0.ingest.sentry.io/1");
  assert.equal(options.enabled, true);
  assert.equal(options.sendDefaultPii, false);
  assert.equal(options.tracesSampleRate, undefined);
  assert.deepEqual(options.tracePropagationTargets, []);
  assert.equal(options.maxBreadcrumbs, 0);
  assert.equal(options.beforeSendTransaction(), null);
});

test("scrubEvent drops request data, user, breadcrumbs and extra context", () => {
  const event = scrubEvent({
    message: "boom",
    request: { url: "https://mcplist.bookchaowalit.com/?token=secret", headers: { cookie: "a=b" } },
    user: { ip_address: "1.2.3.4", email: "x@example.com" },
    breadcrumbs: [{ message: "clicked" }],
    extra: { body: "secret" },
  });
  assert.equal(event.message, "boom");
  assert.equal(event.request, undefined);
  assert.equal(event.user, undefined);
  assert.equal(event.breadcrumbs, undefined);
  assert.equal(event.extra, undefined);
});

test("scrubEvent removes local variables from stack frames", () => {
  const event = scrubEvent({
    exception: { values: [{ type: "Error", stacktrace: { frames: [{ function: "f", vars: { password: "p" } }] } }] },
  });
  const frame = event.exception?.values?.[0]?.stacktrace?.frames?.[0] as { function?: string; vars?: unknown } | undefined;
  assert.equal(frame?.function, "f");
  assert.equal(frame?.vars, undefined);
});
