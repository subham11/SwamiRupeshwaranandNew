import type { CmsProvider } from "@/cms/provider";
import type { ContentBundle } from "@/cms/types";
import bundle from "@/content/bundle.json";

export class LocalJsonProvider implements CmsProvider {
  async getBundle(): Promise<ContentBundle> {
    // In future, you can add caching/revalidation or fetch from /api/cms.
    return bundle as unknown as ContentBundle;
  }
}
