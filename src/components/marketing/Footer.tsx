const footerLinks = {
  Product: ['Features', 'Pricing', 'Changelog', 'Roadmap'],
  Company: ['About', 'Blog', 'Careers', 'Contact'],
  Legal:   ['Privacy', 'Terms', 'Security', 'Cookies'],
};

export function Footer() {
  return (
    <footer className="bg-[var(--bg-dark)] text-[var(--text-muted)] py-16 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-sm" />
              </div>
              <span className="text-[16px] font-semibold text-white tracking-tight">Reportly</span>
            </div>
            <p className="text-[14px] leading-relaxed max-w-xs">
              Automated marketing reports for agencies that care about accuracy and their clients.
            </p>
            <p className="text-[12px] mt-4">🇮🇳 Made in Kerala, India</p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/60 mb-4">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[14px] hover:text-white transition-colors duration-[120ms] ease-[ease]"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px]">© 2025 Reportly. All rights reserved.</p>
          <div className="flex items-center gap-2 text-[12px]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
