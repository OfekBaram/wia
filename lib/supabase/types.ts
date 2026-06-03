// Hand-written types for our public schema. Mirrors the SQL in
// `supabase/migrations/0001_initial_schema.sql`.
// In production you'd generate these via `supabase gen types typescript`.

import type { Gender, VenueCategory } from '@/lib/types'

export interface DbVenue {
  id:             string
  slug:           string
  name:           string
  tagline:        string | null
  category:       VenueCategory
  lat:            number
  lng:            number
  radius_meters:  number
  is_active:      boolean
  is_premium:     boolean
  owner_id:       string | null
  scan_secret:    string
  created_at:     string
  image_url:      string | null
}

export interface DbMasterProfile {
  user_id:    string
  name:       string | null
  age:        number | null
  gender:     Gender | null
  created_at: string
  updated_at: string
}

export interface DbPresence {
  id:             string
  user_id:        string
  venue_id:       string
  name:           string
  age:            number
  gender:         Gender
  status_text:    string
  selfie_url:     string
  is_ghost_mode:  boolean
  is_visible:     boolean
  joined_at:      string
  last_seen_at:   string
  expires_at:     string
}

export interface DbWave {
  id:               string
  venue_id:         string
  from_presence_id: string
  to_presence_id:   string
  emoji:            string
  created_at:       string
}

export interface DbAdminUser {
  user_id:    string
  granted_at: string
}

export interface Database {
  public: {
    Tables: {
      venues:           { Row: DbVenue;          Insert: Partial<DbVenue> & { slug: string; name: string; category: string; lat: number; lng: number }; Update: Partial<DbVenue> }
      master_profiles:  { Row: DbMasterProfile;  Insert: Partial<DbMasterProfile> & { user_id: string };                                                  Update: Partial<DbMasterProfile> }
      presence:         { Row: DbPresence;       Insert: Omit<DbPresence,  'id' | 'joined_at' | 'last_seen_at' | 'is_visible' | 'is_ghost_mode'> & Partial<Pick<DbPresence, 'is_visible' | 'is_ghost_mode'>>; Update: Partial<DbPresence> }
      waves:            { Row: DbWave;           Insert: Omit<DbWave,      'id' | 'created_at' | 'emoji'> & Partial<Pick<DbWave, 'emoji'>>;            Update: Partial<DbWave> }
      admin_users:      { Row: DbAdminUser;      Insert: { user_id: string };                                                                              Update: never }
    }
  }
}
