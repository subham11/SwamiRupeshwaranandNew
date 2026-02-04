// Required for static export compatibility
export const dynamic = 'force-static';

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "/sitemap.xml"
  };
}
