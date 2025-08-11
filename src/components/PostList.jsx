import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export default function PostList({ user }) {
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [filter])

  const fetchPosts = async () => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('type', filter)
    }

    const { data, error } = await query

    if (!error) {
      setPosts(data || [])
    }
    setLoading(false)
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Emergency': return '#ff4444'
      case 'High': return '#ff8800'
      case 'Medium': return '#ffaa00'
      default: return '#00aa44'
    }
  }

  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'Skill': return '🛠️'
      case 'Tool': return '🔧'
      case 'Good': return '📦'
      case 'Time': return '⏰'
      case 'Space': return '🏠'
      default: return '💫'
    }
  }

  if (loading) return <div className="loading">Loading posts...</div>

  return (
    <div className="post-list">
      <div className="filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'offer' ? 'active' : ''}
          onClick={() => setFilter('offer')}
        >
          Offers
        </button>
        <button 
          className={filter === 'need' ? 'active' : ''}
          onClick={() => setFilter('need')}
        >
          Needs
        </button>
      </div>

      {posts.length === 0 ? (
        <p className="no-posts">No posts yet. Be the first to share!</p>
      ) : (
        posts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <span className="category">
                {getCategoryEmoji(post.category)} {post.category}
              </span>
              <span 
                className="urgency"
                style={{ backgroundColor: getUrgencyColor(post.urgency) }}
              >
                {post.urgency}
              </span>
              <span className={`type ${post.type}`}>
                {post.type === 'offer' ? '🤝 Offering' : '🙏 Seeking'}
              </span>
            </div>
            
            <h3>{post.title}</h3>
            {post.description && <p>{post.description}</p>}
            
            <div className="post-footer">
              <span className="location">📍 {post.location}</span>
              <span className="time">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
              <span className="user">
                by {post.profiles?.username || 'Anonymous'}
              </span>
            </div>
            
            {post.user_id !== user?.id && (
              <button className="contact-btn">
                Contact Helper
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}