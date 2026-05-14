import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;



  // If accessing protected routes without token, redirect to login
  if (pathname === "/" ) {
    console.log(token ? `Token found: ${token}` : "No token found");
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login",
    
  ],
};
