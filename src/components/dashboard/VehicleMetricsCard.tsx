'use client';

import React from 'react';
import { 
  Car, 
  Activity, 
  Wrench, 
  AlertTriangle,
  TrendingUp,
  Battery,
  Fuel,
  Shield,
  CheckCircle
} from 'lucide-react';

interface VehicleMetrics {
  totalVehicles: number;
  activeVehicles: number;
  vehiclesInService: number;
  vehiclesInMaintenance: number;
  overdueMaintenance: number;
  activeAlerts: number;
  avgUtilization: number;
  fuelEfficiencyTrend: number;
  complianceScore: number;
  totalRevenue30d: number;
}

interface VehicleMetricsCardProps {
  metrics: VehicleMetrics;
  loading?: boolean;
}

const VehicleMetricsCard: React.FC<VehicleMetricsCardProps> = ({ metrics, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const utilizationColor = metrics.avgUtilization >= 80 
    ? 'text-green-600' 
    : metrics.avgUtilization >= 65 
    ? 'text-yellow-600' 
    : 'text-red-600';

  const complianceColor = metrics.complianceScore >= 95 
    ? 'text-green-600' 
    : metrics.complianceScore >= 90 
    ? 'text-yellow-600' 
    : 'text-red-600';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fleet Overview</h3>
              <p className="text-sm text-gray-500">Real-time vehicle metrics</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Updated now
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.activeVehicles}</div>
            <div className="text-xs text-gray-600">Active</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.vehiclesInService}</div>
            <div className="text-xs text-gray-600">In Service</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Wrench className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.vehiclesInMaintenance}</div>
            <div className="text-xs text-gray-600">Maintenance</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{metrics.activeAlerts}</div>
            <div className="text-xs text-gray-600">Alerts</div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Fleet Utilization</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-bold ${utilizationColor}`}>
                {metrics.avgUtilization.toFixed(1)}%
              </span>
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.avgUtilization}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Compliance Score</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-bold ${complianceColor}`}>
                {metrics.complianceScore.toFixed(1)}%
              </span>
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.complianceScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Fuel className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Fuel Efficiency</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-green-600">
                +{metrics.fuelEfficiencyTrend.toFixed(1)}%
              </span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            View Fleet
          </button>
          <button className="px-3 py-2 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">
            Maintenance Due
          </button>
          <button className="px-3 py-2 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
            Active Alerts
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleMetricsCard;