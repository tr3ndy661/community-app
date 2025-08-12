import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { CATEGORIES, URGENCY_LEVELS } from '../utils/constants'
import { Card, Button, Badge, Input, Select } from './ExpediaTheme'
import styled from 'styled-components'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
`

const FilterButton = styled.button`
  padding: 8px 16px;
  border: 1px solid ${props => props.active ? '#0066cc' : '#e5e7eb'};
  background: ${props => props.active ? '#0066cc' : 'white'};
  color: ${props => props.active ? 'white' : '#6b7280'};
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    border-color: #0066cc;
    color: ${props => props.active ? 'white' : '#0066cc'};
  }
`

const PostCard = styled(Card)`
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`

export default function PostList({ user }) {
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    urgency: 'all',
    search: ''
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [posts, filters])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username,
            trust_level
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      toast.error('Failed to load posts')
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...posts]

    if (filters.type !== 'all') {
      filtered = filtered.filter(post => post.type === filters.type)
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(post => post.category === filters.category)
    }

    if (filters.urgency !== 'all') {
      filtered = filtered.filter(post => post.urgency === filters.urgency)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.description?.toLowerCase().includes(searchLower) ||
        post.location.toLowerCase().includes(searchLower)
      )
    }

    filtered.sort((a, b) => {
      const urgencyOrder = { emergency: 4, high: 3, medium: 2, low: 1 }
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
      if (urgencyDiff !== 0) return urgencyDiff
      return new Date(b.created_at) - new Date(a.created_at)
    })

    setFilteredPosts(filtered)
  }

  const handleContact = async (post) => {
    try {
      const { error } = await supabase
        .from('exchanges')
        .insert([{
          post_id: post.id,
          helper_id: post.type === 'need' ? user.id : post.user_id,
          requester_id: post.type === 'offer' ? user.id : post.user_id,
          status: 'pending'
        }])

      if (error) throw error
      toast.success('Contact request sent!')
    } catch (error) {
      toast.error('Failed to send contact request')
    }
  }

  const getCategoryData = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]
  }

  const getUrgencyData = (urgencyId) => {
    return URGENCY_LEVELS.find(u => u.id === urgencyId) || URGENCY_LEVELS[0]
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
        <h3>Loading community posts...</h3>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Input
          type="text"
          placeholder="🔍 Search posts..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
      </div>

      <FilterBar>
        <FilterButton
          active={filters.type === 'all'}
          onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}
        >
          All Posts
        </FilterButton>
        <FilterButton
          active={filters.type === 'offer'}
          onClick={() => setFilters(prev => ({ ...prev, type: 'offer' }))}
        >
          🤝 Offers
        </FilterButton>
        <FilterButton
          active={filters.type === 'need'}
          onClick={() => setFilters(prev => ({ ...prev, type: 'need' }))}
        >
          🙏 Needs
        </FilterButton>
        
        <Select
          value={filters.category}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          style={{ width: 'auto', margin: 0 }}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
          ))}
        </Select>
        
        <Select
          value={filters.urgency}
          onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value }))}
          style={{ width: 'auto', margin: 0 }}
        >
          <option value="all">All Urgency</option>
          {URGENCY_LEVELS.map(level => (
            <option key={level.id} value={level.id}>{level.emoji} {level.name}</option>
          ))}
        </Select>
      </FilterBar>

      {filteredPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
          <h3>No posts found</h3>
          <p>Be the first to share something with your community!</p>
        </div>
      ) : (
        filteredPosts.map(post => {
          const category = getCategoryData(post.category)
          const urgency = getUrgencyData(post.urgency)
          
          return (
            <PostCard key={post.id}>
              {post.urgency === 'emergency' && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#f44336',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}>
                  🚨
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Badge color={category.color}>
                    {category.emoji} {category.name}
                  </Badge>
                  <Badge color={urgency.color}>
                    {urgency.emoji} {urgency.name}
                  </Badge>
                  <Badge color={post.type === 'offer' ? '#4CAF50' : '#FF9800'}>
                    {post.type === 'offer' ? '🤝 Offering' : '🙏 Seeking'}
                  </Badge>
                </div>
              </div>
              
              <h3 style={{ color: '#25282b', marginBottom: '8px', fontSize: '18px' }}>{post.title}</h3>
              {post.description && <p style={{ color: '#6b7280', marginBottom: '16px' }}>{post.description}</p>}
              
              {post.availability && (
                <div style={{ marginBottom: '16px' }}>
                  <Badge color="#6b7280">⏰ {post.availability}</Badge>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6b7280', flexWrap: 'wrap' }}>
                  <span>📍 {post.location}</span>
                  <span>👤 {post.profiles?.username || 'Anonymous'}</span>
                  <span>🕒 {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  {post.profiles?.trust_level > 0 && (
                    <span>⭐ Trust Level {post.profiles.trust_level}</span>
                  )}
                </div>
                
                {post.user_id !== user?.id && (
                  <Button onClick={() => handleContact(post)}>
                    💬 Contact
                  </Button>
                )}
              </div>
            </PostCard>
          )
        })
      )}
    </div>
  )
}