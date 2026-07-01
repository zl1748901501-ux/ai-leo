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
    urlToRedirect.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(urlToRedirect);
  }

  if (user && isOwnerRoute) {
    const { data: ownProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);

    if ((ownProfiles ?? []).length === 0 && user.email) {
      const { data: ownInvitations } = await supabase
        .from("invitations")
        .select("id")
        .eq("visitor_email", user.email.trim().toLowerCase())
        .limit(1);

      if ((ownInvitations ?? []).length > 0) {
        const urlToRedirect = request.nextUrl.clone();
        urlToRedirect.pathname = "/no-access";
        urlToRedirect.searchParams.set("reason", "访客账号不能访问资料主人工作台。");
        return NextResponse.redirect(urlToRedirect);
      }
    }
  }

  if (user && request.nextUrl.pathname === "/login") {
    const urlToRedirect = request.nextUrl.clone();
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    if (redirectTo?.startsWith("/")) {
      const [pathname, search = ""] = redirectTo.split("?");
      urlToRedirect.pathname = pathname;
      urlToRedirect.search = search ? `?${search}` : "";
    } else {
      urlToRedirect.pathname = "/dashboard";
      urlToRedirect.search = "";
    }
    return NextResponse.redirect(urlToRedirect);
  }

  return response;
}
