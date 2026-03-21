import Link from 'next/link';
import { AreaChart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-background pt-20 pb-10 border-t border-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center">
                <AreaChart size={14} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">Reportly<span className="text-primary">.</span></span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
              Automated client reporting for modern marketing agencies. Stop pasting data, start building strategy.
            </p>
          </div>
          
          <div>
            <h4 className="text-[11px] font-bold tracking-widest text-foreground uppercase mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link></li>
              <li><Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How it Works</Link></li>
              <li><Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
              <li><Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">Report Templates</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-[11px] font-bold tracking-widest text-foreground uppercase mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">Agency Blog</Link></li>
              <li><Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground">Growth Guides</Link></li>
              <li><Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">Help Center</Link></li>
              <li><Link href="/api" className="text-sm text-muted-foreground hover:text-foreground">API Docs</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-[11px] font-bold tracking-widest text-foreground uppercase mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/security" className="text-sm text-muted-foreground hover:text-foreground">Security</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Reportly Inc. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center" />
            <span className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center" />
            <span className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center" />
          </div>
        </div>

      </div>
    </footer>
  );
}
