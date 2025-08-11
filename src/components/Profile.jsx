import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export default function Profile({ user }) {
  const [profile, setProfile] = useState({
    username: '',
    location: '',
    bio: '',
    skills: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
    }
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...profile,
        updated_at: new Date().toISOString()
      })

    if (!error) {
      alert('Profile updated!')
    }
    setLoading(false)
  }

  return (
    <div className="profile-container">
      <h2>👤 Your Profile</h2>
      <form onSubmit={updateProfile}>
        <input
          type="text"
          placeholder="Username"
          value={profile.username}
          onChange={(e) => setProfile({...profile, username: e.target.value})}
        />
        
        <input
          type="text"
          placeholder="Your location"
          value={profile.location}
          onChange={(e) => setProfile({...profile, location: e.target.value})}
        />
        
        <textarea
          placeholder="Brief bio..."
          value={profile.bio}
          onChange={(e) => setProfile({...profile, bio: e.target.value})}
          rows="3"
        />
        
        <textarea
          placeholder="Your skills (comma separated)"
          value={profile.skills}
          onChange={(e) => setProfile({...profile, skills: e.target.value})}
          rows="2"
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  )
}