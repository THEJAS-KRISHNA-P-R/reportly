import Link from 'next/link';

const links = {
  Product: [
    { label: 'Features',    href: '/#features' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Pricing',     href: '/pricing' },
    { label: 'Changelog',   href: '#' },
  ],
  Company: [
    { label: 'About',   href: '/about' },
    { label: 'Blog',    href: '#' },
    { label: 'Careers', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Use',   href: '#' },
    { label: 'Security',       href: '#' },
  ],
};

export function Footer() {
  return (
    <footer style={{ background: '#000000', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="container py-16">
        <div className="grid md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
              Reportly
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)', maxWidth: 280 }}>
              Automated marketing reports for agencies that take their work seriously.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse-dot"
                style={{ background: '#1A7A3A' }}
              />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                All systems operational
              </span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group} className="flex flex-col gap-4">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {group}
              </p>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm transition-opacity hover:opacity-100"
                      style={{ color: 'rgba(255,255,255,0.50)' }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {new Date().getFullYear()} Reportly. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Built for agencies. Made in India.
          </p>
        </div>
      </div>
    </footer>
  );
}
