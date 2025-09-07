'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

const AlertsPage = () => {
  return (
    <div className="space-y-8">
      <div className="text-center py-12 text-gray-500">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>Alerts system placeholder</p>
        <p className="text-sm text-gray-400 mt-1">Full implementation coming soon</p>
      </div>
    </div>
  );
};

export default AlertsPage;