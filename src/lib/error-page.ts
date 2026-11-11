const MAX_REASON_LENGTH = 240;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeErrorReason(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown server failure";

  const message = error.message
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\b(Bearer|token|secret|password|authorization)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/(postgres(?:ql)?:\/\/)[^\s]+/gi, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim();

  if (!message) return error.name || "Unknown server failure";
  return ((error.name || "Error") + ": " + message).slice(0, MAX_REASON_LENGTH);
}

export function renderErrorPage(error?: unknown, requestId?: string): string {
  const reason = escapeHtml(safeErrorReason(error));
  const id = requestId ? escapeHtml(requestId) : "";
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Request failed · Axex</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111;color:#f5f3f0;font:16px/1.55 Inter,system-ui,sans-serif}.card{width:min(34rem,calc(100vw - 2rem));box-sizing:border-box;padding:2rem;text-align:left;border:1px solid #49302b;border-radius:1rem;background:#191716;box-shadow:0 18px 50px rgba(0,0,0,.28)}.eyebrow{margin:0 0 .75rem;color:#ffb21e;font-size:.72rem;font-weight:800;letter-spacing:.14em}.reason{margin:1rem 0;padding:.9rem 1rem;border:1px solid #49302b;border-radius:.7rem;background:#12100f;color:#f5f3f0;overflow-wrap:anywhere;font:500 .9rem/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.meta{color:#9e918c;font-size:.78rem}.actions{display:flex;justify-content:flex-start;gap:.75rem;flex-wrap:wrap;margin-top:1.25rem}h1{font-size:1.5rem;margin:.2rem 0 .6rem}p{color:#c3b8b4}.actions a{min-height:44px;padding:.65rem 1rem;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:.6rem;color:#17120e;background:#ffb21e;text-decoration:none;font-weight:700}.actions a.secondary{background:transparent;border:1px solid #59423b;color:#f5f3f0}</style></head><body><main class="card"><p class="eyebrow">AXEX DASHBOARD · REQUEST FAILED</p><h1>This page didn’t load</h1><p>The dashboard hit a server error. The failed reason is shown below so you can identify what actually broke.</p><div class="reason" role="alert">' + reason + '</div>' + (id ? '<p class="meta">Request ID: ' + id + '</p>' : "") + '<div class="actions"><a href="/?retry=1">Try again</a><a class="secondary" href="/">Go home</a></div></main></body></html>';
}
