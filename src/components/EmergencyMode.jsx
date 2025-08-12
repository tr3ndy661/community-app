import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { getCurrentLocation } from '../utils/geolocation'
import { sendNotification } from '../utils/notifications'
import { Card, Button, Input, TextArea, Badge } from './ExpediaTheme'
import styled from 'styled-components'
import toast from 'react-hot-toast'

const EmergencyContainer = styled.div`
  background: linear-gradient(135deg, #ff4444, #cc0000);
  color: white;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 24px;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(255, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0); }
  }
`

const EmergencyButton = styled(Button)`
  background: #ff4444;
  border: 2px solid white;
  color: white;
  font-size: 18px;
  padding: 16px 32px;
  margin: 16px 0;
  
  &:hover {
    background: #cc0000;
  }
`

const EmergencyPost = styled(Card)`
  border-left: 4px solid #ff4444;
  background: #fff5f5;
`

const EMERGENCY_TEMPLATES = [
  {
    id: 'medical',
    icon: '🚑',
    title: 'Medical Emergency',
    description: 'Need immediate medical help',
    template: 'Medical emergency - need immediate assistance'
  },
  {
    id: 'breakdown',
    icon: '🔧',
    title: 'Vehicle Breakdown',
    description: 'Car/bike broken down',
    template: 'Vehicle breakdown - need roadside assistance'
  },
  {
    id: 'safety',
    icon: '🛡️',
    title: 'Safety Concern',
    description: 'Personal safety issue',
    template: 'Safety concern - need help or escort'
  },
  {
    id: 'other',
    icon: '🚨',
    title: 'Other Emergency',
    description: 'Other urgent situation',
    template: 'Emergency situation - need immediate help'
  }
]

export default function EmergencyMode({ user, onEmergencyPosted }) {
  const [emergencyPosts, setEmergencyPosts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    contact: ''
  })
  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  useEffect(() => {
    fetchEmergencyPosts()
  }, [])

  const fetchEmergencyPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username,
            phone,
            emergency_contact
          )
        `)
        .eq('urgency', 'emergency')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setEmergencyPosts(data || [])
    } catch (error) {
      console.error('Failed to fetch emergency posts:', error)
    }
  }

  const handleQuickEmergency = (template) => {
    setFormData(prev => ({
      ...prev,
      title: template.template,
      description: ''
    }))
    setShowForm(true)
    handleGetLocation()
  }

  const handleGetLocation = async () => {
    setGettingLocation(true)
    try {
      const coords = await getCurrentLocation()
      
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
      )
      const data = await response.json()
      
      setFormData(prev => ({
        ...prev,
        location: data.locality || data.city || 'Current Location'
      }))
    } catch (error) {
      toast.error('Could not get location. Please enter manually.')
    }
    setGettingLocation(false)
  }

  const handleSubmitEmergency = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.location) {
      toast.error('Please fill in title and location')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          type: 'need',
          category: 'time',
          title: formData.title,
          description: formData.description,
          urgency: 'emergency',
          location: formData.location,
          status: 'active'
        }])

      if (error) throw error

      sendNotification('🚨 Emergency Posted!', {
        body: `${formData.title} in ${formData.location}`,
        tag: 'emergency-posted',
        requireInteraction: false
      })

      toast.success('Emergency posted! Help is on the way.')
      setShowForm(false)
      setFormData({ title: '', description: '', location: '', contact: '' })
      onEmergencyPosted?.()
      fetchEmergencyPosts()
    } catch (error) {
      toast.error('Failed to post emergency')
    }
    setLoading(false)
  }

  const handleContactEmergency = async (post) => {
    try {
      const { error } = await supabase
        .from('exchanges')
        .insert([{
          post_id: post.id,
          helper_id: user.id,
          requester_id: post.user_id,
          status: 'accepted'
        }])

      if (error) throw error
      toast.success('Emergency response sent! Contact details shared.')
    } catch (error) {
      toast.error('Failed to respond to emergency')
    }
  }

  return (
    <div>
      <EmergencyContainer>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚨</div>
          <h2 style={{ marginBottom: '8px' }}>Emergency Mode</h2>
          <p style={{ marginBottom: '16px', opacity: 0.9 }}>
            For urgent situations requiring immediate community help
          </p>
          <EmergencyButton onClick={() => setShowForm(true)}>
            🚨 Post Emergency Request
          </EmergencyButton>
        </div>
      </EmergencyContainer>

      {!showForm && (
        <>
          <h3 style={{ marginBottom: '16px', color: '#003580' }}>⚡ Quick Emergency Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {EMERGENCY_TEMPLATES.map(template => (
              <Button
                key={template.id}
                variant="secondary"
                onClick={() => handleQuickEmergency(template)}
                style={{ padding: '16px', textAlign: 'left', height: 'auto' }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{template.icon}</div>
                <h4 style={{ marginBottom: '4px', fontSize: '16px' }}>{template.title}</h4>
                <p style={{ fontSize: '12px', opacity: 0.8 }}>{template.description}</p>
              </Button>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <Card>
          <h3 style={{ marginBottom: '24px', color: '#ff4444' }}>🚨 Emergency Request Form</h3>
          <form onSubmit={handleSubmitEmergency}>
            <Input
              type="text"
              placeholder="What emergency help do you need?"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
            
            <TextArea
              placeholder="Additional details (optional but helpful)..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <Input
                type="text"
                placeholder="Your exact location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
                style={{ margin: 0 }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleGetLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? '📍...' : '📍 Auto'}
              </Button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="submit" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Posting Emergency...' : '🚨 Post Emergency'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <h3 style={{ marginBottom: '16px', color: '#003580' }}>🚨 Active Emergencies</h3>
      {emergencyPosts.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h4>No active emergencies</h4>
            <p>Great! No emergency situations in your area right now.</p>
          </div>
        </Card>
      ) : (
        emergencyPosts.map(post => (
          <EmergencyPost key={post.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <Badge color="#ff4444">🚨 EMERGENCY</Badge>
                <h3 style={{ margin: '8px 0', color: '#ff4444' }}>{post.title}</h3>
                {post.description && <p style={{ marginBottom: '8px' }}>{post.description}</p>}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                <div>📍 {post.location}</div>
                <div>👤 {post.profiles?.username || 'Anonymous'}</div>
                <div>🕒 {new Date(post.created_at).toLocaleString()}</div>
                {post.profiles?.phone && (
                  <div>📞 {post.profiles.phone}</div>
                )}
              </div>
              
              {post.user_id !== user?.id && (
                <Button onClick={() => handleContactEmergency(post)}>
                  🚑 I Can Help
                </Button>
              )}
            </div>
          </EmergencyPost>
        ))
      )}
    </div>
  )
}