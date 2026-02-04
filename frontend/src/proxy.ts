import { NextRequest, NextResponse } from "next/server";
import acceptLanguage from "accept-language";
import Negotiator from "negotiator";
import { i18nConfig, isLocale } from "@/i18n/config";

acceptLanguage.languages([...i18nConfig.locales]);

function negotiateLocale(req: NextRequest) {
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k] = v));
  const languages = new Negotiator({ headers }).languages();
  return acceptLanguage.get(languages.join(",")) || i18nConfig.defaultLocale;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ignore next internals / assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // if already locale-prefixed, continue
  if (first && isLocale(first)) return NextResponse.next();

  const locale = negotiateLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next).*)"]
};
