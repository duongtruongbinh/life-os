import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware for authentication protection.
 * - Unauthenticated users → redirect to /login
 * - Authenticated users on /login → redirect to /
 * - Public routes (auth callback, static assets) → allow through
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ["/login", "/auth/callback"];
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    // Static assets and API routes - skip auth check
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.includes(".") // Static files like favicon.ico
    ) {
        return NextResponse.next();
    }

    // Create Supabase client with cookie handling
    let response = NextResponse.next({ request });
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
                        response.cookies.set(name, value)
                    );
                },
            },
        }
    );

    // Refresh session and get user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Unauthenticated user trying to access protected route → redirect to login
    if (!user && !isPublicRoute) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Authenticated user on login page → redirect to home
    if (user && pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
