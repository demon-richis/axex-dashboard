import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy policy · Axex" }] }),
  component: () => <LegalPlaceholder title="Privacy policy" />,
});

function LegalPlaceholder({ title }: { title: string }) {
  return (
    <main className="fatal-page">
      <a className="brand" href="/">
        <span className="brand-mark">AX</span>
        <strong>Axex</strong>
      </a>
      <h1>{title}</h1>
      <p>
        [TO BE ADDED] This legal document has not been provided yet. Please contact the Axex support
        server for questions.
      </p>
      <a className="button button-secondary" href="/">
        Back to Axex
      </a>
    </main>
  );
}
