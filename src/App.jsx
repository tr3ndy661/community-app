import { useState, useEffect } from 'react'
import { supabase } from './utils/supabase'
import Auth from './components/Auth'
import PostForm from './components/PostForm'
import PostList from './components/PostList'
import Profile from './components/Profile'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('feed')
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🌍 Global Skills Exchange</h1>
        <div className="header-actions">
          <span>Welcome, {session.user.email}</span>
          <button onClick={handleSignOut} className="sign-out">
            Sign Out
          </button>
        </div>
      </header>

      <nav className="nav-tabs">
        <button 
          className={activeTab === 'feed' ? 'active' : ''}
          onClick={() => setActiveTab('feed')}
        >
          📋 Feed
        </button>
        <button 
          className={activeTab === 'post' ? 'active' : ''}
          onClick={() => setActiveTab('post')}
        >
          ➕ Post
        </button>
        <button 
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'feed' && <PostList user={session.user} />}
        {activeTab === 'post' && (
          <PostForm 
            user={session.user} 
            onPostCreated={() => setActiveTab('feed')}
          />
        )}
        {activeTab === 'profile' && <Profile user={session.user} />}
      </main>
    </div>
  )
}

export default App