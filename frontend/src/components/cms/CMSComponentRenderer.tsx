"use client";

import type { AppLocale } from "@/i18n/config";
import BannerCarousel from "./BannerCarousel";
import ImageTextStrip from "./ImageTextStrip";
import PagePopup from "./PagePopup";

interface CMSComponentData {
  id: string;
  componentType: string;
  isVisible: boolean;
  displayOrder: number;
  fields: { key: string; value?: unknown; localizedValue?: Record<string, string> }[];
}

/** Extract a localized field value */
function getField(fields: CMSComponentData["fields"], key: string, locale: AppLocale): string | undefined {
  const field = fields.find((f) => f.key === key);
  if (!field) return undefined;
  if (field.localizedValue) return field.localizedValue[locale] || field.localizedValue.en;
  return field.value as string | undefined;
}

/** Extract a raw (non-localized) field value */
function getRaw<T = unknown>(fields: CMSComponentData["fields"], key: string): T | undefined {
  const field = fields.find((f) => f.key === key);
  return field?.value as T | undefined;
}

interface Props {
  component: CMSComponentData;
  locale: AppLocale;
}

export default function CMSComponentRenderer({ component, locale }: Props) {
  if (!component.isVisible) return null;

  switch (component.componentType) {
    case "banner_carousel":
      return (
        <BannerCarousel
          slides={(getRaw<any[]>(component.fields, "slides")) || []}
          autoplay={getRaw<boolean>(component.fields, "autoplay") ?? true}
          autoplayDelay={getRaw<number>(component.fields, "autoplayDelay") ?? 5000}
          showPagination={getRaw<boolean>(component.fields, "showPagination") ?? true}
          showNavigation={getRaw<boolean>(component.fields, "showNavigation") ?? true}
          loop={getRaw<boolean>(component.fields, "loop") ?? true}
          height={(getRaw<string>(component.fields, "height") as any) || "large"}
          locale={locale}
        />
      );

    case "image_text_strip":
      return (
        <ImageTextStrip
          title={getField(component.fields, "title", locale)}
          subtitle={getField(component.fields, "subtitle", locale)}
          items={(getRaw<any[]>(component.fields, "items")) || []}
          autoScroll={getRaw<boolean>(component.fields, "autoScroll") ?? true}
          scrollSpeed={getRaw<number>(component.fields, "scrollSpeed") ?? 3000}
          cardStyle={(getRaw<string>(component.fields, "cardStyle") as any) || "rounded"}
          showDescription={getRaw<boolean>(component.fields, "showDescription") ?? true}
          locale={locale}
        />
      );

    case "page_popup":
      return (
        <PagePopup
          componentId={component.id}
          popupType={(getRaw<string>(component.fields, "popupType")) || "image_with_text"}
          image={(getRaw<string>(component.fields, "image")) || ""}
          title={getField(component.fields, "title", locale)}
          description={getField(component.fields, "description", locale)}
          ctaText={getField(component.fields, "ctaText", locale)}
          ctaLink={(getRaw<string>(component.fields, "ctaLink")) || ""}
          delayMs={getRaw<number>(component.fields, "delayMs") ?? 2000}
          showOnce={getRaw<boolean>(component.fields, "showOnce") ?? true}
          animationStyle={(getRaw<string>(component.fields, "animationStyle")) || "scale"}
          overlayColor={(getRaw<string>(component.fields, "overlayColor")) || "rgba(0,0,0,0.6)"}
          locale={locale}
        />
      );

    default:
      return null;
  }
}
