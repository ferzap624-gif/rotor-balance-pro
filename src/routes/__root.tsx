import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { TopBar } from "@/components/shell/TopBar";
import { SystemProvider } from "@/store/system-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="num text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Pantalla no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La ruta solicitada no existe en el sistema de balanceo.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al inicio
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
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Fallo en la interfaz</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Se produjo un error en la aplicación. Puede reintentar o volver al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-sm border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir al inicio
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
      { title: "Balanceador Dinámico — 1 y 2 Planos" },
      {
        name: "description",
        content:
          "Software de instrumentación para máquina de balanceo dinámico de rotores en 1 y 2 planos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <SystemProvider>
        <div className="flex min-h-screen w-full bg-background">
          <aside className="hidden w-[228px] shrink-0 border-r border-sidebar-border lg:block">
            <div className="sticky top-0 h-screen">
              <AppSidebar />
            </div>
          </aside>

          {menuOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                aria-label="Cerrar menú"
                className="absolute inset-0 bg-background/80"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute inset-y-0 left-0 w-[240px] border-r border-sidebar-border">
                <AppSidebar onNavigate={() => setMenuOpen(false)} />
              </div>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar onOpenMenu={() => setMenuOpen(true)} />
            <main className="min-w-0 flex-1 p-2 md:p-3">
              <Outlet />
            </main>
          </div>
        </div>
        <Toaster />
      </SystemProvider>
    </QueryClientProvider>
  );
}
