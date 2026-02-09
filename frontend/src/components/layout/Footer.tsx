import Link from "next/link";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { FOOTER_LINKS, localeHome } from "@/config/footer";
import { SacredDivider } from "@/components/ui/Decorative";
import { getDict } from "@/i18n/dict";
import { getGlobalComponent, getLocalizedField, getField } from "@/lib/cmsGlobals";

// Default quick links
const getDefaultQuickLinks = (locale: AppLocale) => [
  { label: locale === "en" ? "Home" : "होम", href: `/${locale}` },
  { label: locale === "en" ? "About Swamiji" : "स्वामीजी के बारे में", href: `/${locale}/swamiji` },
  { label: locale === "en" ? "Ashram" : "आश्रम", href: `/${locale}/ashram` },
  { label: locale === "en" ? "Services" : "सेवाएं", href: `/${locale}/services` },
  { label: locale === "en" ? "Events" : "कार्यक्रम", href: `/${locale}/events` },
  { label: locale === "en" ? "Contact" : "संपर्क", href: `/${locale}/contact` },
];

// Default offerings
const DEFAULT_OFFERINGS = [
  { en: "Poojan Services", hi: "पूजन सेवाएँ" },
  { en: "Daily Aarti", hi: "दैनिक आरती" },
  { en: "Sahasranama Path", hi: "सहस्रनाम पाठ" },
  { en: "Spiritual Retreats", hi: "आध्यात्मिक शिविर" },
  { en: "Donate", hi: "दान करें" },
];

// SVG Icon Components
const YouTubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const DEFAULT_SOCIAL_LINKS: { name: string; href: string; icon: React.ReactNode }[] = [
  { name: "YouTube", href: "https://youtube.com", icon: <YouTubeIcon /> },
  { name: "Instagram", href: "https://instagram.com", icon: <InstagramIcon /> },
  { name: "Facebook", href: "https://facebook.com", icon: <FacebookIcon /> },
  { name: "Telegram", href: "https://telegram.org", icon: <TelegramIcon /> },
];

const SOCIAL_ICON_MAP: Record<string, React.ReactNode> = {
  youtube: <YouTubeIcon />,
  instagram: <InstagramIcon />,
  facebook: <FacebookIcon />,
  telegram: <TelegramIcon />,
};

function parseJsonField<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

