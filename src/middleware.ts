export { middlewareAuth as middleware } from "@/lib/auth-middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard", "/pay/:path*", "/pay"],
};
