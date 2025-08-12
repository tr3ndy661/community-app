import { useState } from 'react'
import { supabase } from '../utils/supabase'
import { getCurrentLocation } from '../utils/geolocation'
import { CATEGORIES, URGENCY_LEVELS, POST_TYPES } from '../utils/constants'
import { Card, Button, Input, Select, TextArea, Badge } from './ExpediaTheme'
import styled from 'styled-components'
import toast from 'react-hot-toast'

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const TypeSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`

const TypeButton = styled.button`
  flex: 1;
  padding: 16px;
  border: 2px solid ${props => props.active ? '#0066cc' : '#e5e7eb'};
  background: ${props => props.active ? '#f0f8ff' : 'white'};
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  
  &:hover {
    border-color: #0066cc;
  }
`

export default function PostForm({ user, onPostCreated }) {
  const [formData, setFormData] = useState({
    type: 'offer',
    category: 'skill',
    title: '',
    description: '',
    urgency: 'low',
    location: '',
    availability: ''
  })
  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      
      toast.success('Location detected!')
    } catch (error) {
      toast.error('Could not get location. Please enter manually.')
    }
    setGettingLocation(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.location) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          type: formData.type,
          category: formData.category,
          title: formData.title,
          description: formData.description,
          urgency: formData.urgency,
          location: formData.location,
          availability: formData.availability,
          status: 'active'
        }])

      if (error) throw error

      toast.success(`${formData.type === 'offer' ? 'Offer' : 'Request'} posted successfully!`)
      
      setFormData({
        type: 'offer',
        category: 'skill',
        title: '',
        description: '',
        urgency: 'low',
        location: '',
        availability: ''
      })
      
      onPostCreated?.()
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  const selectedCategory = CATEGORIES.find(c => c.id === formData.category)
  const selectedUrgency = URGENCY_LEVELS.find(u => u.id === formData.urgency)

  return (
    <Card>
      <h2 style={{ marginBottom: '24px', color: '#003580' }}>📝 Create New Post</h2>
      
      <form onSubmit={handleSubmit}>
        <TypeSelector>
          {POST_TYPES.map(type => (
            <TypeButton
              key={type.id}
              type="button"
              active={formData.type === type.id}
              onClick={() => handleInputChange('type', type.id)}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{type.emoji}</div>
              <div style={{ fontWeight: '600' }}>{type.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{type.description}</div>
            </TypeButton>
          ))}
        </TypeSelector>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '16px' }}>
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              type="button"
              style={{
                padding: '12px',
                border: `2px solid ${formData.category === category.id ? category.color : '#e5e7eb'}`,
                background: formData.category === category.id ? category.color + '20' : 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                fontSize: '12px'
              }}
              onClick={() => handleInputChange('category', category.id)}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{category.emoji}</div>
              <div style={{ fontWeight: '600' }}>{category.name}</div>
            </button>
          ))}
        </div>

        <Input
          type="text"
          placeholder={`What ${formData.type === 'offer' ? 'can you offer' : 'do you need'}?`}
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          required
        />

        <TextArea
          placeholder="Provide more details..."
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
        />

        <FormGrid>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Urgency Level</label>
            <Select
              value={formData.urgency}
              onChange={(e) => handleInputChange('urgency', e.target.value)}
            >
              {URGENCY_LEVELS.map(level => (
                <option key={level.id} value={level.id}>
                  {level.emoji} {level.name}
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Availability</label>
            <Input
              type="text"
              placeholder="e.g., Weekends, Evenings"
              value={formData.availability}
              onChange={(e) => handleInputChange('availability', e.target.value)}
            />
          </div>
        </FormGrid>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Location</label>
            <Input
              type="text"
              placeholder="Enter your location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              required
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleGetLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? '📍...' : '📍 Auto'}
          </Button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Badge color={selectedCategory?.color}>
            {selectedCategory?.emoji} {selectedCategory?.name}
          </Badge>
          <Badge color={selectedUrgency?.color}>
            {selectedUrgency?.emoji} {selectedUrgency?.name}
          </Badge>
          {formData.availability && (
            <Badge color="#6b7280">
              ⏰ {formData.availability}
            </Badge>
          )}
        </div>

        <Button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Posting...' : `Post ${formData.type === 'offer' ? 'Offer' : 'Request'}`}
        </Button>
      </form>
    </Card>
  )
}