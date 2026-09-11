import { create } from 'zustand';

import type { Alarm, Mission } from './types';

/** Alarm being edited. Sub-screens (sound, wallpaper, mission config) mutate this; Save commits to the main store. */
interface DraftState {
  draft: Alarm | null;
  setDraft: (a: Alarm | null) => void;
  patch: (p: Partial<Alarm>) => void;
  upsertMission: (m: Mission, target?: 'missions' | 'unlock') => void;
  removeMission: (id: string, target?: 'missions' | 'unlock') => void;
}

export const useDraft = create<DraftState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  patch: (p) => set((s) => (s.draft ? { draft: { ...s.draft, ...p } } : s)),
  upsertMission: (m, target = 'missions') =>
    set((s) => {
      if (!s.draft) return s;
      const list = target === 'missions' ? s.draft.missions : s.draft.blocking.unlock.kind === 'mission' ? s.draft.blocking.unlock.missions : [];
      const i = list.findIndex((x) => x.id === m.id);
      const next = [...list];
      if (i >= 0) next[i] = m;
      else next.push(m);
      if (target === 'missions') return { draft: { ...s.draft, missions: next } };
      return { draft: { ...s.draft, blocking: { ...s.draft.blocking, unlock: { kind: 'mission', missions: next } } } };
    }),
  removeMission: (id, target = 'missions') =>
    set((s) => {
      if (!s.draft) return s;
      if (target === 'missions') return { draft: { ...s.draft, missions: s.draft.missions.filter((m) => m.id !== id) } };
      if (s.draft.blocking.unlock.kind !== 'mission') return s;
      return {
        draft: {
          ...s.draft,
          blocking: { ...s.draft.blocking, unlock: { kind: 'mission', missions: s.draft.blocking.unlock.missions.filter((m) => m.id !== id) } },
        },
      };
    }),
}));
