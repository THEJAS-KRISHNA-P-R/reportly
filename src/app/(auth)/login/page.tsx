'use client';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const benefits = [
  'Automated Google Analytics reports',
  'AI narrative reviewed before sending',
  'Clients receive branded PDFs on schedule',
];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left — solid primary block */}
      <div className="hidden md:flex md:w-1/2 bg-foreground flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-sm" />
          </div>
          <span className="text-[16px] font-semibold text-white tracking-tight">Reportly</span>
        </div>

        <div>
          <p className="text-[36px] md:text-[40px] font-semibold text-white leading-[1.2] tracking-[-0.02em] mb-4">
            &ldquo;90 hours saved.
            <br />Every month.&rdquo;
          </p>
          <p className="text-[15px] text-white/60 mb-10">
            The average agency saves this much time on reporting with Reportly.
          </p>
          <ul className="space-y-3">
            {benefits.map(b => (
              <li key={b} className="flex items-center gap-3 text-[14px] text-white/80">
                <div className="w-5 h-5 rounded-full bg-success/20 border border-success/30 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-success" strokeWidth={2.5} />
                </div>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[12px] text-white/40">© {new Date().getFullYear()} Reportly</p>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 justify-center mb-8">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            <span className="text-[16px] font-semibold text-foreground tracking-tight">Reportly</span>
          </div>

          <h2 className="text-[26px] font-bold text-foreground tracking-[-0.01em] mb-1">
            Sign in to your account
          </h2>
          <p className="text-[14px] text-muted-foreground mb-8">
            New here?{' '}
            <Link href="/register" className="text-primary hover:text-primary/80 transition-colors font-medium">
              Create an account
            </Link>
          </p>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" placeholder="you@agency.com" required />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <Link href="#" className="text-[12px] font-medium text-muted-foreground hover:text-primary transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input id="login-password" type="password" placeholder="••••••••" required />
            </div>

            <Button type="submit" className="w-full pt-1 pb-1">
              Sign in
            </Button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[12px] text-muted-foreground uppercase tracking-widest font-bold">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button variant="outline" type="button" className="w-full gap-2 font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
