import { supabase } from '@/lib/supabase/client'

/**
 * Upload a data-URL selfie to the `selfies` Storage bucket.
 * Returns a public URL that can be stored on the presence row.
 *
 * Layout: `{user_id}/{venue_slug}-{timestamp}.jpg`
 * Selfies are public-read (anyone in the room can see them) but write-restricted
 * by RLS to the owning user.
 */
export async function uploadSelfie(dataUrl: string, venueSlug: string): Promise<string> {
  const sb = supabase()
  const { data: userData } = await sb.auth.getUser()
  if (!userData.user) throw new Error('Not signed in')

  // Convert data URL → Blob
  const res  = await fetch(dataUrl)
  const blob = await res.blob()

  const filename = `${venueSlug}-${Date.now()}.jpg`
  const path     = `${userData.user.id}/${filename}`

  const { error } = await sb.storage
    .from('selfies')
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert:      true,
    })

  if (error) throw error

  const { data } = sb.storage.from('selfies').getPublicUrl(path)
  return data.publicUrl
}
