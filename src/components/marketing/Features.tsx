'use client';
import { ShieldCheck, Brain, UserCheck, ScrollText } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';

const features = [
  {
    label: 'AI NARRATIVE ENGINE',
    icon: Brain,
    title: 'It writes the analysis for you.',
    body: 'Stop staring at line charts trying to find the story. Reportly identifies the "why" behind the numbers and writes a professional, agency-grade narrative explaining performance to your client.',
    image: <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 border-l-4 border-primary rounded-r-lg" />
  },
  {
    label: '100% WHITE-LABELED',
    icon: ShieldCheck,
    title: 'Your brand, front and center.',
    body: 'Every PDF report is styled with your agency\'s logo and brand colors. Your clients never see the Reportly name — they just think you spend hours crafting gorgeous bespoke reports.',
    image: <div className="w-full h-full bg-white flex items-center justify-center border border-border rounded-lg shadow-sm"><span className="text-4xl font-bold text-primary">YOUR LOGO</span></div>,
    reverse: true
  },
  {
    label: 'CLIENT APPROVAL FLOW',
    icon: UserCheck,
    title: 'Nothing goes out without your sign-off.',
    body: 'We format the data and draft the narrative, but you keep total control. Review, edit, and approve every report in a clean review dashboard before it ever hits a client\'s inbox.',
    image: <div className="w-full h-full bg-surface border border-border rounded-lg p-6 flex flex-col items-center justify-center gap-4"><div className="h-10 w-32 bg-primary rounded-md flex items-center justify-center text-white font-medium text-sm">Approve & Send</div></div>
  },
  {
    label: 'AUTOMATED DELIVERY',
    icon: ScrollText,
    title: 'Set the schedule and forget it.',
    body: 'Connect the data sources once, pick a delivery day (e.g., the 3rd of every month), and Reportly handles the rest. Focus on strategy, not copy-pasting numbers into slides.',
    image: <div className="w-full h-full bg-muted border border-border rounded-lg flex flex-col justify-end overflow-hidden"><div className="h-2/3 w-3/4 mx-auto bg-white rounded-t-md border-x border-t border-border shadow-sm" /></div>,
    reverse: true
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-background border-b border-border">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-8">
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={fadeUp}
          className="text-center max-w-[600px] mx-auto mb-20"
        >
          <h2 className="text-[32px] sm:text-[40px] font-bold text-foreground tracking-[-0.02em] mb-4">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed">
            A focused tool built specifically for agency owners who value their time and their brand reputation.
          </p>
        </motion.div>

        <div className="space-y-24 sm:space-y-32">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-10%" }}
                variants={fadeUp}
                className={`flex flex-col gap-10 md:gap-16 items-center ${
                  feature.reverse ? 'md:flex-row-reverse' : 'md:flex-row'
                }`}
              >
                <div className="flex-1 w-full space-y-6">
                  <div className="inline-flex items-center gap-2">
                    <Icon size={16} className="text-primary" />
                    <span className="text-[11px] font-bold tracking-widest text-primary uppercase">
                      {feature.label}
                    </span>
                  </div>
                  <h3 className="text-[28px] sm:text-[32px] font-bold text-foreground leading-[1.15] tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-[16px] text-muted-foreground leading-relaxed">
                    {feature.body}
                  </p>
                </div>

                <div className="flex-1 w-full shrink-0">
                  <div className="aspect-[4/3] w-full rounded-2xl bg-surface border border-border overflow-hidden relative group">
                    {/* Optional hover spotlight effect simulated by a scale transition */}
                    <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
                      {feature.image}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
