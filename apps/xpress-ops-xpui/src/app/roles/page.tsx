'use client';

import React from 'react';
import { Shield, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PermissionGate } from '@/hooks/useRBAC';

export default function RolesPage() {
  const router = useRouter();

  // Redirect to settings page with users tab active
  React.useEffect(() => {
    router.push('/settings?tab=users');
  }, [router]);

  return (
    <PermissionGate 
      permissions={['manage_users', 'assign_roles']} 
      requireAll={false}
      fallback={
        <div style={{
          minHeight: '100vh',
          backgroundColor: 'var(--xp-bg-page)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--xp-font-family-base)'
        }}>
          <div style={{
            textAlign: 'center',
            padding: 'var(--xp-spacing-6)',
            backgroundColor: 'var(--xp-bg-card)',
            borderRadius: 'var(--xp-radius-lg)px',
            boxShadow: 'var(--xp-elevation-2)',
            border: `1px solid var(--xp-border-default)`,
            maxWidth: '480px'
          }}>
            <Shield style={{
              width: '64px',
              height: '64px',
              margin: '0 auto var(--xp-spacing-4)',
              color: 'var(--xp-text-tertiary)'
            }} />
            <h2 style={{
              fontSize: 'var(--xp-text-xl)',
              fontWeight: 'var(--xp-font-weight-semibold)',
              color: 'var(--xp-text-secondary)',
              marginBottom: 'var(--xp-spacing-2)'
            }}>Access Denied</h2>
            <p style={{
              color: 'var(--xp-text-secondary)',
              fontSize: 'var(--xp-text-base)'
            }}>
              You don't have permission to manage roles. Contact your administrator for access.
            </p>
          </div>
        </div>
      }
    >
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--xp-bg-page)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--xp-font-family-base)'
      }}>
        <div style={{
          textAlign: 'center',
          padding: 'var(--xp-spacing-6)',
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          boxShadow: 'var(--xp-elevation-2)',
          border: `1px solid var(--xp-border-default)`,
          maxWidth: '480px'
        }}>
          <Settings style={{
            width: '64px',
            height: '64px',
            margin: '0 auto var(--xp-spacing-4)',
            color: 'var(--xp-button-primary-bg)',
            animation: 'spin 1s linear infinite'
          }} />
          <h2 style={{
            fontSize: 'var(--xp-text-xl)',
            fontWeight: 'var(--xp-font-weight-semibold)',
            color: 'var(--xp-text-secondary)',
            marginBottom: 'var(--xp-spacing-2)'
          }}>Redirecting...</h2>
          <p style={{
            color: 'var(--xp-text-secondary)',
            fontSize: 'var(--xp-text-base)'
          }}>
            Taking you to the User Management section.
          </p>
        </div>
      </div>
    </PermissionGate>
  );
}