export default async function Footer({ locale }: { locale: AppLocale }) {
  const dict = getDict(locale);

  // Fetch CMS footer data
  const footerComp = await getGlobalComponent("footer");

  // CMS values with fallbacks
  const aboutDescription = footerComp
    ? getLocalizedField(footerComp.fields, "aboutDescription", locale,
        locale === "en"
          ? "Dedicated to spiritual upliftment and the timeless teachings of the ancient wisdom traditions."
          : "प्राचीन ज्ञान परंपराओं की शाश्वत शिक्षाओं और आध्यात्मिक उत्थान के लिए समर्पित।"
      )
    : (locale === "en"
        ? "Dedicated to spiritual upliftment and the timeless teachings of the ancient wisdom traditions."
        : "प्राचीन ज्ञान परंपराओं की शाश्वत शिक्षाओं और आध्यात्मिक उत्थान के लिए समर्पित।");

  const contactAddress = footerComp
    ? getLocalizedField(footerComp.fields, "contactAddress", locale, locale === "en" ? "Sri Pitambara Peeth" : "श्री पीताम्बरा पीठ")
    : (locale === "en" ? "Sri Pitambara Peeth" : "श्री पीताम्बरा पीठ");
  const contactPhone = footerComp
    ? getField(footerComp.fields, "contactPhone", "+91 1234567890")
    : "+91 1234567890";
  const contactEmail = footerComp
    ? getField(footerComp.fields, "contactEmail", "info@example.org")
    : "info@example.org";
  const copyrightText = footerComp
    ? getLocalizedField(footerComp.fields, "copyrightText", locale, locale === "en" ? "All rights reserved." : "सर्वाधिकार सुरक्षित।")
    : (locale === "en" ? "All rights reserved." : "सर्वाधिकार सुरक्षित।");
  const newsletterLabel = footerComp
    ? getLocalizedField(footerComp.fields, "newsletterLabel", locale, locale === "en" ? "Subscribe to Newsletter" : "न्यूज़लेटर की सदस्यता लें")
    : (locale === "en" ? "Subscribe to Newsletter" : "न्यूज़लेटर की सदस्यता लें");

  // Parse quick links from CMS or use defaults
  const defaultQuickLinks = getDefaultQuickLinks(locale);
  let quickLinks = defaultQuickLinks;
  if (footerComp) {
    const rawLinks = getField(footerComp.fields, "quickLinks", "");
    const parsed = parseJsonField<{ label: { en: string; hi: string }; href: string }[]>(rawLinks, []);
    if (parsed.length > 0) {
      quickLinks = parsed.map((l) => ({
        label: l.label?.[locale] || l.label?.en || "",
        href: l.href,
      }));
    }
  }

  // Parse offering links from CMS or use defaults
  let offeringItems: { label: string; href: string }[] = DEFAULT_OFFERINGS.map((item) => ({
    label: locale === "en" ? item.en : item.hi,
    href: `/${locale}/services`,
  }));
  if (footerComp) {
    const rawOfferings = getField(footerComp.fields, "offeringLinks", "");
    const parsed = parseJsonField<{ label: { en: string; hi: string }; href: string }[]>(rawOfferings, []);
    if (parsed.length > 0) {
      offeringItems = parsed.map((l) => ({
        label: l.label?.[locale] || l.label?.en || "",
        href: l.href,
      }));
    }
  }

  // Parse social links from CMS or use defaults
  let socialLinks = DEFAULT_SOCIAL_LINKS;
  if (footerComp) {
    const rawSocial = getField(footerComp.fields, "socialLinks", "");
    const parsed = parseJsonField<{ platform: string; url: string; icon?: string }[]>(rawSocial, []);
    if (parsed.length > 0) {
      socialLinks = parsed.map((s) => ({
        name: s.platform,
        href: s.url,
        icon: SOCIAL_ICON_MAP[s.icon?.toLowerCase() || s.platform.toLowerCase()] || <span>{s.platform[0]}</span>,
      }));
    }
  }

  // Check if aboutDescription is HTML (richtext)
  const isHtml = aboutDescription.includes("<");

  return (
    <footer
      style={{
        backgroundColor: 'var(--color-secondary)',
        borderTop: '1px solid var(--color-border)'
      }}
    >
      {/* Sacred Divider */}
      <SacredDivider icon="ॐ" />

      <Container className="pb-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand / About Section */}
          <div className="lg:col-span-1">
            <Link
              href={localeHome(locale)}
              className="flex items-center gap-3 mb-4"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-heading"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white'
                }}
              >
                ॐ
              </div>
              <span
                className="font-heading text-xl font-semibold"
                style={{ color: 'var(--color-primary)' }}
              >
                {dict.brand}
              </span>
            </Link>
            {isHtml ? (
              <div
                className="text-sm leading-relaxed mb-4"
                style={{ color: 'var(--color-muted)' }}
                dangerouslySetInnerHTML={{ __html: aboutDescription }}
              />
            ) : (
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: 'var(--color-muted)' }}
              >
                {aboutDescription}
              </p>
            )}
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 hover:scale-110"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                  title={link.name}
                  aria-label={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              className="font-heading text-lg font-semibold mb-4"
              style={{ color: 'var(--color-primary)' }}
            >
              {locale === "en" ? "Quick Links" : "त्वरित लिंक"}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Offerings */}
          <div>
            <h3
              className="font-heading text-lg font-semibold mb-4"
              style={{ color: 'var(--color-primary)' }}
            >
              {locale === "en" ? "Offerings" : "सेवाएँ"}
            </h3>
            <ul className="space-y-2">
              {offeringItems.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3
              className="font-heading text-lg font-semibold mb-4"
              style={{ color: 'var(--color-primary)' }}
            >
              {locale === "en" ? "Contact Us" : "संपर्क करें"}
            </h3>
            <address
              className="not-italic text-sm space-y-2 mb-4"
              style={{ color: 'var(--color-muted)' }}
            >
              <p>📍 {contactAddress}</p>
              <p>📞 {contactPhone}</p>
              <p>✉️ {contactEmail}</p>
            </address>

            {/* Newsletter Signup */}
            <div className="mt-4">
              <p
                className="text-sm mb-2 font-medium"
                style={{ color: 'var(--color-foreground)' }}
              >
                {newsletterLabel}
              </p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder={locale === "en" ? "Your email" : "आपका ईमेल"}
                  className="flex-1 px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-background)'
                  }}
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white'
                  }}
                >
                  {locale === "en" ? "Join" : "जुड़ें"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm"
          style={{
            borderTop: '1px solid var(--color-border)',
            color: 'var(--color-muted)'
          }}
        >
          <p>© {new Date().getFullYear()} {dict.brand}. {copyrightText}</p>

          <div className="flex flex-wrap gap-4">
            <Link href={`/${locale}`} className="hover:underline">
              {locale === "en" ? "Privacy Policy" : "गोपनीयता नीति"}
            </Link>
            <Link href={`/${locale}`} className="hover:underline">
              {locale === "en" ? "Terms of Service" : "सेवा की शर्तें"}
            </Link>
            {FOOTER_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
