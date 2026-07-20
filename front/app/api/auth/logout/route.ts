import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/auth/login", request.url));
  
  // Delete the auth cookie
  response.cookies.delete("auth_token");
  
  return response;
}
