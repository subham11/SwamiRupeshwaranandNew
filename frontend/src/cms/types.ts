export type AppLocale = "en" | "hi";

export type Slug = string;

export type Page = {
  type: "page";
  slug: Slug;
  title: Record<AppLocale, string>;
  excerpt?: Record<AppLocale, string>;
  body?: Record<AppLocale, string>; // markdown or html string from CMS
  heroImage?: string; // /images/...
  updatedAt: string; // ISO
};

export type Event = {
  type: "event";
  id: string;
  slug: Slug;
  title: Record<AppLocale, string>;
  description: Record<AppLocale, string>;
  location: Record<AppLocale, string>;
  startAt: string; // ISO
  endAt?: string; // ISO
  heroImage?: string;
  status: "upcoming" | "past" | "cancelled";
};

export type Service = {
  type: "service";
  slug: Slug;
  title: Record<AppLocale, string>;
  shortDescription: Record<AppLocale, string>;
  longDescription?: Record<AppLocale, string>;
  icon?: string; // lucide name later, or image path
  heroImage?: string;
  order: number;
};

export type MediaItem =
  | {
      type: "media";
      id: string;
      kind: "youtube";
      title: Record<AppLocale, string>;
      url: string;
      thumbnail?: string;
      publishedAt?: string; // ISO
    }
  | {
      type: "media";
      id: string;
      kind: "image";
      title: Record<AppLocale, string>;
      url: string; // /images/...
      alt: Record<AppLocale, string>;
      aspect?: "square" | "landscape" | "portrait";
    };

export type ContentBundle = {
  pages: Page[];
  events: Event[];
  services: Service[];
  gallery: MediaItem[]; // images
  media: MediaItem[];   // youtube + images
};
