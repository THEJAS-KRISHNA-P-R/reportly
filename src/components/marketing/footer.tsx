import Link from 'next/link';

const links = {
  Product: [
    { label: 'Problem',     href: '/problem' },
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Features',    href: '/features' },
    { label: 'Pricing',     href: '/pricing' },
  ],
  Company: [
    { label: 'About',   href: '/about' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Use',   href: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="py-16" style={{ background: '#000000' }}>
      <div className="container px-6">
        <div className="grid md:grid-cols-5 gap-12 md:gap-16">
          {/* Brand */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="text-xl font-black tracking-tighter" style={{ color: '#FFFFFF' }}>
              Reportly
            </Link>
            <p className="text-sm font-medium leading-relaxed opacity-40" style={{ color: '#FFFFFF', maxWidth: 280 }}>
              Automated marketing reports for agencies that take their work seriously.
            </p>
            <div className="flex items-center gap-3 mt-4 px-4 py-2 rounded-full w-fit bg-white/5 backdrop-blur-sm">
              <span
                className="w-2 h-2 rounded-full shadow-[0_0_10px_#1A7A3A]"
                style={{ background: '#1A7A3A' }}
              />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Systems Operational
              </span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group} className="flex flex-col gap-6 items-start">
              <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-30" style={{ color: '#FFFFFF' }}>
                {group}
              </p>
              <ul className="space-y-4 items-start w-full">
                {items.map((item) => (
                  <li key={item.label} className="w-full">
                    <Link
                      href={item.href}
                      className="text-sm font-semibold transition-all hover:opacity-100 opacity-40 hover:translate-x-1 inline-block text-left w-full"
                      style={{ color: '#FFFFFF' }}
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
        <div className="mt-24 pt-10 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5">
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-20" style={{ color: '#FFFFFF' }}>
            &copy; {new Date().getFullYear()} Reportly — Intelligently Automated.
          </p>
          <div className="flex items-center gap-6 opacity-20">
             <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#FFFFFF' }}>
               Built for agencies.
             </p>
             <div className="w-1 h-1 rounded-full bg-white/30" />
             <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#FFFFFF' }}>
               Made in India.
             </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
