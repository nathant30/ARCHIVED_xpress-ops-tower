'use client';

import { MapPin } from 'lucide-react';

export function RealTimePricingMap({ initialData }: { initialData: any }) {
  return (
    <div className="h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-600 dark:text-slate-400">Real-time Pricing Map</p>
        <p className="text-xs text-slate-500">Interactive map integration needed</p>
      </div>
    </div>
  );
}