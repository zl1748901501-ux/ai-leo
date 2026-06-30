import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, isSupabaseConfigured } from "./env";

const ownerRoutes = ["/dashboard", "/upload", "/assets", "/profile-generator", "/share"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return response;
  }

  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnerRoute = ownerRoutes.some((route) =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`),
  );

  if (!user && isOwnerRoute) {
    const urlToRedirect = request.nextUrl.clone();
    urlToRedirect.pathname = "/login";
    urlToRedirect.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(urlToRedirect);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const urlToRedirect = request.nextUrl.clone();
    urlToRedirect.pathname = "/dashboard";
    urlToRedirect.search = "";
    return NextResponse.redirect(urlToRedirect);
  }

  return response;
}
