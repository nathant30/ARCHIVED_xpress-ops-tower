'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to dashboard after a brief moment
    const timer = setTimeout(() => {
      router.replace('/dashboard');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen xp-bg-page flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="space-y-4">
          <h1 className="xp-text-h1 xp-font-semibold xp-text-primary">
            Xpress Ops Tower
          </h1>
          <p className="xp-text-body xp-text-secondary">
            New UI Design System
          </p>
          <div className="flex items-center justify-center space-x-2 xp-text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="xp-text-body">Loading platform...</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/drivers')}
            className="w-full px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Driver Management
          </button>
        </div>
      </div>
    </div>
  );
}