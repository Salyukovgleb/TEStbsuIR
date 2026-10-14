/**
 * BSUIR Flow — Schedule Source Manager & State Migration Service
 */

import { ScheduleSource, FlowAppState, SOURCE_COLORS } from '../types/scheduleSource';

const FLOW_STATE_KEY = 'bsuir_flow_state_v2';
const LEGACY_PROFILE_KEY = 'bsuir_hub_profile_v1';

const DEFAULT_STATE: FlowAppState = {
  version: 2,
  sources: [],
  activeSourceId: '',
  theme: 'system',
  notificationsEnabled: false,
  recentSearches: [],
  favorites: [],
};

export const ScheduleSourceService = {
  getState(): FlowAppState {
    try {
      const raw = localStorage.getItem(FLOW_STATE_KEY);
      if (raw) {
        const parsed: FlowAppState = JSON.parse(raw);
        if (parsed.version === 2) {
          return { ...DEFAULT_STATE, ...parsed };
        }
      }

      // Check for legacy migration from bsuir_hub_profile_v1
      const legacyRaw = localStorage.getItem(LEGACY_PROFILE_KEY);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        if (legacy.isOnboarded) {
          const migratedSource: ScheduleSource = {
            id: 'source_primary_' + Date.now(),
            type: legacy.role === 'teacher' ? 'teacher' : 'student',
            provider: legacy.role === 'teacher' ? 'bsuir_employee' : 'bsuir_group',
            providerEntityId: legacy.role === 'teacher' ? legacy.teacherUrlId || '' : legacy.groupNumber || '',
            displayName: legacy.role === 'teacher' ? (legacy.teacherFio || 'Моё расписание') : `Моя учёба (${legacy.groupNumber})`,
            subgroup: legacy.subgroup || 0,
            isPrimary: true,
            includeInCombined: true,
            isFavorite: true,
            colorMarker: SOURCE_COLORS[0],
            order: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            meta: {
              facultyAbbrev: legacy.facultyName,
              fio: legacy.teacherFio,
              department: legacy.teacherDepartment,
            },
          };

          const migratedState: FlowAppState = {
            version: 2,
            sources: [migratedSource],
            activeSourceId: migratedSource.id,
            theme: legacy.theme || 'system',
            notificationsEnabled: legacy.notificationsEnabled || false,
            recentSearches: [],
            favorites: legacy.favorites || [],
          };

          this.saveState(migratedState);
          return migratedState;
        }
      }
    } catch (e) {
      console.warn('Error reading BSUIR Flow state, using defaults:', e);
    }

    return DEFAULT_STATE;
  },

  saveState(state: FlowAppState): void {
    try {
      localStorage.setItem(FLOW_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save BSUIR Flow state:', e);
    }
  },

  getSources(): ScheduleSource[] {
    const state = this.getState();
    return [...state.sources].sort((a, b) => a.order - b.order);
  },

  getSourceById(id: string): ScheduleSource | undefined {
    return this.getState().sources.find((s) => s.id === id);
  },

  getActiveSource(): ScheduleSource | null {
    const state = this.getState();
    if (state.activeSourceId === 'combined') {
      return null;
    }
    const found = state.sources.find((s) => s.id === state.activeSourceId);
    if (found) return found;

    // Fallback to primary or first source
    const primary = state.sources.find((s) => s.isPrimary) || state.sources[0];
    if (primary) {
      this.setActiveSourceId(primary.id);
      return primary;
    }
    return null;
  },

  getActiveSourceId(): string {
    const state = this.getState();
    if (state.activeSourceId) return state.activeSourceId;
    const primary = state.sources.find((s) => s.isPrimary) || state.sources[0];
    return primary ? primary.id : '';
  },

  setActiveSourceId(id: string | 'combined'): void {
    const state = this.getState();
    state.activeSourceId = id;
    this.saveState(state);
  },

  addSource(
    sourceData: Omit<ScheduleSource, 'id' | 'createdAt' | 'updatedAt' | 'order'>
  ): ScheduleSource {
    const state = this.getState();
    const isFirst = state.sources.length === 0;

    const newSource: ScheduleSource = {
      ...sourceData,
      id: 'src_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      isPrimary: isFirst ? true : !!sourceData.isPrimary,
      includeInCombined: sourceData.type === 'friend' ? false : (sourceData.includeInCombined ?? true),
      order: state.sources.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      colorMarker: sourceData.colorMarker || SOURCE_COLORS[state.sources.length % SOURCE_COLORS.length],
    };

    if (newSource.isPrimary) {
      state.sources.forEach((s) => (s.isPrimary = false));
    }

    state.sources.push(newSource);
    state.activeSourceId = newSource.id;
    this.saveState(state);
    return newSource;
  },

  updateSource(id: string, updates: Partial<ScheduleSource>): void {
    const state = this.getState();
    const index = state.sources.findIndex((s) => s.id === id);
    if (index >= 0) {
      if (updates.isPrimary) {
        state.sources.forEach((s) => (s.isPrimary = false));
      }
      state.sources[index] = {
        ...state.sources[index],
        ...updates,
        updatedAt: Date.now(),
      };
      this.saveState(state);
    }
  },

  removeSource(id: string): void {
    const state = this.getState();
    const sourceToRemove = state.sources.find((s) => s.id === id);
    state.sources = state.sources.filter((s) => s.id !== id);

    // If removed active source, switch to primary or first available
    if (state.activeSourceId === id) {
      const remainingPrimary = state.sources.find((s) => s.isPrimary) || state.sources[0];
      state.activeSourceId = remainingPrimary ? remainingPrimary.id : '';
    }

    // If removed source was primary, make next one primary
    if (sourceToRemove?.isPrimary && state.sources.length > 0) {
      state.sources[0].isPrimary = true;
    }

    this.saveState(state);
  },

  setPrimarySource(id: string): void {
    const state = this.getState();
    state.sources.forEach((s) => {
      s.isPrimary = s.id === id;
    });
    this.saveState(state);
  },

  toggleIncludeInCombined(id: string): void {
    const state = this.getState();
    const source = state.sources.find((s) => s.id === id);
    if (source) {
      source.includeInCombined = !source.includeInCombined;
      this.saveState(state);
    }
  },

  getCombinedSources(): ScheduleSource[] {
    const state = this.getState();
    return state.sources.filter((s) => s.includeInCombined);
  },

  reorderSources(orderedIds: string[]): void {
    const state = this.getState();
    const map = new Map(state.sources.map((s) => [s.id, s]));
    const reordered: ScheduleSource[] = [];
    orderedIds.forEach((id, idx) => {
      const item = map.get(id);
      if (item) {
        item.order = idx;
        reordered.push(item);
      }
    });
    // Add any remaining
    state.sources.forEach((s) => {
      if (!orderedIds.includes(s.id)) {
        s.order = reordered.length;
        reordered.push(s);
      }
    });
    state.sources = reordered;
    this.saveState(state);
  },

  clearAll(): void {
    localStorage.removeItem(FLOW_STATE_KEY);
    localStorage.removeItem(LEGACY_PROFILE_KEY);
  },
};
