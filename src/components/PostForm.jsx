import { useState } from 'react'
import { supabase } from '../utils/supabase'

const CATEGORIES = ['Skill', 'Tool', 'Good', 'Time', 'Space']
const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Emergency']

export default function PostForm({ user, onPostCreated }) {
  const [type, setType] = useState('offer')
  const [category, setCategory] = useState('Skill')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState('Low')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('posts')
      .insert([{
        user_id: user.id,
        type,
        category,
        title,
        description,
        urgency,
        location,
        created_at: new Date().toISOString()
      }])

    if (!error) {
      setTitle('')
      setDescription('')
      setLocation('')
      onPostCreated?.()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="post-form">
      <div className="form-row">
        <label>
          <input
            type="radio"
            value="offer"
            checked={type === 'offer'}
            onChange={(e) => setType(e.target.value)}
          />
          I can help (Offer)
        </label>
        <label>
          <input
            type="radio"
            value="need"
            checked={type === 'need'}
            onChange={(e) => setType(e.target.value)}
          />
          I need help (Request)
        </label>
      </div>

      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="What can you offer or what do you need?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        placeholder="Brief description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows="3"
      />

      <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
        {URGENCY_LEVELS.map(level => (
          <option key={level} value={level}>{level}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Location (neighborhood, area)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Posting...' : `Post ${type}`}
      </button>
    </form>
  )
}