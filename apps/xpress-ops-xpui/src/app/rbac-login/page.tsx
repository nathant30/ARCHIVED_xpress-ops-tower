'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, AlertCircle, Loader2, Lock, Mail } from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';

export default function RBACLoginPage() {
  const router = useRouter();
  const { login } = useRBAC();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/rbac', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
        setToken(data.data.access_token);
        
        // Use RBAC context to login
        login(data.data.access_token);
        
        // Redirect based on role
        if (data.data.user.role === 'expansion_manager') {
          router.push('/dashboard?rbac=true');
        } else {
          router.push('/dashboard?rbac=true');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when typing
  };

  const testAPI = async (endpoint: string, method = 'GET', body?: any) => {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(endpoint, options);
      const data = await response.json();
      
      alert(`${method} ${endpoint}\n\nStatus: ${response.status}\n\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('API Test Error:', error);
      alert(`Error testing ${endpoint}: ${error}`);
    }
  };

  if (user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
        padding: 'var(--xp-spacing-4)',
        fontFamily: 'var(--xp-font-family-base)'
      }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            backgroundColor: 'var(--xp-bg-card)',
            borderRadius: 'var(--xp-radius-lg)px',
            boxShadow: 'var(--xp-elevation-2)',
            padding: 'var(--xp-spacing-6)',
            marginBottom: 'var(--xp-spacing-6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{
                  fontSize: 'var(--xp-font-size-h2)',
                  fontWeight: 'var(--xp-font-weight-bold)',
                  color: 'var(--xp-text-primary)',
                  margin: 0
                }}>RBAC+ABAC Dashboard</h1>
                <p style={{
                  color: 'var(--xp-text-secondary)',
                  marginTop: 'var(--xp-spacing-1)',
                  fontSize: 'var(--xp-font-size-body)'
                }}>Welcome, {user.email}</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('rbac_token');
                  setUser(null);
                  setToken('');
                }}
                style={{
                  paddingLeft: 'var(--xp-button-paddingX)',
                  paddingRight: 'var(--xp-button-paddingX)',
                  paddingTop: 'var(--xp-spacing-2)',
                  paddingBottom: 'var(--xp-spacing-2)',
                  backgroundColor: 'var(--xp-status-critical)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--xp-radius-sm)px',
                  fontSize: 'var(--xp-font-size-body)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  cursor: 'pointer',
                  transition: 'background-color var(--xp-duration-base) var(--xp-easing-standard)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#B91C1C'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--xp-status-critical)'}
              >
                Logout
              </button>
            </div>
          </div>

          {/* User Info */}
          <div style={{
            backgroundColor: 'var(--xp-bg-card)',
            borderRadius: 'var(--xp-radius-lg)px',
            boxShadow: 'var(--xp-elevation-2)',
            padding: 'var(--xp-spacing-6)',
            marginBottom: 'var(--xp-spacing-6)'
          }}>
            <h2 style={{
              fontSize: 'var(--xp-font-size-h3)',
              fontWeight: 'var(--xp-font-weight-semibold)',
              color: 'var(--xp-text-primary)',
              marginBottom: 'var(--xp-spacing-4)'
            }}>User Information</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--xp-spacing-4)'
            }}>
              <div style={{ fontSize: 'var(--xp-font-size-body)' }}>
                <span style={{ fontWeight: 'var(--xp-font-weight-medium)', color: 'var(--xp-text-primary)' }}>Role:</span> 
                <span style={{ color: 'var(--xp-text-secondary)', marginLeft: 'var(--xp-spacing-1)' }}>{user.role}</span>
              </div>
              <div style={{ fontSize: 'var(--xp-font-size-body)' }}>
                <span style={{ fontWeight: 'var(--xp-font-weight-medium)', color: 'var(--xp-text-primary)' }}>Level:</span> 
                <span style={{ color: 'var(--xp-text-secondary)', marginLeft: 'var(--xp-spacing-1)' }}>{user.level}</span>
              </div>
              <div style={{ gridColumn: '1 / -1', fontSize: 'var(--xp-font-size-body)' }}>
                <span style={{ fontWeight: 'var(--xp-font-weight-medium)', color: 'var(--xp-text-primary)' }}>Regions:</span> 
                <span style={{ color: 'var(--xp-text-secondary)', marginLeft: 'var(--xp-spacing-1)' }}>{user.regions.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* API Testing */}
          <div style={{
            backgroundColor: 'var(--xp-bg-card)',
            borderRadius: 'var(--xp-radius-lg)px',
            boxShadow: 'var(--xp-elevation-2)',
            padding: 'var(--xp-spacing-6)'
          }}>
            <h2 style={{
              fontSize: 'var(--xp-font-size-h3)',
              fontWeight: 'var(--xp-font-weight-semibold)',
              color: 'var(--xp-text-primary)',
              marginBottom: 'var(--xp-spacing-4)'
            }}>API Testing</h2>
            <p style={{
              color: 'var(--xp-text-secondary)',
              fontSize: 'var(--xp-font-size-body)',
              marginBottom: 'var(--xp-spacing-4)'
            }}>Test your role permissions with these API endpoints:</p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--xp-spacing-4)',
              marginBottom: 'var(--xp-spacing-6)'
            }}>
              <button
                onClick={() => testAPI('/api/drivers/rbac')}
                style={{
                  padding: 'var(--xp-spacing-4)',
                  backgroundColor: 'var(--xp-color-blue-600)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--xp-radius-sm)px',
                  fontSize: 'var(--xp-font-size-body)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  cursor: 'pointer',
                  transition: 'background-color var(--xp-duration-base) var(--xp-easing-standard)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--xp-color-blue-700)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--xp-color-blue-600)'}
              >
                Test View Drivers
              </button>
              
              <button
                onClick={() => testAPI('/api/expansion/requests')}
                style={{
                  padding: 'var(--xp-spacing-4)',
                  backgroundColor: 'var(--xp-color-green-600)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--xp-radius-sm)px',
                  fontSize: 'var(--xp-font-size-body)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  cursor: 'pointer',
                  transition: 'background-color var(--xp-duration-base) var(--xp-easing-standard)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--xp-color-green-700)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--xp-color-green-600)'}
              >
                Test Region Requests
              </button>
              
              <button
                onClick={() => testAPI('/api/expansion/requests', 'POST', { 
                  region_name: 'Test Region',
                  region_type: 'prospect' 
                })}
                style={{
                  padding: 'var(--xp-spacing-4)',
                  backgroundColor: '#A855F7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--xp-radius-sm)px',
                  fontSize: 'var(--xp-font-size-body)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  cursor: 'pointer',
                  transition: 'background-color var(--xp-duration-base) var(--xp-easing-standard)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#9333EA'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#A855F7'}
              >
                Create Region Request
              </button>
            </div>
            
            <div style={{
              padding: 'var(--xp-spacing-4)',
              backgroundColor: 'var(--xp-color-gray-50)',
              borderRadius: 'var(--xp-radius-sm)px'
            }}>
              <p style={{
                fontSize: 'var(--xp-font-size-body)',
                color: 'var(--xp-text-secondary)',
                fontWeight: 'var(--xp-font-weight-medium)',
                marginBottom: 'var(--xp-spacing-2)'
              }}>Your JWT Token (first 50 chars):</p>
              <code style={{
                fontSize: 'var(--xp-font-size-caption)',
                color: 'var(--xp-text-muted)',
                fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
                wordBreak: 'break-all',
                lineHeight: 'var(--xp-line-height-relaxed)'
              }}>
                {token.substring(0, 50)}...
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--xp-spacing-4)',
      fontFamily: 'var(--xp-font-family-base)'
    }}>
      <div style={{ maxWidth: '448px', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--xp-spacing-8)' }}>
        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          boxShadow: 'var(--xp-elevation-2)',
          padding: 'var(--xp-spacing-8)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--xp-spacing-8)' }}>
            <div style={{
              margin: '0 auto var(--xp-spacing-4)',
              height: '48px',
              width: '48px',
              backgroundColor: '#A855F7',
              borderRadius: 'var(--xp-radius-sm)px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield style={{ height: '24px', width: '24px', color: '#FFFFFF' }} />
            </div>
            <h2 style={{
              fontSize: 'var(--xp-font-size-h2)',
              fontWeight: 'var(--xp-font-weight-bold)',
              color: 'var(--xp-text-primary)',
              margin: 0
            }}>RBAC+ABAC Login</h2>
            <p style={{
              color: 'var(--xp-text-secondary)',
              marginTop: 'var(--xp-spacing-2)',
              fontSize: 'var(--xp-font-size-body)'
            }}>Access the 5-step authorization system</p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              marginBottom: 'var(--xp-spacing-6)',
              padding: 'var(--xp-spacing-4)',
              backgroundColor: 'var(--xp-chip-bg-critical)',
              border: '1px solid var(--xp-status-critical)',
              borderRadius: 'var(--xp-radius-sm)px',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--xp-spacing-2)'
            }}>
              <AlertCircle style={{ height: '16px', width: '16px', color: 'var(--xp-status-critical)', flexShrink: 0 }} />
              <p style={{ color: 'var(--xp-status-critical)', fontSize: 'var(--xp-font-size-body)' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--xp-spacing-6)' }}>
            {/* Email Field */}
            <div>
              <label htmlFor="username" style={{
                display: 'block',
                fontSize: 'var(--xp-font-size-body)',
                fontWeight: 'var(--xp-font-weight-medium)',
                color: 'var(--xp-text-primary)',
                marginBottom: 'var(--xp-spacing-2)'
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  paddingLeft: 'var(--xp-spacing-3)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <Mail style={{ height: '20px', width: '20px', color: 'var(--xp-input-placeholder)' }} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="email"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  style={{
                    appearance: 'none',
                    display: 'block',
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: 'var(--xp-input-paddingX)',
                    paddingTop: 'var(--xp-spacing-3)',
                    paddingBottom: 'var(--xp-spacing-3)',
                    border: '1px solid var(--xp-input-border)',
                    borderRadius: 'var(--xp-radius-sm)px',
                    backgroundColor: 'var(--xp-input-bg)',
                    fontSize: 'var(--xp-font-size-body)',
                    outline: 'none',
                    transition: 'border-color var(--xp-duration-base) var(--xp-easing-standard)'
                  }}
                  placeholder="Enter your email"
                  onFocus={(e) => e.target.style.borderColor = '#A855F7'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--xp-input-border)'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: 'var(--xp-font-size-body)',
                fontWeight: 'var(--xp-font-weight-medium)',
                color: 'var(--xp-text-primary)',
                marginBottom: 'var(--xp-spacing-2)'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  paddingLeft: 'var(--xp-spacing-3)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <Lock style={{ height: '20px', width: '20px', color: 'var(--xp-input-placeholder)' }} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    appearance: 'none',
                    display: 'block',
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: 'var(--xp-input-paddingX)',
                    paddingTop: 'var(--xp-spacing-3)',
                    paddingBottom: 'var(--xp-spacing-3)',
                    border: '1px solid var(--xp-input-border)',
                    borderRadius: 'var(--xp-radius-sm)px',
                    backgroundColor: 'var(--xp-input-bg)',
                    fontSize: 'var(--xp-font-size-body)',
                    outline: 'none',
                    transition: 'border-color var(--xp-duration-base) var(--xp-easing-standard)'
                  }}
                  placeholder="Enter your password"
                  onFocus={(e) => e.target.style.borderColor = '#A855F7'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--xp-input-border)'}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  position: 'relative',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingTop: 'var(--xp-spacing-3)',
                  paddingBottom: 'var(--xp-spacing-3)',
                  paddingLeft: 'var(--xp-button-paddingX)',
                  paddingRight: 'var(--xp-button-paddingX)',
                  border: 'none',
                  fontSize: 'var(--xp-font-size-body)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  borderRadius: 'var(--xp-radius-sm)px',
                  color: '#FFFFFF',
                  backgroundColor: '#A855F7',
                  opacity: isLoading ? 'var(--xp-opacity-disabled)' : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all var(--xp-duration-base) var(--xp-easing-standard)',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = '#9333EA';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = '#A855F7';
                  }
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 var(--xp-focus-ring-width) #A855F7';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              >
                {isLoading ? (
                  <Loader2 style={{ height: '16px', width: '16px' }} className="animate-spin" />
                ) : (
                  'Login with RBAC'
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div style={{
            marginTop: 'var(--xp-spacing-6)',
            padding: 'var(--xp-spacing-4)',
            backgroundColor: 'rgba(168, 85, 247, 0.05)',
            borderRadius: 'var(--xp-radius-sm)px',
            border: '1px solid rgba(168, 85, 247, 0.2)'
          }}>
            <p style={{
              fontSize: 'var(--xp-font-size-body)',
              fontWeight: 'var(--xp-font-weight-medium)',
              color: '#6B21A8',
              marginBottom: 'var(--xp-spacing-3)'
            }}>RBAC Demo Accounts (Password: test123)</p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--xp-spacing-2)',
              fontSize: 'var(--xp-font-size-body)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'var(--xp-font-weight-medium)', color: '#7C2D92' }}>🔥 executive (super admin)</span>
                <code style={{ color: '#A855F7', fontSize: 'var(--xp-font-size-caption)', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}>admin@xpress.test</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'var(--xp-font-weight-medium)', color: '#7C2D92' }}>expansion_manager</span>
                <code style={{ color: '#A855F7', fontSize: 'var(--xp-font-size-caption)', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}>expansion.manager@xpress.test</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'var(--xp-font-weight-medium)', color: '#7C2D92' }}>ground_ops</span>
                <code style={{ color: '#A855F7', fontSize: 'var(--xp-font-size-caption)', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}>ground.ops.manila@xpress.test</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'var(--xp-font-weight-medium)', color: '#7C2D92' }}>risk_investigator</span>
                <code style={{ color: '#A855F7', fontSize: 'var(--xp-font-size-caption)', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}>risk.investigator@xpress.test</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 'var(--xp-font-size-caption)',
            color: 'var(--xp-text-muted)'
          }}>
            RBAC+ABAC System - 5-Step Authorization
          </p>
        </div>
      </div>
    </div>
  );
}