import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export const subscribeToNewPosts = (callback) => {
  return supabase
    .channel('posts')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'posts'
    }, callback)
    .subscribe()
}

export const subscribeToExchanges = (userId, callback) => {
  return supabase
    .channel('exchanges')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'exchanges',
      filter: `helper_id=eq.${userId},requester_id=eq.${userId}`
    }, callback)
    .subscribe()
}