import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  // If accessing login page and already authenticated, redirect to home
  if (pathname === "/login" && token) {
    try {
      console.log(secret.toString());
      await jwtVerify(token, secret);
      return NextResponse.redirect(new URL("/", request.url));
    } catch (err) {
        console.log(`Invalid token on /login access: ${err}`);
      // Token is invalid, allow access to login
    }
  }

  // If accessing protected routes without token, redirect to login
  if (pathname === "/" || pathname === "/users") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/users"],
};
