export type ThemeId = 'eating' | 'hiking' | 'shopping' | 'games';

export const THEME_IDS: readonly ThemeId[] = ['eating', 'hiking', 'shopping', 'games'] as const;

export interface EventRecord {
  slug: string;
  title: string;
  theme: ThemeId;
  startDate: string;
  endDate: string;
  createdAt: number;
}

export interface Submission {
  name: string;
  dates: string[];
  updatedAt: number;
}

export interface EventPayload {
  event: EventRecord;
  submissions: Submission[];
}

export interface CreateEventRequest {
  title: string;
  theme: ThemeId;
  startDate: string;
  endDate: string;
}

export interface UpsertSubmissionRequest {
  name: string;
  dates: string[];
}

export const MAX_RANGE_DAYS = 90;
export const DEFAULT_RANGE_DAYS = 45;
export const MAX_TITLE_LEN = 120;
export const MAX_NAME_LEN = 40;
