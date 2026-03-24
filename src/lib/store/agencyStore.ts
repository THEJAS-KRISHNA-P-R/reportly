import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AgencyBranding } from '@/types/report';

interface AgencyState {
  branding: AgencyBranding | null;
  loading: boolean;
  error: string | null;
  setBranding: (branding: AgencyBranding) => void;
  updateBranding: (updates: Partial<AgencyBranding>) => void;
  fetchBranding: () => Promise<void>;
}

export const useAgencyStore = create<AgencyState>()(
  persist<AgencyState>(
    (set, get) => ({
      branding: null,
      loading: false,
      error: null,
      setBranding: (branding) => set({ branding, error: null }),
      updateBranding: (updates) => {
        const current = get().branding;
        if (current) {
          set({ branding: { ...current, ...updates } });
        }
      },
      fetchBranding: async () => {
        set({ loading: true });
        try {
          const res = await fetch('/api/agencies/branding');
          const data = await res.json();
          if (res.ok) {
            set({ branding: data.data, error: null });
          } else {
            set({ error: data.error || 'Failed to fetch branding' });
          }
        } catch {
          set({ error: 'Network error' });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'agency-intelligence-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : (null as any))),
    }
  )
);

