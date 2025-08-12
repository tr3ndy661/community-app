import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { EXCHANGE_STATUS } from '../utils/constants'
import { Card, Button, Badge } from './ExpediaTheme'
import styled from 'styled-components'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const ExchangeCard = styled(Card)`
  border-left: 4px solid ${props => props.statusColor || '#e5e7eb'};
`

const TabBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
`

const Tab = styled.button`
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 500;
  color: ${props => props.active ? '#0066cc' : '#6b7280'};
  border-bottom: 2px solid ${props => props.active ? '#0066cc' : 'transparent'};
  
  &:hover {
    color: #0066cc;
  }
`

export default function Exchanges({ user }) {
  const [exchanges, setExchanges] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExchanges()
  }, [])

  const fetchExchanges = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('exchanges')
        .select(`
          *,
          posts (
            id,
            title,
            type,
            category,
            urgency,
            location
          ),
          helper:profiles!helper_id (
            username
          ),
          requester:profiles!requester_id (
            username
          )
        `)
        .or(`helper_id.eq.${user.id},requester_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExchanges(data || [])
    } catch (error) {
      toast.error('Failed to load exchanges')
    }
    setLoading(false)
  }

  const updateExchangeStatus = async (exchangeId, newStatus) => {
    try {
      const { error } = await supabase
        .from('exchanges')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', exchangeId)

      if (error) throw error
      
      if (newStatus === 'completed') {
        const exchange = exchanges.find(ex => ex.id === exchangeId)
        if (exchange) {
          await Promise.all([
            supabase.rpc('increment_trust_level', { user_id: exchange.helper_id }),
            supabase.rpc('increment_trust_level', { user_id: exchange.requester_id })
          ])
        }
      }
      
      toast.success(`Exchange ${newStatus}!`)
      fetchExchanges()
    } catch (error) {
      toast.error('Failed to update exchange')
    }
  }

  const getStatusData = (status) => {
    return EXCHANGE_STATUS.find(s => s.id === status) || EXCHANGE_STATUS[0]
  }

  const filteredExchanges = exchanges.filter(exchange => {
    if (activeTab === 'all') return true
    return exchange.status === activeTab
  })

  const getExchangeRole = (exchange) => {
    if (exchange.helper_id === user.id) {
      return exchange.posts.type === 'offer' ? 'provider' : 'helper'
    } else {
      return exchange.posts.type === 'offer' ? 'requester' : 'provider'
    }
  }

  const canUpdateStatus = (exchange, newStatus) => {
    const role = getExchangeRole(exchange)
    const currentStatus = exchange.status
    
    if (currentStatus === 'completed' || currentStatus === 'cancelled') return false
    
    switch (newStatus) {
      case 'accepted':
        return currentStatus === 'pending' && role === 'provider'
      case 'completed':
        return currentStatus === 'accepted'
      case 'cancelled':
        return currentStatus === 'pending' || currentStatus === 'accepted'
      default:
        return false
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
        <h3>Loading exchanges...</h3>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px', color: '#003580' }}>🤝 My Exchanges</h2>
      
      <TabBar>
        <Tab active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
          All ({exchanges.length})
        </Tab>
        <Tab active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
          Pending ({exchanges.filter(ex => ex.status === 'pending').length})
        </Tab>
        <Tab active={activeTab === 'accepted'} onClick={() => setActiveTab('accepted')}>
          Active ({exchanges.filter(ex => ex.status === 'accepted').length})
        </Tab>
        <Tab active={activeTab === 'completed'} onClick={() => setActiveTab('completed')}>
          Completed ({exchanges.filter(ex => ex.status === 'completed').length})
        </Tab>
      </TabBar>

      {filteredExchanges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💫</div>
          <h3>No exchanges yet</h3>
          <p>Start connecting with your community by contacting helpers!</p>
        </div>
      ) : (
        filteredExchanges.map(exchange => {
          const status = getStatusData(exchange.status)
          const role = getExchangeRole(exchange)
          const otherUser = exchange.helper_id === user.id ? exchange.requester : exchange.helper
          
          return (
            <ExchangeCard key={exchange.id} statusColor={status.color}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ marginBottom: '8px' }}>{exchange.posts.title}</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Badge color={status.color}>{status.name}</Badge>
                    <Badge color="#6b7280">
                      {role === 'provider' ? '🤝 Providing' : '🙏 Requesting'}
                    </Badge>
                    <Badge color="#6b7280">📍 {exchange.posts.location}</Badge>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <p><strong>With:</strong> {otherUser?.username || 'Anonymous'}</p>
                <p><strong>Started:</strong> {formatDistanceToNow(new Date(exchange.created_at), { addSuffix: true })}</p>
                {exchange.updated_at !== exchange.created_at && (
                  <p><strong>Updated:</strong> {formatDistanceToNow(new Date(exchange.updated_at), { addSuffix: true })}</p>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                {canUpdateStatus(exchange, 'accepted') && (
                  <Button onClick={() => updateExchangeStatus(exchange.id, 'accepted')}>
                    ✅ Accept
                  </Button>
                )}
                
                {canUpdateStatus(exchange, 'completed') && (
                  <Button onClick={() => updateExchangeStatus(exchange.id, 'completed')}>
                    🎉 Mark Complete
                  </Button>
                )}
                
                {canUpdateStatus(exchange, 'cancelled') && (
                  <Button 
                    variant="secondary" 
                    onClick={() => updateExchangeStatus(exchange.id, 'cancelled')}
                  >
                    ❌ Cancel
                  </Button>
                )}
                
                <Button variant="secondary">
                  💬 Message
                </Button>
              </div>
            </ExchangeCard>
          )
        })
      )}
    </div>
  )
}