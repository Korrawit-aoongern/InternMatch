import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/auth/login", request.url));
  
  // Delete the auth cookies
  response.cookies.delete("auth_token");
  response.cookies.delete("token");
  
  return response;
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  
  // Delete the auth cookies
  response.cookies.delete("auth_token");
  response.cookies.delete("token");
  
  return response;
}

