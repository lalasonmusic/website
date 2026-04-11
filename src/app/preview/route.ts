import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const expected = process.env.PREVIEW_SECRET;

  if (!expected || token !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("lalason_preview", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
