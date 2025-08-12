import styled, { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Centra No2', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f7f9fa;
    color: #25282b;
    line-height: 1.5;
  }
`

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
`

export const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 16px;
`

export const Button = styled.button`
  background: ${props => props.variant === 'secondary' ? 'white' : '#0066cc'};
  color: ${props => props.variant === 'secondary' ? '#0066cc' : 'white'};
  border: ${props => props.variant === 'secondary' ? '1px solid #0066cc' : 'none'};
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.variant === 'secondary' ? '#f0f8ff' : '#0052a3'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 16px;
  
  &:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
  }
`

export const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 16px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
  }
`

export const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 16px;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
  }
`

export const Badge = styled.span`
  background: ${props => props.color || '#e5e7eb'};
  color: ${props => props.textColor || 'white'};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`

export const Header = styled.header`
  background: #003580;
  color: white;
  padding: 16px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

export const Nav = styled.nav`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0;
`

export const NavButton = styled.button`
  background: none;
  border: none;
  padding: 16px 24px;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  
  &.active {
    color: #0066cc;
    border-bottom-color: #0066cc;
  }
  
  &:hover {
    color: #0066cc;
    background: #f8fafc;
  }
`