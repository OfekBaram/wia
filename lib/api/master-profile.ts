import { supabase } from '@/lib/supabase/client'
import type { DbMasterProfile } from '@/lib/supabase/types'
import type { Gender } from '@/lib/types'

export interface MasterProfile {
  userId:    string
  email:     string
  name:      string | null
  age:       number | null
  gender:    Gender | null
  isAdmin:   boolean
}

export async function getMyMasterProfile(): Promise<MasterProfile | null> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) return null

  const [profileRes, adminRes] = await Promise.all([
    sb.from('master_profiles').select('*').eq('user_id', userData.user.id).maybeSingle(),
    sb.from('admin_users').select('user_id').eq('user_id', userData.user.id).maybeSingle(),
  ])

  const p = profileRes.data as DbMasterProfile | null

  return {
    userId:  userData.user.id,
    email:   userData.user.email ?? '',
    name:    p?.name   ?? null,
    age:     p?.age    ?? null,
    gender:  p?.gender ?? null,
    isAdmin: !!adminRes.data,
  }
}

export async function upsertMasterProfile(input: {
  name:   string
  age:    number
  gender: Gender
}): Promise<void> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) throw new Error('Not signed in')

  const { error } = await sb
    .from('master_profiles')
    .upsert({
      user_id: userData.user.id,
      name:    input.name,
      age:     input.age,
      gender:  input.gender,
    })

  if (error) throw error
}
