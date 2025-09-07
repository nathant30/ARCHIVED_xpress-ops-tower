'use client';

import React from 'react';
import EnhancedDriverTable from '@/components/features/EnhancedDriverTable';

const DriversPage = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--xp-bg-page)',
      fontFamily: 'var(--xp-font-family-base)'
    }}>
      <header style={{
        backgroundColor: 'var(--xp-bg-card)',
        borderBottom: '1px solid var(--xp-border-default)',
        padding: 'var(--xp-spacing-6)',
        boxShadow: 'var(--xp-elevation-1)'
      }}>
        <h1 style={{
          fontSize: 'var(--xp-font-size-h1)',
          fontWeight: 'var(--xp-font-weight-bold)',
          color: 'var(--xp-text-primary)',
          margin: 0,
          lineHeight: 'var(--xp-line-height-tight)'
        }}>Drivers Management</h1>
        <p style={{
          fontSize: 'var(--xp-font-size-body)',
          color: 'var(--xp-text-secondary)',
          margin: 'var(--xp-spacing-1) 0 0 0'
        }}>Manage and monitor driver performance and status</p>
      </header>
      
      <div style={{ padding: 'var(--xp-spacing-6)' }}>
        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          boxShadow: 'var(--xp-elevation-2)',
          border: '1px solid var(--xp-border-default)',
          overflow: 'hidden'
        }}>
          <EnhancedDriverTable />
        </div>
      </div>
    </div>
  );
};

export default DriversPage;