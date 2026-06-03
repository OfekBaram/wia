// Reduced mock data — kept only for marketing illustrations on the public
// homepage. All real venue/presence data now lives in Supabase via `lib/api/*`.

import type { VenueCategory } from './types'

// ─── Venue category icons (used everywhere — admin, room headers, etc.) ──────
export const VENUE_EMOJI: Record<VenueCategory, string> = {
  bar:       '🍻',
  club:      '🎶',
  cafe:      '☕',
  festival:  '🎪',
  campus:    '🎓',
  gym:       '💪',
  coworking: '💻',
  hotel:     '🏨',
  airport:   '✈️',
  beach:     '🏖️',
  event:     '🎉',
}

export const GENDER_LABEL: Record<string, string> = {
  woman:           'Woman',
  man:             'Man',
  'non-binary':    'Non-binary',
  unspecified:     'Prefer not to say',
}

// ─── Hero illustration cards (marketing only — not real users) ───────────────
export const HERO_CARDS = [
  {
    name:              'Maya',
    age:               25,
    selfieUrl:         'https://randomuser.me/api/portraits/women/44.jpg',
    statusText:        'Looking for someone fun to dance with',
    arrivedMinutesAgo: 23,
  },
  {
    name:              'Tom',
    age:               28,
    selfieUrl:         'https://randomuser.me/api/portraits/men/32.jpg',
    statusText:        'Here with my band',
    arrivedMinutesAgo: 45,
  },
  {
    name:              'Zara',
    age:               24,
    selfieUrl:         'https://randomuser.me/api/portraits/women/68.jpg',
    statusText:        'Fire energy tonight',
    arrivedMinutesAgo: 8,
  },
  {
    name:              'Kai',
    age:               26,
    selfieUrl:         'https://randomuser.me/api/portraits/men/55.jpg',
    statusText:        'Down for a real chat',
    arrivedMinutesAgo: 15,
  },
]
