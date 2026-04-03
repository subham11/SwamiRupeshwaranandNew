import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || "srw-cms-revalidate-2026";

/**
 * On-demand revalidation endpoint called by the backend CMS after content updates.
 *
 * POST /api/revalidate
 * Body: { secret: string, paths?: string[], slugs?: string[] }
 *
 * - `paths`: explicit paths to revalidate (e.g. ["/en/maha-yagya", "/hi/events"])
 * - `slugs`: CMS page slugs — automatically expands to both locale paths
 *
 * If neither paths nor slugs provided, revalidates the entire site layout.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, paths, slugs } = body as {
      secret?: string;
      paths?: string[];
      slugs?: string[];
    };

    if (secret !== REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const revalidated: string[] = [];

    // Revalidate explicit paths
    if (paths && paths.length > 0) {
      for (const path of paths) {
        revalidatePath(path);
        revalidated.push(path);
      }
    }

    // Revalidate by CMS slug — expand to both locales
    if (slugs && slugs.length > 0) {
      for (const slug of slugs) {
        const enPath = `/en/${slug}`;
        const hiPath = `/hi/${slug}`;
        revalidatePath(enPath);
        revalidatePath(hiPath);
        revalidated.push(enPath, hiPath);
      }
    }

    // If nothing specific, revalidate layout (header/footer global components)
    if (revalidated.length === 0) {
      revalidatePath("/en", "layout");
      revalidatePath("/hi", "layout");
      revalidated.push("/en (layout)", "/hi (layout)");
    }

    return NextResponse.json({
      revalidated,
      now: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to revalidate", detail: String(err) },
      { status: 500 }
    );
  }
}
