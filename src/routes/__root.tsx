import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";

function NotFound() {
  return (
    <main className="fatal-page">
      <p className="eyebrow">AXEX DASHBOARD</p>
      <h1>404</h1>
      <h2>That server isn’t here.</h2>
      <p>It may have been removed, or you may not have access.</p>
      <a className="button button-primary" href="/servers">
        Back to your servers
      </a>
    </main>
  );
}

function ErrorPage({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <main className="fatal-page">
      <p className="eyebrow">AXEX DASHBOARD</p>
      <div className="brand-mark" aria-hidden="true">
        AX
      </div>
      <h1>This page didn’t load</h1>
      <p>Something went wrong on our end. You can retry safely.</p>
      <div className="action-row">
        <button
          className="button button-primary"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Try again
        </button>
        <a className="button button-secondary" href="/">
          Go home
        </a>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Axex Dashboard" },
      {
        name: "description",
        content: "A clear, secure control room for your Axex Discord servers.",
      },
      { property: "og:title", content: "Axex Dashboard" },
      {
        property: "og:description",
        content: "A clear, secure control room for your Axex Discord servers.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preload",
        href: "/fonts/inter-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
