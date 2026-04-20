import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAuthRoute = createRouteMatcher(["/login(.*)", "/signup(.*)"]);
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/api/ask",
  "/api/export(.*)",
]);

export default clerkMiddleware(async (authFn, req) => {
  const { userId, redirectToSignIn } = await authFn();

  if (isProtectedRoute(req) && !userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (isAuthRoute(req) && userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
