import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Nav } from "../components/Nav";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="text-7xl font-bold tracking-tight" style={{ letterSpacing: "-0.04em", color: "oklch(0.25 0.04 265)" }}>404</div>
        <h2 className="text-lg font-semibold">Page not found</h2>
        <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>This route doesn't exist.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ background: "oklch(0.72 0.19 255)", color: "oklch(0.08 0.02 265)" }}
        >
          ← Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm" style={{ color: "oklch(0.55 0.04 255)" }}>An unexpected error occurred.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "oklch(0.72 0.19 255)", color: "oklch(0.08 0.02 265)" }}
          >
            Try again
          </button>
          <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.75 0.04 255)", border: "1px solid oklch(1 0 0 / 10%)" }}>
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AlgoViz — Algorithm Visualizer" },
      { name: "description", content: "Interactive visualizations of sorting, searching, tree, and pathfinding algorithms." },
      { name: "theme-color", content: "#0a0d16" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen grid-bg" style={{ background: "oklch(0.08 0.02 265)" }}>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6">
          <Outlet />
        </main>
        <footer className="mt-16 pb-8 text-center text-[11px]" style={{ color: "oklch(0.35 0.03 265)" }}>
          AlgoViz — built for learning
        </footer>
      </div>
    </QueryClientProvider>
  );
}
