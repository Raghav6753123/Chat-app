import { NextResponse } from 'next/server';

export const AUTH_COOKIE = 'chatapp_token';

const protectedRoutes = ['/chatDashboard'];
const authRoutes = ['/signup-login-screen'];

export function middleware(request) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // If trying to access protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/signup-login-screen';
    return NextResponse.redirect(url);
  }

  // If trying to access auth route WITH token, redirect to dashboard
  if (isAuthRoute && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/chatDashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/chatDashboard/:path*', '/signup-login-screen/:path*'],
};
