import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // supabaseResponse is reassigned inside setAll whenever the client refreshes tokens
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed cookies into the mutable request so subsequent
          // cookie reads in this middleware invocation stay consistent
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild supabaseResponse so the refreshed cookies land on the response
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the JWT server-side and triggers token refresh when needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    // Inject email into the forwarded request headers
    const headers = new Headers(request.headers);
    headers.set("x-user-email", user.email);

    const emailResponse = NextResponse.next({ request: { headers } });

    // Propagate any refreshed auth cookies from supabaseResponse so sessions
    // don't expire mid-use when the token was refreshed during this request
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      emailResponse.cookies.set(name, value, options);
    });

    return emailResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // API routes — header injection for /api/me* routes
    "/api/:path*",
    // App routes — session cookie refresh (Supabase SSR requirement)
    // Routing logic stays in server components; middleware only refreshes tokens here
    "/dashboard/:path*",
    "/job-seeker/:path*",
    "/recruiter/dashboard/:path*",
    "/recruiter/jobs/:path*",
    "/recruiter/settings/:path*",
    "/recruiter/billing/:path*",
  ],
};
