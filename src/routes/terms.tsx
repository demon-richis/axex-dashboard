import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms · Axex" }] }),
  component: () => (
    <main className="fatal-page">
      <a className="brand" href="/">
        <span className="brand-mark">AX</span>
        <strong>Axex</strong>
      </a>
      <h1>Terms</h1>
      <p>
        [TO BE ADDED] This legal document has not been provided yet. Please contact the Axex support
        server for questions.
      </p>
      <a className="button button-secondary" href="/">
        Back to Axex
      </a>
    </main>
  ),
});
