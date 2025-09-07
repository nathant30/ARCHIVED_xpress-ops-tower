'use client';

import React from 'react';
import EnhancedPassengerTable from '@/components/features/EnhancedPassengerTable';

const PassengersPage = () => {
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
        }}>Passengers Management</h1>
        <p style={{
          fontSize: 'var(--xp-font-size-body)',
          color: 'var(--xp-text-secondary)',
          margin: 'var(--xp-spacing-1) 0 0 0'
        }}>Monitor passenger activity and service usage</p>
      </header>
      
      <div style={{ padding: 'var(--xp-spacing-6)' }}>
        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          boxShadow: 'var(--xp-elevation-2)',
          border: '1px solid var(--xp-border-default)',
          overflow: 'hidden'
        }}>
          <EnhancedPassengerTable />
        </div>
      </div>
    </div>
  );
};

export default PassengersPage;