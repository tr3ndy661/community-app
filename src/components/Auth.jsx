import { useState } from 'react'
import { supabase } from '../utils/supabase'
import { Card, Button, Input, Container } from './ExpediaTheme'
import styled from 'styled-components'
import toast from 'react-hot-toast'

const AuthContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #003580 0%, #0066cc 100%);
`

const AuthCard = styled(Card)`
  max-width: 400px;
  width: 100%;
  text-align: center;
`

const Title = styled.h1`
  color: #003580;
  margin-bottom: 8px;
  font-size: 28px;
`

const Subtitle = styled.p`
  color: #6b7280;
  margin-bottom: 32px;
`

const SocialButton = styled(Button)`
  width: 100%;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }
  
  span {
    padding: 0 16px;
    color: #6b7280;
    font-size: 14px;
  }
`

export default function Auth() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState('email')

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { 
        emailRedirectTo: window.location.origin,
        data: { method: 'email' }
      }
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Check your email for the magic link!')
    }
    setLoading(false)
  }

  const handlePhoneAuth = async (e) => {
    e.preventDefault()
    if (!phone) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { data: { method: 'phone' } }
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Check your phone for the verification code!')
    }
    setLoading(false)
  }

  const handleSocialAuth = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    })

    if (error) {
      toast.error(error.message)
    }
  }

  return (
    <AuthContainer>
      <Container>
        <AuthCard>
          <Title>🌍 Global Skills Exchange</Title>
          <Subtitle>Connect with your community to share skills, tools, and help</Subtitle>

          <SocialButton 
            variant="secondary" 
            onClick={() => handleSocialAuth('google')}
          >
            <span>🔍</span> Continue with Google
          </SocialButton>

          <SocialButton 
            variant="secondary" 
            onClick={() => handleSocialAuth('facebook')}
          >
            <span>📘</span> Continue with Facebook
          </SocialButton>

          <Divider>
            <span>or</span>
          </Divider>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <Button
              variant={method === 'email' ? 'primary' : 'secondary'}
              onClick={() => setMethod('email')}
              style={{ flex: 1 }}
            >
              📧 Email
            </Button>
            <Button
              variant={method === 'phone' ? 'primary' : 'secondary'}
              onClick={() => setMethod('phone')}
              style={{ flex: 1 }}
            >
              📱 Phone
            </Button>
          </div>

          {method === 'email' ? (
            <form onSubmit={handleEmailAuth}>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePhoneAuth}>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </form>
          )}
        </AuthCard>
      </Container>
    </AuthContainer>
  )
}