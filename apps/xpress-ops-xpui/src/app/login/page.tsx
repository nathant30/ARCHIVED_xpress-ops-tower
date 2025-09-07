'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { createLoginValidator, ValidationError } from '@/utils/validation';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error } = useEnhancedAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mfaCode: '',
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const redirect = searchParams.get('redirect') || '/dashboard';
  const validator = createLoginValidator();

  const validateForm = () => {
    const errors = validator.validate(formData);
    
    // Add MFA validation if needed
    if (showMfa && !formData.mfaCode) {
      errors.push({
        field: 'mfaCode',
        message: 'MFA code is required'
      });
    }

    // Convert ValidationError[] to {[key: string]: string}
    const errorMap: {[key: string]: string} = {};
    errors.forEach((error: ValidationError) => {
      errorMap[error.field] = error.message;
    });

    setValidationErrors(errorMap);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login({
        email: formData.email,
        password: formData.password,
        mfaCode: formData.mfaCode || undefined
      });
      router.push(redirect);
    } catch (err) {
      // Check if MFA is required
      if (err instanceof Error && err.message.includes('MFA code required')) {
        setShowMfa(true);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

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
      <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--xp-spacing-8)' }}>
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
              backgroundColor: 'var(--xp-brand-primary)',
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
            }}>
              Welcome to Xpress Ops
            </h2>
            <p style={{
              color: 'var(--xp-text-secondary)',
              marginTop: 'var(--xp-spacing-2)',
              fontSize: 'var(--xp-font-size-body)'
            }}>
              Sign in to access Xpress Ops Tower
            </p>
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

          {/* MFA Notice */}
          {showMfa && (
            <div style={{
              marginBottom: 'var(--xp-spacing-6)',
              padding: 'var(--xp-spacing-4)',
              backgroundColor: 'var(--xp-chip-bg-info)',
              border: '1px solid var(--xp-status-info)',
              borderRadius: 'var(--xp-radius-sm)px'
            }}>
              <p style={{
                color: 'var(--xp-status-info)',
                fontSize: 'var(--xp-font-size-body)',
                fontWeight: 'var(--xp-font-weight-medium)'
              }}>
                Multi-Factor Authentication Required
              </p>
              <p style={{
                color: 'var(--xp-status-info)',
                fontSize: 'var(--xp-font-size-body)',
                marginTop: 'var(--xp-spacing-1)'
              }}>
                Please enter your 6-digit authentication code from your authenticator app.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--xp-spacing-6)' }}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" style={{
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
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    appearance: 'none',
                    display: 'block',
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: 'var(--xp-input-paddingX)',
                    paddingTop: 'var(--xp-spacing-3)',
                    paddingBottom: 'var(--xp-spacing-3)',
                    border: `1px solid ${validationErrors.email ? 'var(--xp-status-critical)' : 'var(--xp-input-border)'}`,
                    borderRadius: 'var(--xp-radius-sm)px',
                    backgroundColor: validationErrors.email ? 'var(--xp-chip-bg-critical)' : 'var(--xp-input-bg)',
                    fontSize: 'var(--xp-font-size-body)',
                    outline: 'none',
                    transition: 'border-color var(--xp-duration-base) var(--xp-easing-standard)'
                  }}
                  placeholder="Enter your email"
                  onFocus={(e) => e.target.style.borderColor = 'var(--xp-brand-primary)'}
                  onBlur={(e) => e.target.style.borderColor = validationErrors.email ? 'var(--xp-status-critical)' : 'var(--xp-input-border)'}
                />
              </div>
              {validationErrors.email && (
                <p style={{
                  marginTop: 'var(--xp-spacing-1)',
                  fontSize: 'var(--xp-font-size-body)',
                  color: 'var(--xp-status-critical)'
                }}>
                  {validationErrors.email}
                </p>
              )}
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    appearance: 'none',
                    display: 'block',
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '40px',
                    paddingTop: 'var(--xp-spacing-3)',
                    paddingBottom: 'var(--xp-spacing-3)',
                    border: `1px solid ${validationErrors.password ? 'var(--xp-status-critical)' : 'var(--xp-input-border)'}`,
                    borderRadius: 'var(--xp-radius-sm)px',
                    backgroundColor: validationErrors.password ? 'var(--xp-chip-bg-critical)' : 'var(--xp-input-bg)',
                    fontSize: 'var(--xp-font-size-body)',
                    outline: 'none',
                    transition: 'border-color var(--xp-duration-base) var(--xp-easing-standard)'
                  }}
                  placeholder="Enter your password"
                  onFocus={(e) => e.target.style.borderColor = 'var(--xp-brand-primary)'}
                  onBlur={(e) => e.target.style.borderColor = validationErrors.password ? 'var(--xp-status-critical)' : 'var(--xp-input-border)'}
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    paddingRight: 'var(--xp-spacing-3)',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff style={{ 
                      height: '20px', 
                      width: '20px', 
                      color: 'var(--xp-input-placeholder)',
                      transition: 'color var(--xp-duration-fast) var(--xp-easing-standard)'
                    }} />
                  ) : (
                    <Eye style={{ 
                      height: '20px', 
                      width: '20px', 
                      color: 'var(--xp-input-placeholder)',
                      transition: 'color var(--xp-duration-fast) var(--xp-easing-standard)'
                    }} />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p style={{
                  marginTop: 'var(--xp-spacing-1)',
                  fontSize: 'var(--xp-font-size-body)',
                  color: 'var(--xp-status-critical)'
                }}>
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* MFA Code Field */}
            {showMfa && (
              <div>
                <label htmlFor="mfaCode" style={{
                  display: 'block',
                  fontSize: 'var(--xp-font-size-body)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  color: 'var(--xp-text-primary)',
                  marginBottom: 'var(--xp-spacing-2)'
                }}>
                  Authentication Code
                </label>
                <input
                  id="mfaCode"
                  name="mfaCode"
                  type="text"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={formData.mfaCode}
                  onChange={handleChange}
                  style={{
                    appearance: 'none',
                    display: 'block',
                    width: '100%',
                    paddingLeft: 'var(--xp-spacing-3)',
                    paddingRight: 'var(--xp-spacing-3)',
                    paddingTop: 'var(--xp-spacing-3)',
                    paddingBottom: 'var(--xp-spacing-3)',
                    border: `1px solid ${validationErrors.mfaCode ? 'var(--xp-status-critical)' : 'var(--xp-input-border)'}`,
                    borderRadius: 'var(--xp-radius-sm)px',
                    backgroundColor: validationErrors.mfaCode ? 'var(--xp-chip-bg-critical)' : 'var(--xp-input-bg)',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
                    letterSpacing: '0.1em',
                    outline: 'none',
                    transition: 'border-color var(--xp-duration-base) var(--xp-easing-standard)'
                  }}
                  placeholder="000000"
                  onFocus={(e) => e.target.style.borderColor = 'var(--xp-brand-primary)'}
                  onBlur={(e) => e.target.style.borderColor = validationErrors.mfaCode ? 'var(--xp-status-critical)' : 'var(--xp-input-border)'}
                />
                {validationErrors.mfaCode && (
                  <p style={{
                    marginTop: 'var(--xp-spacing-1)',
                    fontSize: 'var(--xp-font-size-body)',
                    color: 'var(--xp-status-critical)'
                  }}>
                    {validationErrors.mfaCode}
                  </p>
                )}
              </div>
            )}

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--xp-spacing-2)' }}>
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={handleChange}
                style={{
                  height: '16px',
                  width: '16px',
                  accentColor: 'var(--xp-brand-primary)',
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="remember" style={{
                fontSize: 'var(--xp-font-size-body)',
                color: 'var(--xp-text-secondary)',
                cursor: 'pointer'
              }}>
                Remember me for 30 days
              </label>
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
                  color: isLoading ? 'var(--xp-button-primary-text)' : 'var(--xp-button-primary-text)',
                  backgroundColor: isLoading ? 'var(--xp-button-primary-bg)' : 'var(--xp-button-primary-bg)',
                  opacity: isLoading ? 'var(--xp-opacity-disabled)' : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all var(--xp-duration-base) var(--xp-easing-standard)',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = 'var(--xp-button-primary-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = 'var(--xp-button-primary-bg)';
                  }
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 var(--xp-focus-ring-width) var(--xp-focus-ring)';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              >
                {isLoading ? (
                  <Loader2 style={{ height: '16px', width: '16px' }} className="animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div style={{
            marginTop: 'var(--xp-spacing-6)',
            padding: 'var(--xp-spacing-4)',
            backgroundColor: 'var(--xp-color-gray-50)',
            borderRadius: 'var(--xp-radius-sm)px'
          }}>
            <p style={{
              fontSize: 'var(--xp-font-size-caption)',
              color: 'var(--xp-text-secondary)',
              fontWeight: 'var(--xp-font-weight-medium)',
              marginBottom: 'var(--xp-spacing-2)'
            }}>Demo Credentials:</p>
            <div style={{
              fontSize: 'var(--xp-font-size-caption)',
              color: 'var(--xp-text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--xp-spacing-1)'
            }}>
              <p><strong style={{ fontWeight: 'var(--xp-font-weight-medium)' }}>Email:</strong> admin@xpress.ops</p>
              <p><strong style={{ fontWeight: 'var(--xp-font-weight-medium)' }}>Password:</strong> demo123</p>
              <p style={{ color: 'var(--xp-color-gray-400)' }}>Use these credentials to access the demo environment</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 'var(--xp-font-size-caption)',
            color: 'var(--xp-text-muted)'
          }}>
            Xpress Ops Tower v2.0 - Secure Authentication
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--xp-font-family-base)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{
            height: '48px',
            width: '48px',
            color: 'var(--xp-brand-primary)',
            marginBottom: 'var(--xp-spacing-4)'
          }} className="animate-spin" />
          <p style={{
            color: 'var(--xp-text-secondary)',
            fontSize: 'var(--xp-font-size-body)'
          }}>Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}