import type { AppLocale } from "@/i18n/config";

export type NavLinkDef = { key: string; href: (locale: AppLocale) => string };
export type NavLink = { key: string; href: string };

export type NavGroupDef = {
  key: string;
  featured?: { titleKey: string; descriptionKey: string; href: (locale: AppLocale) => string };
  links: NavLinkDef[];
};
export type NavGroup = {
  key: string;
  featured?: { titleKey: string; descriptionKey: string; href: string };
  links: NavLink[];
};

export const NAV_GROUPS_DEF: NavGroupDef[] = [
  {
    key: "home",
    links: [{ key: "home", href: (l) => `/${l}` }]
  },
  {
    key: "about",
    featured: {
      titleKey: "nav.swamiji",
      descriptionKey: "hero.subtitle",
      href: (l) => `/${l}/swamiji`
    },
    links: [
      { key: "swamiji", href: (l) => `/${l}/swamiji` },
      { key: "ashram", href: (l) => `/${l}/ashram` }
    ]
  },
  {
    key: "offerings",
    links: [
      { key: "services", href: (l) => `/${l}/services` },
      { key: "events", href: (l) => `/${l}/events` },
      { key: "teachings", href: (l) => `/${l}/teachings` },
      { key: "donation", href: (l) => `/${l}/donation` }
    ]
  },
  {
    key: "subscriptions",
    links: [
      { key: "subscriptions", href: (l) => `/${l}/subscribe` }
    ]
  },
  {
    key: "initiatives",
    links: [
      { key: "gurukul", href: (l) => `/${l}/gurukul` }
    ]
  },
  {
    key: "connect",
    links: [{ key: "contact", href: (l) => `/${l}/contact` }]
  }
];

export function resolveNavGroups(locale: AppLocale): NavGroup[] {
  return NAV_GROUPS_DEF.map((group) => ({
    ...group,
    featured: group.featured
      ? { ...group.featured, href: group.featured.href(locale) }
      : undefined,
    links: group.links.map((link) => ({
      ...link,
      href: link.href(locale)
    }))
  }));
}
