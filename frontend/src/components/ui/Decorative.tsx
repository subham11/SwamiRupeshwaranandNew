/**
 * Decorative UI components inspired by:
 * - omswami.org (floral borders, ornate dividers)
 * - isha.sadhguru.org (clean dividers)
 * - gurudev.artofliving.org (elegant separators)
 */

// Sacred Divider with Om symbol or lotus
export function SacredDivider({ 
  icon = "✦", 
  className = "" 
}: { 
  icon?: string; 
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center gap-4 py-8 ${className}`}>
      <div 
        className="h-px w-24 sm:w-32 md:w-48"
        style={{ background: 'linear-gradient(to right, transparent, var(--color-gold))' }}
      />
      <span 
        className="text-2xl"
        style={{ color: 'var(--color-gold)' }}
      >
        {icon}
      </span>
      <div 
        className="h-px w-24 sm:w-32 md:w-48"
        style={{ background: 'linear-gradient(to left, transparent, var(--color-gold))' }}
      />
    </div>
  );
}

// Double Line Divider (like omswami.org)
export function DoubleDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 py-4 ${className}`}>
      <div 
        className="h-px w-40 sm:w-56"
        style={{ background: 'linear-gradient(to right, transparent, var(--color-gold), transparent)' }}
      />
      <div 
        className="h-px w-24 sm:w-32"
        style={{ background: 'linear-gradient(to right, transparent, var(--color-gold), transparent)' }}
      />
    </div>
  );
}

// Floral ornament for section starts
export function FloralOrnament({ 
  position = "top",
  className = "" 
}: { 
  position?: "top" | "bottom"; 
  className?: string;
}) {
  return (
    <div className={`flex justify-center ${className}`}>
      <span 
        className={`text-3xl ${position === "bottom" ? "rotate-180" : ""}`}
        style={{ color: 'var(--color-gold)', opacity: 0.7 }}
      >
        ❧
      </span>
    </div>
  );
}

// Section heading with decorative underline
export function SectionHeading({ 
  title, 
  subtitle,
  className = "",
  align = "center"
}: { 
  title: string; 
  subtitle?: string;
  className?: string;
  align?: "left" | "center" | "right";
}) {
  const alignClass = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end"
  }[align];

  return (
    <div className={`flex flex-col ${alignClass} mb-12 ${className}`}>
      <h2 
        className="font-heading text-3xl sm:text-4xl md:text-heading font-semibold mb-3"
        style={{ color: 'var(--color-primary)' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p 
          className="text-lg max-w-2xl"
          style={{ color: 'var(--color-muted)' }}
        >
          {subtitle}
        </p>
      )}
      <div 
        className="mt-4 h-1 w-20 rounded-full"
        style={{ backgroundColor: 'var(--color-gold)' }}
      />
    </div>
  );
}

// Quote block with decorative quotes
export function QuoteBlock({ 
  quote, 
  author,
  className = "" 
}: { 
  quote: string; 
  author?: string;
  className?: string;
}) {
  return (
    <blockquote 
      className={`relative px-8 py-6 md:px-12 md:py-8 rounded-lg ${className}`}
      style={{ backgroundColor: 'var(--color-secondary)' }}
    >
      {/* Opening quote */}
      <span 
        className="absolute top-2 left-4 text-6xl leading-none font-heading"
        style={{ color: 'var(--color-gold)', opacity: 0.3 }}
      >
        "
      </span>
      
      <p 
        className="relative z-10 font-heading text-xl md:text-2xl italic text-center"
        style={{ color: 'var(--color-primary)' }}
      >
        {quote}
      </p>
      
      {author && (
        <footer className="mt-4 text-center">
          <span 
            className="font-body text-sm font-medium"
            style={{ color: 'var(--color-muted)' }}
          >
            — {author}
          </span>
        </footer>
      )}
      
      {/* Closing quote */}
      <span 
        className="absolute bottom-2 right-4 text-6xl leading-none font-heading rotate-180"
        style={{ color: 'var(--color-gold)', opacity: 0.3 }}
      >
        "
      </span>
    </blockquote>
  );
}

// Lotus pattern background
export function LotusPattern({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none opacity-5 ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, var(--color-gold) 2px, transparent 2px),
                          radial-gradient(circle at 75% 75%, var(--color-gold) 2px, transparent 2px)`,
        backgroundSize: '60px 60px'
      }}
    />
  );
}

// Card with sacred styling
export function SacredCard({ 
  children, 
  className = "",
  hover = true
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  return (
    <div 
      className={`
        rounded-lg p-6 transition-all duration-300
        ${hover ? 'hover:shadow-sacred-hover hover:-translate-y-1' : ''}
        ${className}
      `}
      style={{ 
        backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}
    >
      {children}
    </div>
  );
}

// Event date badge (inspired by Art of Living)
export function EventBadge({ 
  day, 
  month,
  className = "" 
}: { 
  day: string | number; 
  month: string;
  className?: string;
}) {
  return (
    <div 
      className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg ${className}`}
      style={{ 
        backgroundColor: 'var(--color-primary)',
        color: 'white'
      }}
    >
      <span className="text-2xl font-bold leading-none">{day}</span>
      <span className="text-xs uppercase tracking-wider mt-1">{month}</span>
    </div>
  );
}

// Golden button
export function GoldenButton({ 
  children, 
  href,
  className = "" 
}: { 
  children: React.ReactNode; 
  href?: string;
  className?: string;
}) {
  const buttonClass = `
    inline-flex items-center justify-center gap-2 
    px-6 py-3 rounded-md font-medium
    transition-all duration-300 hover:shadow-golden hover:-translate-y-0.5
    ${className}
  `;

  const style = {
    background: 'linear-gradient(135deg, var(--color-gold), var(--color-accent))',
    color: 'var(--color-foreground)'
  };

  if (href) {
    return (
      <a href={href} className={buttonClass} style={style}>
        {children}
      </a>
    );
  }

  return (
    <button className={buttonClass} style={style}>
      {children}
    </button>
  );
}
