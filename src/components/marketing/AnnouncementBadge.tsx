import { Sparkles } from "lucide-react";

export function AnnouncementBadge({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light border border-accent/20 mb-8 animate-fadeIn">
      <Sparkles size={14} className="text-accent-dark" />
      <span className="text-xs font-medium text-accent-dark">{text}</span>
    </div>
  );
}
