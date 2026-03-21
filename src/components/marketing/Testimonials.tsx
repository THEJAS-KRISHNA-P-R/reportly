'use client';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/animations';

const testimonials = [
  {
    quote: "Reportly turned our end-of-month scramble into a completely automated Tuesday. The AI narrative is actually better than what our junior analysts were writing.",
    author: "Sarah Jenkins",
    role: "Founder, Westside Digital",
    initials: "SJ"
  },
  {
    quote: "We used to spend 40 hours a month copying numbers from GA4 into spreadsheets. Now it takes 0 hours. Our clients love the branded PDFs.",
    author: "David Chen",
    role: "Director of Analytics, Finex",
    initials: "DC"
  },
  {
    quote: "The ability to review and lightly edit the AI draft before sending gives us total confidence. It's the perfect mix of automation and control.",
    author: "Elena Rodriguez",
    role: "VP Marketing, Lumina Agency",
    initials: "ER"
  }
];

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32 bg-background border-b border-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        
        <motion.div 
          className="text-center max-w-[600px] mx-auto mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={fadeUp}
        >
          <h2 className="text-[32px] sm:text-[40px] font-bold text-foreground tracking-[-0.02em] mb-4">
            Don't just take our word for it.
          </h2>
          <p className="text-[17px] text-muted-foreground">
            Trusted by the fastest growing modern marketing agencies.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={staggerContainer}
        >
          {testimonials.map((t, i) => (
            <motion.div 
              key={i} 
              variants={fadeUp}
              className="bg-surface border border-border rounded-xl p-8 flex flex-col justify-between"
            >
              <div className="mb-8">
                {/* 5 Stars */}
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill="var(--color-warning)" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-[16px] text-foreground leading-relaxed">
                  "{t.quote}"
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {t.initials}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-foreground">{t.author}</div>
                  <div className="text-[13px] text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
