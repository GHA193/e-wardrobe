import { NextResponse } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Public paths that do not require authentication
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/auth') ||
        pathname === '/login' ||
        // Allow serving images
        pathname.startsWith('/uploads') ||
        // Allow static files in public folder
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Get the auth token from cookies
    const token = request.cookies.get('auth_token')?.value;

    // If no token exists and we're not on a public path, redirect to login
    if (!token) {
        // If it's an API route, return 401 Unauthorized
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Otherwise redirect to the login page
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Token is present, proceed
    return NextResponse.next();
}

export const config = {
    // Ignore static assets, next internals, but intercept pages and API
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
