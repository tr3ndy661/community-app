import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { getCurrentLocation } from '../utils/geolocation'
import { Card, Button, Input, TextArea, Badge } from './ExpediaTheme'
import styled from 'styled-components'
import toast from 'react-hot-toast'

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const AvatarSection = styled.div`
  text-align: center;
  margin-bottom: 24px;
`

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0066cc, #003580);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: white;
  margin: 0 auto 16px;
  position: relative;
  overflow: hidden;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`

const StatCard = styled.div`
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
`

export default function Profile({ user }) {
  const [profile, setProfile] = useState({
    username: '',
    location: '',
    bio: '',
    skills: '',
    phone: '',
    emergency_contact: '',
    availability: '',
    trust_level: 0,
    verified: false
  })
  const [stats, setStats] = useState({
    posts_count: 0,
    exchanges_count: 0,
    completed_exchanges: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchStats()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setProfile(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      toast.error('Failed to load profile')
    }
  }

  const fetchStats = async () => {
    try {
      const [postsResult, exchangesResult] = await Promise.all([
        supabase
          .from('posts')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('exchanges')
          .select('status', { count: 'exact' })
          .or(`helper_id.eq.${user.id},requester_id.eq.${user.id}`)
      ])

      const completedExchanges = await supabase
        .from('exchanges')
        .select('id', { count: 'exact' })
        .eq('status', 'completed')
        .or(`helper_id.eq.${user.id},requester_id.eq.${user.id}`)

      setStats({
        posts_count: postsResult.count || 0,
        exchanges_count: exchangesResult.count || 0,
        completed_exchanges: completedExchanges.count || 0
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleGetLocation = async () => {
    try {
      const coords = await getCurrentLocation()
      
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
      )
      const data = await response.json()
      
      setProfile(prev => ({
        ...prev,
        location: data.locality || data.city || 'Current Location'
      }))
      
      toast.success('Location updated!')
    } catch (error) {
      toast.error('Could not get location')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    }
    setLoading(false)
  }

  const requestVerification = async () => {
    try {
      const { error } = await supabase
        .from('verification_requests')
        .insert([{
          user_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString()
        }])

      if (error) throw error
      toast.success('Verification request submitted!')
    } catch (error) {
      toast.error('Failed to submit verification request')
    }
  }

  const skillsArray = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(s => s) : []

  return (
    <div>
      <Card>
        <AvatarSection>
          <Avatar>
            {profile.username ? profile.username.charAt(0).toUpperCase() : '👤'}
          </Avatar>
        </AvatarSection>

        <StatsGrid>
          <StatCard>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#0066cc', marginBottom: '4px' }}>
              {stats.posts_count}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Posts
            </div>
          </StatCard>
          <StatCard>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#0066cc', marginBottom: '4px' }}>
              {stats.exchanges_count}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Exchanges
            </div>
          </StatCard>
          <StatCard>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#0066cc', marginBottom: '4px' }}>
              {stats.completed_exchanges}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Completed
            </div>
          </StatCard>
          <StatCard>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#0066cc', marginBottom: '4px' }}>
              ⭐ {profile.trust_level}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Trust Level
            </div>
          </StatCard>
        </StatsGrid>

        {!profile.verified && (
          <div style={{ background: '#f0f8ff', border: '1px solid #0066cc', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '8px', color: '#0066cc' }}>🛡️ Get Verified</h4>
            <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
              Increase trust by verifying your identity. Verified users get priority in exchanges.
            </p>
            <Button variant="secondary" onClick={requestVerification}>
              Request Verification
            </Button>
          </div>
        )}
      </Card>

      <ProfileGrid>
        <Card>
          <h3 style={{ marginBottom: '24px', color: '#003580' }}>👤 Personal Information</h3>
          <form onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Username"
              value={profile.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
            />
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <Input
                type="text"
                placeholder="Your location"
                value={profile.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                style={{ margin: 0 }}
              />
              <Button type="button" variant="secondary" onClick={handleGetLocation}>
                📍 Auto
              </Button>
            </div>
            
            <TextArea
              placeholder="Tell others about yourself..."
              value={profile.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
            />
            
            <Input
              type="tel"
              placeholder="Phone number (optional)"
              value={profile.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
            
            <Input
              type="text"
              placeholder="Emergency contact (optional)"
              value={profile.emergency_contact}
              onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
            />
            
            <Input
              type="text"
              placeholder="General availability (e.g., Weekends, Evenings)"
              value={profile.availability}
              onChange={(e) => handleInputChange('availability', e.target.value)}
            />
            
            <Button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </Card>

        <Card>
          <h3 style={{ marginBottom: '24px', color: '#003580' }}>🛠️ Skills & Expertise</h3>
          <TextArea
            placeholder="List your skills (comma separated)
e.g., Carpentry, Cooking, Tutoring, Gardening"
            value={profile.skills}
            onChange={(e) => handleInputChange('skills', e.target.value)}
            rows={4}
          />
          
          {skillsArray.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '12px', color: '#6b7280' }}>Your Skills:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {skillsArray.map((skill, index) => (
                  <Badge key={index} color="#0066cc">
                    🛠️ {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      </ProfileGrid>
    </div>
  )
}