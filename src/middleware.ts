import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Appliquer le middleware next-intl (gestion des locales)
  const intlResponse = intlMiddleware(request);
  const response = intlResponse ?? NextResponse.next({ request });

  // 2. Rafraichir la session Supabase (obligatoire sur chaque requete)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 3. Proteger les routes /[locale]/membre/*
  const isMemberRoute = /^\/(fr|en)\/membre/.test(pathname);
  if (isMemberRoute && !user) {
    const locale = pathname.startsWith("/en") ? "en" : "fr";
    return NextResponse.redirect(
      new URL(`/${locale}/connexion`, request.url)
    );
  }

  // 4. Proteger les routes /admin/*
  if (pathname.startsWith("/admin") && !user) {
    return NextResponse.redirect(new URL("/fr/connexion", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Routes next-intl (toutes sauf _next, api, auth, fichiers statiques)
    "/((?!_next|api|auth|.*\\..*).*)",
    "/",
  ],
};
