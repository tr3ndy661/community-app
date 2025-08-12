import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Card, Badge } from './ExpediaTheme'
import styled from 'styled-components'
import { formatDistanceToNow } from 'date-fns'

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`

const MetricCard = styled(Card)`
  text-align: center;
  background: linear-gradient(135deg, ${props => props.gradient || '#f8fafc, #e2e8f0'});
  border: none;
`

export default function Dashboard({ user }) {
  const [metrics, setMetrics] = useState({
    totalPosts: 0,
    activeExchanges: 0,
    completedHelps: 0,
    communityImpact: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchMetrics(),
        fetchRecentActivity()
      ])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
    setLoading(false)
  }

  const fetchMetrics = async () => {
    try {
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: activeExchanges } = await supabase
        .from('exchanges')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'accepted'])
        .or(`helper_id.eq.${user.id},requester_id.eq.${user.id}`)

      const { count: completedHelps } = await supabase
        .from('exchanges')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .or(`helper_id.eq.${user.id},requester_id.eq.${user.id}`)

      setMetrics({
        totalPosts: postsCount || 0,
        activeExchanges: activeExchanges || 0,
        completedHelps: completedHelps || 0,
        communityImpact: completedHelps || 0
      })
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const { data: postsResult } = await supabase
        .from('posts')
        .select('id, title, type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const activities = []
      
      postsResult?.forEach(post => {
        activities.push({
          id: `post-${post.id}`,
          type: 'post',
          title: `Posted: ${post.title}`,
          time: post.created_at,
          icon: post.type === 'offer' ? '🤝' : '🙏',
          color: post.type === 'offer' ? '#4CAF50' : '#FF9800'
        })
      })

      activities.sort((a, b) => new Date(b.time) - new Date(a.time))
      setRecentActivity(activities.slice(0, 10))
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <h3>Loading dashboard...</h3>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: '32px', color: '#003580' }}>📊 Dashboard</h2>
      
      <DashboardGrid>
        <MetricCard gradient="#0066cc, #003580">
          <div style={{ fontSize: '48px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
            {metrics.totalPosts}
          </div>
          <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
            📝 Your Posts
          </div>
        </MetricCard>
        
        <MetricCard gradient="#FF9800, #F57C00">
          <div style={{ fontSize: '48px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
            {metrics.activeExchanges}
          </div>
          <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
            🔄 Active Exchanges
          </div>
        </MetricCard>
        
        <MetricCard gradient="#4CAF50, #2E7D32">
          <div style={{ fontSize: '48px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
            {metrics.completedHelps}
          </div>
          <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
            🎉 Completed Helps
          </div>
        </MetricCard>
        
        <MetricCard gradient="#9C27B0, #6A1B9A">
          <div style={{ fontSize: '48px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
            {metrics.communityImpact}
          </div>
          <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
            🌍 Community Impact
          </div>
        </MetricCard>
      </DashboardGrid>

      <DashboardGrid>
        <Card>
          <h3 style={{ marginBottom: '24px', color: '#003580' }}>📈 Recent Activity</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌱</div>
                <p>No recent activity</p>
              </div>
            ) : (
              recentActivity.map(activity => (
                <div key={activity.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: activity.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    {activity.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {activity.title}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </DashboardGrid>
    </div>
  )
}