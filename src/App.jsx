import { useState, useEffect } from 'react'
import { supabase } from './utils/supabase'
import { requestNotificationPermission } from './utils/notifications'
import Auth from './components/Auth'
import PostForm from './components/PostForm'
import PostList from './components/PostList'
import Profile from './components/Profile'
import Exchanges from './components/Exchanges'
import Dashboard from './components/Dashboard'
import EmergencyMode from './components/EmergencyMode'
import { GlobalStyle, Container, Header, Nav, NavButton } from './components/ExpediaTheme'
import styled from 'styled-components'
import { Toaster } from 'react-hot-toast'

const AppContainer = styled.div`
  min-height: 100vh;
  background: #f7f9fa;
`

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Logo = styled.h1`
  color: white;
  font-size: 24px;
  margin: 0;
`

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  color: rgba(255,255,255,0.9);
  font-size: 14px;
`

const SignOutButton = styled.button`
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: rgba(255,255,255,0.3);
  }
`

const MainContent = styled.main`
  padding: 24px 0;
`

const LoadingScreen = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fa;
  flex-direction: column;
  gap: 16px;
`

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      // Request notification permission when user logs in
      requestNotificationPermission()
    }
  }, [session])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <LoadingScreen>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌍</div>
        <h2 style={{ color: '#003580' }}>Loading Global Skills Exchange...</h2>
      </LoadingScreen>
    )
  }

  if (!session) {
    return (
      <>
        <GlobalStyle />
        <Auth />
        <Toaster position="top-right" />
      </>
    )
  }

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Header>
          <Container>
            <HeaderContent>
              <Logo>🌍 Global Skills Exchange</Logo>
              <UserInfo>
                <span>Welcome, {session.user.email}</span>
                <SignOutButton onClick={handleSignOut}>
                  Sign Out
                </SignOutButton>
              </UserInfo>
            </HeaderContent>
          </Container>
        </Header>

        <Nav>
          <Container>
            <div style={{ display: 'flex' }}>
              <NavButton 
                className={activeTab === 'dashboard' ? 'active' : ''}
                onClick={() => setActiveTab('dashboard')}
              >
                📊 Dashboard
              </NavButton>
              <NavButton 
                className={activeTab === 'feed' ? 'active' : ''}
                onClick={() => setActiveTab('feed')}
              >
                📋 Community Feed
              </NavButton>
              <NavButton 
                className={activeTab === 'post' ? 'active' : ''}
                onClick={() => setActiveTab('post')}
              >
                ➕ Create Post
              </NavButton>
              <NavButton 
                className={activeTab === 'exchanges' ? 'active' : ''}
                onClick={() => setActiveTab('exchanges')}
              >
                🤝 My Exchanges
              </NavButton>
              <NavButton 
                className={activeTab === 'emergency' ? 'active' : ''}
                onClick={() => setActiveTab('emergency')}
                style={{ color: '#ff4444', fontWeight: '600' }}
              >
                🚨 Emergency
              </NavButton>
              <NavButton 
                className={activeTab === 'profile' ? 'active' : ''}
                onClick={() => setActiveTab('profile')}
              >
                👤 Profile
              </NavButton>
            </div>
          </Container>
        </Nav>

        <MainContent>
          <Container>
            {activeTab === 'dashboard' && <Dashboard user={session.user} />}
            {activeTab === 'feed' && <PostList user={session.user} />}
            {activeTab === 'post' && (
              <PostForm 
                user={session.user} 
                onPostCreated={() => setActiveTab('feed')}
              />
            )}
            {activeTab === 'exchanges' && <Exchanges user={session.user} />}
            {activeTab === 'emergency' && (
              <EmergencyMode 
                user={session.user} 
                onEmergencyPosted={() => setActiveTab('feed')}
              />
            )}
            {activeTab === 'profile' && <Profile user={session.user} />}
          </Container>
        </MainContent>
      </AppContainer>
      <Toaster position="top-right" />
    </>
  )
}

export default App