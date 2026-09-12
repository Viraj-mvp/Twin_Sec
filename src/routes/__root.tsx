import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import "../styles.css";
import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { CookieConsent } from "@/components/CookieConsent";
import { KineticOperatorNav } from "@/components/KineticOperatorNav";
import { usePreferences } from "@/lib/auth-store";
import { OperatorProvider } from "@/contexts/OperatorContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-mono select-none">
      <div className="max-w-md w-full border-3 border-black bg-[#121214] p-8 text-center shadow-[8px_8px_0px_0px_#BFFF2E]">
        <span className="bg-[#BFFF2E] text-black font-black text-xs px-2.5 py-0.5 border border-black inline-block uppercase tracking-wider mb-3">
          404 · ROUTE NOT FOUND
        </span>
        <h1 className="text-7xl font-black text-[#F5F3E7] tracking-tight">404</h1>
        <h2 className="mt-2 text-lg font-bold text-[#F5F3E7] uppercase">Sector Unreachable</h2>
        <p className="mt-2 text-xs text-foreground/60 leading-relaxed">
          The requested coordinate does not exist in the TwinSec telemetry routing matrix.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center justify-center bg-[#BFFF2E] text-black border-2 border-black px-6 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] hover:bg-lime-300 transition-all cursor-pointer"
          >
            ← Return to Control Center
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-mono select-none">
      <div className="max-w-md w-full border-3 border-black bg-[#121214] p-8 text-center shadow-[8px_8px_0px_0px_#EF4444]">
        <span className="bg-[#EF4444] text-white font-black text-xs px-2.5 py-0.5 border border-black inline-block uppercase tracking-wider mb-3">
          CRITICAL SYSTEM INTERRUPT
        </span>
        <h1 className="text-2xl font-black text-[#F5F3E7] tracking-tight uppercase">
          Tactical Matrix Exception
        </h1>
        <p className="mt-2 text-xs text-foreground/60 leading-relaxed">
          An unhandled exception occurred in the live view pipeline. Re-initialize state or return
          home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex min-h-[44px] items-center justify-center bg-[#EF4444] text-white border-2 border-black px-5 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] hover:bg-red-600 transition-all cursor-pointer"
          >
            Re-Initialize State
          </button>
          <a
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center bg-[#18181B] text-[#F5F3E7] border-2 border-black px-5 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] hover:bg-black transition-all"
          >
            Return Home
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
      { title: "TwinSec" },
      { name: "description", content: "TwinSec Cyber-Physical Simulation Platform" },
      { name: "author", content: "TwinSec" },
      { property: "og:title", content: "TwinSec" },
      { property: "og:description", content: "TwinSec Cyber-Physical Simulation Platform" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap",
      },
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
  const [prefs] = usePreferences();
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("theme-amber", "theme-monochrome");
    if (prefs.theme === "amber") {
      root.classList.add("theme-amber");
    } else if (prefs.theme === "monochrome") {
      root.classList.add("theme-monochrome");
    }
  }, [prefs.theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <OperatorProvider>
        <Outlet />

        {/* Floating global operator menu (sign-in / profile / nav) — Hidden on Sign-In & Sign-Up pages */}
        {pathname !== "/login" && pathname !== "/signup" && <KineticOperatorNav />}

        {/* Cookie Banner */}
        <CookieConsent />
      </OperatorProvider>
    </QueryClientProvider>
  );
}
