'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, MapPin, TrendingUp, Activity, Target, Lightbulb, 
  Users, DollarSign, BarChart3, AlertTriangle, CheckCircle,
  Clock, Settings, Eye, Shield, Globe, Database, Zap,
  RefreshCw, Play, Search, Filter, ArrowUpRight, ArrowDownRight,
  Star, RotateCcw, X
} from 'lucide-react';

// Updated to match Bookings/Settings styling pattern
const AIExpansionsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeframe, setTimeframe] = useState('30days');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [showModelMonitor, setShowModelMonitor] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [showRecommendationDetails, setShowRecommendationDetails] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [showImplementationResult, setShowImplementationResult] = useState(false);
  const [implementationResult, setImplementationResult] = useState<any>(null);
  const [showExpansionPlanResult, setShowExpansionPlanResult] = useState(false);
  const [expansionPlanResult, setExpansionPlanResult] = useState<any>(null);
  const [showAnalyticsReport, setShowAnalyticsReport] = useState(false);
  const [analyticsReportData, setAnalyticsReportData] = useState<any>(null);
  const [showMarketAnalysis, setShowMarketAnalysis] = useState(false);
  const [marketAnalysisData, setMarketAnalysisData] = useState<any>(null);

  // Main navigation tabs - matching Settings page pattern
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'regional-ai', label: 'Regional AI', icon: MapPin },
    { id: 'recommendations', label: 'AI Recommendations', icon: Lightbulb },
    { id: 'models', label: 'Model Operations', icon: Database },
    { id: 'expansions', label: 'Market Expansion', icon: Globe },
    { id: 'insights', label: 'Insights & Analytics', icon: BarChart3 },
  ];

  // Mock regional data
  const regions = [
    {
      id: 'NCR',
      name: 'Metro Manila',
      status: 'mature_market',
      tier: 'tier_1',
      population: 13500000,
      aiHealth: 94.2,
      expansionReadiness: 0.87,
      activeModels: 8,
      monthlyRevenue: 18500000,
      growthRate: 0.12
    },
    {
      id: 'BTN',
      name: 'Bataan',
      status: 'growth_market', 
      tier: 'tier_2',
      population: 760000,
      aiHealth: 89.1,
      expansionReadiness: 0.76,
      activeModels: 5,
      monthlyRevenue: 2800000,
      growthRate: 0.18
    },
    {
      id: 'PMP',
      name: 'Pampanga',
      status: 'emerging_market',
      tier: 'tier_2',
      population: 2600000,
      aiHealth: 82.7,
      expansionReadiness: 0.68,
      activeModels: 4,
      monthlyRevenue: 5200000,
      growthRate: 0.24
    }
  ];

  // Mock AI recommendations
  const allRecommendations = [
    {
      id: 1,
      title: 'Expand AI-powered surge pricing to Bataan',
      region: 'BTN',
      confidence: 0.91,
      impact: '+18% revenue',
      priority: 'high',
      category: 'pricing',
      timeframe: '2 weeks'
    },
    {
      id: 2,
      title: 'Deploy fraud detection models in Pampanga',
      region: 'PMP',
      confidence: 0.88,
      impact: '-23% fraud incidents',
      priority: 'medium',
      category: 'safety',
      timeframe: '1 month'
    },
    {
      id: 3,
      title: 'Launch demand forecasting for Metro Manila',
      region: 'NCR',
      confidence: 0.95,
      impact: '+8% operational efficiency',
      priority: 'high',
      category: 'operations',
      timeframe: '3 weeks'
    },
    {
      id: 4,
      title: 'Implement driver behavior analytics',
      region: 'NCR',
      confidence: 0.84,
      impact: '+12% safety score',
      priority: 'medium',
      category: 'safety',
      timeframe: '1 month'
    },
    {
      id: 5,
      title: 'Optimize route algorithms for Bataan',
      region: 'BTN',
      confidence: 0.92,
      impact: '+15% efficiency',
      priority: 'high',
      category: 'operations',
      timeframe: '3 weeks'
    },
    {
      id: 6,
      title: 'Dynamic pricing model for off-peak hours',
      region: 'PMP',
      confidence: 0.79,
      impact: '+9% revenue',
      priority: 'low',
      category: 'pricing',
      timeframe: '6 weeks'
    }
  ];

  // Mock AI models with Michelangelo-inspired data
  const aiModels = [
    {
      id: 'demand-forecast',
      name: 'Demand Forecasting',
      version: '2.1',
      accuracy: 94.2,
      predictions: 187,
      status: 'online',
      lastUpdated: '2 days ago',
      deployments: ['online', 'batch', 'mobile'],
      drift: 'none',
      features: 42,
      retraining: 'auto'
    },
    {
      id: 'surge-pricing',
      name: 'Surge Pricing', 
      version: '2.2',
      accuracy: 96.8,
      predictions: 245,
      status: 'online',
      lastUpdated: '1 day ago',
      deployments: ['online', 'batch'],
      drift: 'low',
      features: 28,
      retraining: 'scheduled'
    },
    {
      id: 'fraud-detection',
      name: 'Fraud Detection',
      version: '2.3', 
      accuracy: 98.1,
      predictions: 132,
      status: 'online',
      lastUpdated: '3 hours ago',
      deployments: ['online', 'streaming'],
      drift: 'none',
      features: 89,
      retraining: 'auto'
    },
    {
      id: 'route-optimization',
      name: 'Route Optimization',
      version: '2.1',
      accuracy: 92.5,
      predictions: 298,
      status: 'maintenance',
      lastUpdated: '2 days ago',
      deployments: ['batch', 'mobile'],
      drift: 'medium',
      features: 67,
      retraining: 'manual'
    },
    {
      id: 'driver-matching',
      name: 'Driver Matching',
      version: '2.4',
      accuracy: 89.7,
      predictions: 156, 
      status: 'online',
      lastUpdated: '1 day ago',
      deployments: ['online', 'batch'],
      drift: 'none',
      features: 34,
      retraining: 'auto'
    }
  ];

  // Utility functions
  const handleAsyncAction = async (action: string, callback: () => Promise<void> | void) => {
    setIsLoading(true);
    setLoadingAction(action);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      if (typeof callback === 'function') {
        await callback();
      }
    } catch (error) {
      console.error(`Error in ${action}:`, error);
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  // Implementation handlers that show actual results
  const handleImplementRecommendation = async (rec: any) => {
    setIsLoading(true);
    setLoadingAction(`Implementing: ${rec.title}`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create implementation result
      const result = {
        recommendation: rec,
        status: 'success',
        deploymentTime: new Date(),
        affectedRegions: [rec.region],
        estimatedImpact: rec.impact,
        rollbackAvailable: true,
        monitoringEnabled: true,
        nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
      };
      
      setImplementationResult(result);
      setShowImplementationResult(true);
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleReviewRecommendation = (rec: any) => {
    setSelectedRecommendation(rec);
    setShowRecommendationDetails(true);
  };

  // Filter functions
  const filteredRegions = selectedRegion === 'all' ? regions : regions.filter(r => r.id === selectedRegion);
  
  const filteredRecommendations = allRecommendations.filter(rec => {
    const matchesCategory = selectedCategory === 'all' || rec.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.region.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const recommendations = searchTerm ? filteredRecommendations : allRecommendations.slice(0, 3);

  // Loading skeleton component
  const LoadingSkeleton = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
      <div className="bg-gray-200 rounded h-3 w-1/2"></div>
    </div>
  );

  // Tooltip component
  const Tooltip = ({ children, content, position = 'top' }: { 
    children: React.ReactNode; 
    content: string; 
    position?: 'top' | 'bottom' | 'left' | 'right';
  }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
      top: 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800',
      left: 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-800',
      right: 'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800'
    };

    return (
      <div className="relative inline-block">
        <div
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {children}
        </div>
        {showTooltip && (
          <div className={`absolute z-50 ${positionClasses[position]}`}>
            <div className="bg-gray-800 text-white text-xs rounded-lg py-2 px-3 max-w-xs text-center shadow-lg">
              {content}
              <div className={`absolute w-0 h-0 ${arrowClasses[position]}`}></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Global loading overlay
  const LoadingOverlay = () => {
    if (!isLoading) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 flex items-center gap-4 shadow-lg">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 font-medium">{loadingAction}...</span>
        </div>
      </div>
    );
  };

  // Model Monitor Modal
  const ModelMonitorModal = () => {
    if (!showModelMonitor || !selectedModel) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{selectedModel.name} - Live Monitor</h2>
              <p className="text-sm text-gray-600">Real-time performance monitoring dashboard</p>
            </div>
            <button 
              onClick={() => setShowModelMonitor(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Real-time metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard 
                label="Current QPS" 
                value="1,847"
                trend="+12% vs avg"
                trendUp={true}
                icon={Zap}
                tooltip="Queries per second - Real-time prediction request rate for this model"
              />
              <KpiCard 
                label="Latency (P95)" 
                value="23ms"
                trend="Within SLA"
                trendUp={true}
                icon={Clock}
                tooltip="95th percentile response time - 95% of requests complete within this time"
              />
              <KpiCard 
                label="Error Rate" 
                value="0.03%"
                trend="-50% vs yesterday"
                trendUp={true}
                icon={CheckCircle}
                tooltip="Percentage of failed prediction requests - Lower is better for reliability"
              />
              <KpiCard 
                label="Model Health" 
                value={`${selectedModel.accuracy}%`}
                trend="Stable"
                trendUp={true}
                icon={Brain}
                tooltip="Overall model accuracy score based on recent predictions and validation metrics"
              />
            </div>

            {/* Deployment status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Deployment Status</h3>
              <div className="flex items-center gap-4">
                {selectedModel.deployments.map(dep => (
                  <div key={dep} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium capitalize">{dep}</span>
                    <span className="text-xs text-gray-600">Online</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prediction timeline */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Live Prediction Timeline</h3>
              <div className="space-y-2">
                {[
                  { time: '18:23:43', prediction: '0.847', input: 'route_complexity=high, traffic=medium', result: 'optimal_route_found' },
                  { time: '18:23:42', prediction: '0.923', input: 'route_complexity=low, traffic=low', result: 'optimal_route_found' },
                  { time: '18:23:41', prediction: '0.756', input: 'route_complexity=medium, traffic=high', result: 'alternative_suggested' },
                  { time: '18:23:40', prediction: '0.891', input: 'route_complexity=low, traffic=medium', result: 'optimal_route_found' },
                ].map((pred, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                    <span className="font-mono text-blue-600">{pred.time}</span>
                    <span className="font-mono">Score: {pred.prediction}</span>
                    <span className="text-gray-600 max-w-xs truncate">{pred.input}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      pred.result === 'optimal_route_found' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pred.result.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature importance */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Feature Importance</h3>
              <div className="space-y-2">
                {[
                  { feature: 'Traffic Density', importance: 0.34 },
                  { feature: 'Route Distance', importance: 0.28 },
                  { feature: 'Time of Day', importance: 0.19 },
                  { feature: 'Weather Conditions', importance: 0.12 },
                  { feature: 'Driver History', importance: 0.07 }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.feature}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{width: `${item.importance * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-12">{(item.importance * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button 
              onClick={() => setShowModelMonitor(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Export Metrics
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Implementation Result Modal
  const ImplementationResultModal = () => {
    if (!showImplementationResult || !implementationResult) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Implementation Successful</h2>
                <p className="text-sm text-gray-600">Your recommendation has been deployed to production</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">{implementationResult.recommendation.title}</h3>
              <div className="text-sm text-green-800">
                <p><strong>Region:</strong> {implementationResult.recommendation.region}</p>
                <p><strong>Expected Impact:</strong> {implementationResult.estimatedImpact}</p>
                <p><strong>Deployment Time:</strong> {implementationResult.deploymentTime.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Monitoring</span>
                </div>
                <p className="text-sm text-blue-800">Real-time monitoring is now active. Alerts will be sent if performance deviates.</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Rollback Ready</span>
                </div>
                <p className="text-sm text-purple-800">Safe rollback is available if needed. One-click revert to previous state.</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Performance will be monitored for the first 24 hours</li>
                <li>• Impact metrics will be measured and reported</li>
                <li>• Review scheduled for {implementationResult.nextReview.toLocaleDateString()}</li>
                <li>• You'll receive notifications about key milestones</li>
              </ul>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button 
              onClick={() => setShowImplementationResult(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                View Monitoring
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                View Impact Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Recommendation Details Modal  
  const RecommendationDetailsModal = () => {
    if (!showRecommendationDetails || !selectedRecommendation) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedRecommendation.title}</h2>
                <p className="text-sm text-gray-600">AI-generated recommendation analysis and implementation plan</p>
              </div>
              <button 
                onClick={() => setShowRecommendationDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Recommendation Details</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Region:</strong> {selectedRecommendation.region}</div>
                  <div><strong>Category:</strong> {selectedRecommendation.category}</div>
                  <div><strong>Priority:</strong> <StatusBadge status={selectedRecommendation.priority} /></div>
                  <div><strong>Confidence:</strong> {(selectedRecommendation.confidence * 100).toFixed(1)}%</div>
                  <div><strong>Implementation Time:</strong> {selectedRecommendation.timeframe}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Expected Impact</h3>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{selectedRecommendation.impact}</div>
                  <div className="text-sm text-green-600 mt-1">Projected improvement</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">AI Analysis Summary</h4>
              <p className="text-sm text-blue-800">
                Based on historical data analysis and predictive modeling, this recommendation has a high likelihood of success. 
                The AI model analyzed {Math.floor(Math.random() * 50 + 20)}K data points and identified key patterns that support this strategy. 
                Risk assessment shows minimal downside with significant upside potential.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">94.2%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">2.3x</div>
                <div className="text-sm text-gray-600">ROI Multiple</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">Low</div>
                <div className="text-sm text-gray-600">Risk Level</div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button 
              onClick={() => setShowRecommendationDetails(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowRecommendationDetails(false);
                  handleImplementRecommendation(selectedRecommendation);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Implement Now
              </button>
              <button 
                onClick={() => {
                  setShowRecommendationDetails(false);
                  setTimeout(() => {
                    alert(`📅 Implementation scheduled successfully!\n\nRecommendation: "${selectedRecommendation.title}"\nScheduled for: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}\nAssigned to: Operations Team\nPriority: ${selectedRecommendation.priority.toUpperCase()}\n\nCalendar invite sent to stakeholders.`);
                  }, 300);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Schedule Implementation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Expansion Plan Result Modal
  const ExpansionPlanResultModal = () => {
    if (!showExpansionPlanResult || !expansionPlanResult) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">New Expansion Plan Generated</h2>
                  <p className="text-sm text-gray-600">Strategic market expansion analysis complete</p>
                </div>
              </div>
              <button 
                onClick={() => setShowExpansionPlanResult(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Plan Generation Complete</h3>
              </div>
              <p className="text-green-800">Generated comprehensive expansion strategy for {expansionPlanResult.targetRegion} with projected ROI of {expansionPlanResult.projectedROI}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{expansionPlanResult.marketSize}</div>
                <div className="text-sm text-blue-600">Market Size</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">{expansionPlanResult.timeline}</div>
                <div className="text-sm text-purple-600">Timeline</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-900">{expansionPlanResult.investment}</div>
                <div className="text-sm text-orange-600">Investment</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Key Strategic Points</h4>
              <div className="space-y-2">
                {expansionPlanResult.strategies.map((strategy: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{strategy}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button 
              onClick={() => setShowExpansionPlanResult(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowExpansionPlanResult(false);
                  setTimeout(() => {
                    alert(`💾 Expansion plan saved successfully!\n\nPlan: "${expansionPlanResult.targetRegion} Expansion Strategy"\nSaved to: Strategic Plans Database\nAccess level: Management & Strategy Teams\n\nPlan ID: EXP-${Date.now().toString().slice(-6)}`);
                  }, 300);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Plan
              </button>
              <button 
                onClick={() => {
                  setShowExpansionPlanResult(false);
                  setTimeout(() => {
                    alert(`🚀 Implementation started for ${expansionPlanResult.targetRegion}!\n\nPhase 1: Market preparation (Week 1-4)\nPhase 2: Team recruitment (Week 5-8)\nPhase 3: Operations launch (Week 9-12)\nPhase 4: Marketing rollout (Week 13-16)\n\nProject manager assigned: Maria Santos\nBudget allocated: ${expansionPlanResult.investment}`);
                  }, 300);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Start Implementation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Analytics Report Modal
  const AnalyticsReportModal = () => {
    if (!showAnalyticsReport || !analyticsReportData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Analytics Report Generated</h2>
                  <p className="text-sm text-gray-600">Comprehensive business intelligence analysis</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAnalyticsReport(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{analyticsReportData.totalRevenue}</div>
                <div className="text-sm text-blue-600">Total Revenue</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-900">{analyticsReportData.growth}</div>
                <div className="text-sm text-green-600">Growth Rate</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-900">{analyticsReportData.activeUsers}</div>
                <div className="text-sm text-orange-600">Active Users</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">{analyticsReportData.satisfaction}</div>
                <div className="text-sm text-purple-600">Satisfaction</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Key Performance Indicators</h4>
                <div className="space-y-3">
                  {analyticsReportData.kpis.map((kpi: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{kpi.metric}</span>
                      <span className={`text-sm font-bold ${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-500' : 'text-gray-600'}`}>
                        {kpi.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Insights & Recommendations</h4>
                <div className="space-y-2">
                  {analyticsReportData.insights.map((insight: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button 
              onClick={() => setShowAnalyticsReport(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowAnalyticsReport(false);
                  setTimeout(() => {
                    alert(`📄 Analytics report exported successfully!\n\nFile: "Nexus_AI_Analytics_Report_${new Date().toISOString().slice(0,10)}.pdf"\nSize: 2.4 MB\nFormat: PDF with interactive charts\nDownload location: ~/Downloads/\n\nReport includes all KPIs, trends, and recommendations for the selected period.`);
                  }, 300);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Export PDF
              </button>
              <button 
                onClick={() => {
                  setShowAnalyticsReport(false);
                  setTimeout(() => {
                    alert(`📤 Report shared successfully!\n\nShared with:\n• Executive Team (CEO, COO, CFO)\n• Operations Managers\n• Strategy Department\n• Regional Directors\n\nAccess level: View & Comment\nExpiration: 30 days\nNotifications sent via email & Slack`);
                  }, 300);
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Share Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Market Analysis Modal
  const MarketAnalysisModal = () => {
    if (!showMarketAnalysis || !marketAnalysisData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Market Analysis Complete</h2>
                  <p className="text-sm text-gray-600">Detailed market opportunity assessment for {marketAnalysisData.region}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMarketAnalysis(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Analysis Results</h3>
              </div>
              <p className="text-green-800">Market potential score: {marketAnalysisData.potentialScore}/100 - {marketAnalysisData.recommendation}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{marketAnalysisData.marketSize}</div>
                <div className="text-sm text-blue-600">Market Size</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-900">{marketAnalysisData.competition}</div>
                <div className="text-sm text-orange-600">Competition Level</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">{marketAnalysisData.growthRate}</div>
                <div className="text-sm text-purple-600">Growth Rate</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Market Opportunities</h4>
                <div className="space-y-2">
                  {marketAnalysisData.opportunities.map((opportunity: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{opportunity}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Risk Factors</h4>
                <div className="space-y-2">
                  {marketAnalysisData.risks.map((risk: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button 
              onClick={() => setShowMarketAnalysis(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowMarketAnalysis(false);
                  setTimeout(() => {
                    alert(`✅ Expansion approved for ${marketAnalysisData.region}!\n\nNext steps:\n• Legal team will prepare documentation\n• Operations team will begin setup\n• Marketing will launch pre-launch campaign\n• Target go-live date: ${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
                  }, 300);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Proceed with Expansion
              </button>
              <button 
                onClick={() => {
                  setShowMarketAnalysis(false);
                  setTimeout(() => {
                    alert(`📋 Detailed study requested for ${marketAnalysisData.region}!\n\nStudy will include:\n• Comprehensive competitor analysis\n• Customer demand survey\n• Regulatory compliance review\n• Financial feasibility assessment\n\nEstimated completion: 2-3 weeks`);
                  }, 300);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Request Detailed Study
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // KPI Card component matching Settings/Bookings pattern
  const KpiCard = ({ label, value, trend, trendUp, icon: Icon, className = "", tooltip }: {
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon?: any;
    className?: string;
    tooltip?: string;
  }) => {
    const card = (
      <div className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4 cursor-help ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trendUp ? "text-emerald-600" : trend.includes('-') ? "text-red-500" : "text-emerald-600"
          }`}>
            {trendUp ? 
              <ArrowUpRight className="w-3 h-3" /> : 
              trend.includes('-') ? 
              <ArrowDownRight className="w-3 h-3" /> :
              <ArrowUpRight className="w-3 h-3" />
            }
            <span>{trend}</span>
          </div>
        )}
      </div>
    );

    if (tooltip) {
      return <Tooltip content={tooltip}>{card}</Tooltip>;
    }
    
    return card;
  };

  // Status badge component
  const StatusBadge = ({ status, className = "", tooltip }: { status: string; className?: string; tooltip?: string }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'mature_market': return 'bg-green-100 text-green-800 border-green-200';
        case 'growth_market': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'emerging_market': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'high': return 'bg-red-100 text-red-800 border-red-200';
        case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getTooltipText = (status: string) => {
      switch (status) {
        case 'mature_market': return 'Established market with stable growth and high penetration';
        case 'growth_market': return 'Expanding market with strong growth potential and increasing adoption';
        case 'emerging_market': return 'New market opportunity with early-stage development';
        case 'high': return 'High priority - requires immediate attention and action';
        case 'medium': return 'Medium priority - should be addressed within reasonable timeframe';
        case 'low': return 'Low priority - can be addressed when resources permit';
        default: return 'Status indicator for tracking progress and priority levels';
      }
    };

    const badge = (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border cursor-help ${getStatusColor(status)} ${className}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );

    const tooltipText = tooltip || getTooltipText(status);
    return <Tooltip content={tooltipText}>{badge}</Tooltip>;
  };

  // Overview Tab Content
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Nexus AI Overview</h2>
          <p className="text-sm text-gray-600 mt-1">Intelligent regional expansion with AI-powered insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
            <Brain className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">AI Systems Online</span>
          </div>
          <Tooltip content="Refresh all overview data and metrics to get the latest information">
            <button 
              onClick={() => {
                setIsLoading(true);
                setLoadingAction('Refreshing overview data');
                setTimeout(() => {
                  setIsLoading(false);
                  setLoadingAction('');
                  alert('✅ Overview data refreshed successfully!\n\n• Updated KPI metrics\n• Refreshed regional performance data\n• Synchronized AI model statuses\n• Updated recommendation priorities\n\nAll data is now current as of ' + new Date().toLocaleTimeString());
                }, 1500);
              }}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading && loadingAction.includes('Refreshing') ? 'animate-spin' : ''}`} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          label="Total Regions" 
          value={regions.length.toString()}
          trend="+2 this quarter"
          trendUp={true}
          icon={MapPin}
          tooltip="Number of geographical regions currently managed by Nexus AI, including Metro Manila, Bataan, and Pampanga. Shows expansion progress across territories."
        />
        <KpiCard 
          label="AI Models Active" 
          value="17"
          trend="94.2% avg health"
          trendUp={true}
          icon={Brain}
          tooltip="Total number of deployed AI/ML models across all regions. Health score indicates average performance and reliability of all active models."
        />
        <KpiCard 
          label="Monthly Revenue" 
          value="₱26.5M"
          trend="+15.2% vs last month"
          trendUp={true}
          icon={DollarSign}
          tooltip="Total revenue generated across all regions this month. Growth percentage shows month-over-month performance improvement."
        />
        <KpiCard 
          label="AI Recommendations" 
          value="24"
          trend="8 high priority"
          icon={Lightbulb}
          tooltip="Number of active AI-generated recommendations for expansion strategies. High priority items require immediate review and action."
        />
      </div>

      {/* Regional Overview Cards */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Regional Performance</h3>
        </div>
        <div className="p-4">
          <div className="grid gap-4">
            {regions.map(region => (
              <div key={region.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                onClick={() => {
                  setSelectedRegion(region.id);
                  setActiveTab('regional-ai');
                  console.log(`Selected region: ${region.name}`);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{region.name}</div>
                    <div className="text-sm text-gray-600">
                      {region.population.toLocaleString()} population • {region.activeModels} AI models
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ₱{(region.monthlyRevenue / 1000000).toFixed(1)}M/mo
                    </div>
                    <div className="text-xs text-gray-600">
                      +{(region.growthRate * 100).toFixed(1)}% growth
                    </div>
                  </div>
                  <StatusBadge status={region.status} />
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      region.aiHealth > 90 ? 'bg-green-500' : 
                      region.aiHealth > 80 ? 'bg-orange-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-600">{region.aiHealth}% AI Health</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top AI Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Top AI Recommendations</h3>
            <Tooltip content="Navigate to AI Recommendations tab to view all available recommendations with filtering options">
              <button 
                onClick={() => {
                  setActiveTab('recommendations');
                  console.log('Navigating to full recommendations view...');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
            </Tooltip>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {allRecommendations.slice(0, 3).map(rec => (
              <div key={rec.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-purple-50 rounded">
                    <Lightbulb className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{rec.title}</div>
                    <div className="text-sm text-gray-600">
                      {rec.region} • {rec.impact} • {(rec.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={rec.priority} />
                  <span className="text-xs text-gray-500">{rec.timeframe}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Regional AI Tab Content
  const renderRegionalAI = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Regional AI Intelligence</h2>
          <p className="text-sm text-gray-600 mt-1">AI insights and analytics for each expansion region</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Regions</option>
            <option value="NCR">Metro Manila</option>
            <option value="BTN">Bataan</option>
            <option value="PMP">Pampanga</option>
          </select>
          <button 
            onClick={() => {
              setIsLoading(true);
              setLoadingAction('Refreshing regional data');
              setTimeout(() => {
                setIsLoading(false);
                setLoadingAction('');
                alert('🌏 Regional data refreshed successfully!\n\n• Updated performance metrics for all regions\n• Refreshed driver and passenger counts\n• Synchronized demand forecasting data\n• Updated regional AI model performance\n\nRegional insights are now current.');
              }, 1800);
            }}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading && loadingAction.includes('regional') ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredRegions.map(region => (
          <div key={region.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{region.name}</h3>
                <StatusBadge status={region.status} />
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <KpiCard 
                  label="AI Health" 
                  value={`${region.aiHealth}%`}
                  trend={`${region.activeModels} models`}
                  trendUp={true}
                  icon={Brain}
                  tooltip="Overall health score of all AI models deployed in this region. Based on accuracy, performance, and reliability metrics."
                />
                <KpiCard 
                  label="Expansion Score" 
                  value={`${Math.round(region.expansionReadiness * 100)}%`}
                  trend={`${region.tier.replace('_', ' ').toUpperCase()}`}
                  icon={Target}
                  tooltip="Readiness score for further expansion in this region based on market conditions, infrastructure, and growth potential."
                />
              </div>
              <div className="pt-2">
                <div className="text-xs font-medium text-gray-500 mb-2">MONTHLY PERFORMANCE</div>
                <div className="text-2xl font-bold text-gray-900">
                  ₱{(region.monthlyRevenue / 1000000).toFixed(1)}M
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+{(region.growthRate * 100).toFixed(1)}% growth</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // AI Recommendations Tab Content
  const renderAIRecommendations = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Recommendations Engine</h2>
          <p className="text-sm text-gray-600 mt-1">Machine learning powered recommendations for expansion strategies</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="pricing">Pricing</option>
              <option value="safety">Safety</option>
              <option value="operations">Operations</option>
            </select>
          </div>
          <button 
            onClick={() => handleAsyncAction('Generating new recommendations', () => {
              // Generate 2-3 new recommendations
              const newRecs = [
                {
                  id: Date.now() + 1,
                  title: 'Implement dynamic driver incentives',
                  region: 'NCR',
                  confidence: 0.87,
                  impact: '+22% driver retention',
                  priority: 'high',
                  category: 'operations',
                  timeframe: '2 weeks'
                },
                {
                  id: Date.now() + 2,
                  title: 'Deploy predictive maintenance for fleet',
                  region: 'BTN',
                  confidence: 0.93,
                  impact: '-35% vehicle downtime',
                  priority: 'medium',
                  category: 'operations',
                  timeframe: '1 month'
                }
              ];
              
              // Add to recommendations list (this would normally update the backend)
              allRecommendations.push(...newRecs);
              
              // Show success notification
              setTimeout(() => {
                alert(`✅ Generated ${newRecs.length} new AI recommendations based on latest data patterns!`);
              }, 100);
            })}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && loadingAction.includes('Generating') ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : (
              'Generate New'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard 
          label="Active Recommendations" 
          value="24"
          trend="8 high priority"
          icon={Lightbulb}
          tooltip="Total number of AI-generated recommendations currently available for review. High priority recommendations require immediate attention."
        />
        <KpiCard 
          label="Implemented This Month" 
          value="12"
          trend="+18% vs last month"
          trendUp={true}
          icon={CheckCircle}
          tooltip="Number of recommendations successfully implemented this month. Shows the execution rate of AI suggestions."
        />
        <KpiCard 
          label="Avg Confidence Score" 
          value="91.2%"
          trend="+2.1% improvement"
          trendUp={true}
          icon={Brain}
          tooltip="Average confidence level of all AI recommendations. Higher scores indicate more reliable and accurate suggestions."
        />
      </div>

      <div className="space-y-3">
        {filteredRecommendations.map(rec => (
          <div key={rec.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{rec.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {rec.region} • Expected impact: {rec.impact}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="text-xs text-gray-500">
                      Confidence: {(rec.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Category: {rec.category}
                    </div>
                    <div className="text-xs text-gray-500">
                      Timeframe: {rec.timeframe}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={rec.priority} />
                <Tooltip content="Execute this recommendation immediately and deploy the suggested changes to production">
                  <button 
                    onClick={() => handleImplementRecommendation(rec)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                  >
                    Implement
                  </button>
                </Tooltip>
                <Tooltip content="Review this recommendation in detail before making implementation decisions">
                  <button 
                    onClick={() => handleReviewRecommendation(rec)}
                    disabled={isLoading}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 disabled:opacity-50"
                  >
                    Review
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Model Operations Tab Content
  const renderModelOperations = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Model Operations</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor and manage AI/ML models across all regions</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsLoading(true);
              setLoadingAction('Deploying new model');
              setTimeout(() => {
                setIsLoading(false);
                setLoadingAction('');
                alert('🚀 New model deployed successfully!\n\nModel: "Customer Satisfaction Predictor v3.1"\nDeployment: Production environment\nAccuracy: 94.7%\nFeatures: 73 input variables\nStatus: Online and ready\n\nModel is now serving predictions in real-time.');
              }, 2200);
            }}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading && loadingAction.includes('Deploying') ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Deploying...</span>
              </div>
            ) : (
              'Deploy Model'
            )}
          </button>
          <button 
            onClick={() => {
              setIsLoading(true);
              setLoadingAction('Starting model training');
              setTimeout(() => {
                setIsLoading(false);
                setLoadingAction('');
                alert('🧠 Model training started successfully!\n\nNew Model: "Trip Demand Forecaster v4.2"\nTraining Dataset: 2.3M trips from last 6 months\nEstimated Training Time: 4-6 hours\nExpected Accuracy: 96%+\n\nTraining progress will be monitored automatically. Email notification will be sent upon completion.');
              }, 2000);
            }}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Train New Model
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          label="Predictions/Second" 
          value="1.2M"
          trend="Peak: 2.8M/sec"
          trendUp={true}
          icon={Zap}
          tooltip="Real-time prediction throughput across all AI models. Shows current load and peak capacity achieved."
        />
        <KpiCard 
          label="Active Models" 
          value="17"
          trend="5K+ in production"
          icon={Database}
          tooltip="Currently deployed AI models in production environments. Total includes models across all regions and use cases."
        />
        <KpiCard 
          label="Training Jobs/Month" 
          value="847"
          trend="+23% vs last month"
          trendUp={true}
          icon={Brain}
          tooltip="Number of model training and retraining jobs executed this month. Higher numbers indicate active model improvement."
        />
        <KpiCard 
          label="Feature Store" 
          value="2,341"
          trend="89 teams using"
          icon={Target}
          tooltip="Total features available in the centralized feature store. Used across multiple teams for consistent ML feature engineering."
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Model Performance Dashboard</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {aiModels.map((model) => (
              <div key={model.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Database className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{model.name}</div>
                    <div className="text-sm text-gray-600">
                      Version {model.version} • {model.features} features • {model.retraining} retraining
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {model.deployments.map(dep => (
                        <Tooltip 
                          key={dep}
                          content={`${dep} deployment environment - Model is actively serving predictions in this mode`}
                        >
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded cursor-help">
                            {dep}
                          </span>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {model.accuracy}% accuracy
                    </div>
                    <div className="text-xs text-gray-600">
                      {model.predictions}K predictions/day
                    </div>
                    <Tooltip content={
                      model.drift === 'none' ? 'No data drift detected - model performance is stable' :
                      model.drift === 'low' ? 'Low data drift detected - monitor closely but no immediate action required' :
                      'Medium data drift detected - consider retraining to maintain accuracy'
                    }>
                      <div className={`text-xs font-medium cursor-help ${
                        model.drift === 'none' ? 'text-green-600' :
                        model.drift === 'low' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {model.drift === 'none' ? '✓ No drift' : 
                         model.drift === 'low' ? '⚠ Low drift' : '⚠ Medium drift'}
                      </div>
                    </Tooltip>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    model.status === 'online' ? 'bg-green-500' : 
                    model.status === 'maintenance' ? 'bg-orange-500' : 'bg-red-500'
                  }`}></div>
                  <div className="flex flex-col gap-1">
                    <Tooltip content="Open real-time monitoring dashboard with performance metrics, prediction timeline, and feature importance">
                      <button 
                        onClick={() => {
                          setSelectedModel(model);
                          setShowModelMonitor(true);
                        }}
                        disabled={isLoading}
                        className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        Monitor
                      </button>
                    </Tooltip>
                    <Tooltip content="Start model retraining process to improve accuracy and address any detected data drift">
                      <button 
                        onClick={() => {
                          setIsLoading(true);
                          setLoadingAction(`Retraining ${model.name}`);
                          setTimeout(() => {
                            setIsLoading(false);
                            setLoadingAction('');
                            alert(`🔄 Model retraining initiated!\n\nModel: ${model.name} v${model.version}\nCurrent Accuracy: ${model.accuracy}%\nTarget Improvement: +2-4%\nEstimated Time: 2-3 hours\n\nRetraining will use latest data to improve model performance and reduce drift.`);
                          }, 1600);
                        }}
                        disabled={isLoading}
                        className="text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      >
                        Retrain
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Store Section - Inspired by Michelangelo Palette */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Feature Store (Palette)</h3>
            <button 
              onClick={() => {
                setIsLoading(true);
                setLoadingAction('Creating new feature');
                setTimeout(() => {
                  setIsLoading(false);
                  setLoadingAction('');
                  alert('✨ New feature created successfully!\n\nFeature: "peak_hour_demand_ratio"\nType: Numerical (continuous)\nDescription: Ratio of peak to off-peak demand\nData Source: Trip analytics pipeline\nRefresh Rate: Real-time\n\nFeature is now available in the Feature Store for all ML models.');
                }, 1900);
              }}
              disabled={isLoading}
              className="px-3 py-1.5 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50"
            >
              Create Feature
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Driver Behavior Score', type: 'Real-time', teams: 12, usage: 'High' },
              { name: 'Location Demand Index', type: 'Batch', teams: 8, usage: 'High' },
              { name: 'Weather Impact Factor', type: 'Streaming', teams: 5, usage: 'Medium' },
              { name: 'Time-of-Day Features', type: 'Real-time', teams: 15, usage: 'High' },
              { name: 'Route Complexity Score', type: 'Batch', teams: 6, usage: 'Medium' },
              { name: 'Fraud Risk Indicators', type: 'Streaming', teams: 9, usage: 'High' }
            ].map((feature, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="font-medium text-gray-900 mb-1">{feature.name}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    feature.type === 'Real-time' ? 'bg-green-100 text-green-800' :
                    feature.type === 'Streaming' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {feature.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    feature.usage === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {feature.usage} Usage
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  Used by {feature.teams} teams
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Market Expansion Tab Content
  const renderMarketExpansion = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Market Expansion Planning</h2>
          <p className="text-sm text-gray-600 mt-1">Strategic expansion planning with data-driven insights</p>
        </div>
        <button 
          onClick={() => {
            setIsLoading(true);
            setLoadingAction('Creating new expansion plan');
            setTimeout(() => {
              const expansionPlan = {
                targetRegion: 'Cebu Metropolitan Area',
                projectedROI: '156%',
                marketSize: '₱2.8B',
                timeline: '18 months',
                investment: '₱85M',
                strategies: [
                  'Establish 3 regional hubs in key business districts',
                  'Partner with local universities for driver recruitment',
                  'Launch targeted marketing campaign for tourist corridors',
                  'Implement dynamic pricing strategy for peak tourism seasons',
                  'Build strategic partnerships with hotels and airports'
                ]
              };
              setExpansionPlanResult(expansionPlan);
              setShowExpansionPlanResult(true);
              setIsLoading(false);
              setLoadingAction('');
            }, 2000);
          }}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading && loadingAction.includes('Creating') ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating...</span>
            </div>
          ) : (
            'New Expansion Plan'
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard 
          label="Expansion Opportunities" 
          value="8"
          trend="3 high potential"
          icon={Globe}
        />
        <KpiCard 
          label="Market Penetration" 
          value="67%"
          trend="+5% this quarter"
          trendUp={true}
          icon={TrendingUp}
        />
        <KpiCard 
          label="ROI Projection" 
          value="142%"
          trend="24 month timeline"
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Expansion Opportunities</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { city: 'Laguna', score: 85, population: '3.2M', competition: 'Low' },
              { city: 'Cavite', score: 78, population: '4.1M', competition: 'Medium' },
              { city: 'Bulacan', score: 72, population: '3.8M', competition: 'Low' },
              { city: 'Rizal', score: 68, population: '3.3M', competition: 'High' }
            ].map(city => (
              <div key={city.city} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{city.city}</div>
                  <div className="text-sm text-gray-600">{city.population} population</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">Score: {city.score}/100</div>
                    <div className="text-xs text-gray-600">Competition: {city.competition}</div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsLoading(true);
                      setLoadingAction(`Analyzing ${city.city} market`);
                      setTimeout(() => {
                        const analysisData = {
                          region: city.city,
                          potentialScore: city.score,
                          recommendation: city.score > 80 ? 'High Priority Expansion' : city.score > 70 ? 'Moderate Priority' : 'Consider Later',
                          marketSize: `₱${(Math.random() * 2 + 1).toFixed(1)}B`,
                          competition: city.competition,
                          growthRate: `${Math.floor(Math.random() * 15 + 8)}%`,
                          opportunities: [
                            'Strong university presence drives student demand',
                            'Growing residential developments in suburban areas',
                            'Limited public transportation creates service gaps',
                            'High smartphone penetration among target demographics',
                            'Tourism growth in nearby attractions'
                          ],
                          risks: [
                            'Seasonal demand fluctuations during school breaks',
                            'Potential regulatory changes in local transport policies',
                            'Competition from existing transport cooperatives',
                            'Weather-dependent service disruptions',
                            'Economic sensitivity of target market'
                          ]
                        };
                        setMarketAnalysisData(analysisData);
                        setShowMarketAnalysis(true);
                        setIsLoading(false);
                        setLoadingAction('');
                      }, 1800);
                    }}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                  >
                    Analyze
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Active Expansion Projects</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { project: 'Bataan Market Entry', progress: 75, timeline: '2 weeks left', status: 'on_track' },
              { project: 'Pampanga Driver Onboarding', progress: 45, timeline: '1 month left', status: 'on_track' },
              { project: 'Tarlac Feasibility Study', progress: 90, timeline: '3 days left', status: 'ahead' }
            ].map(project => (
              <div key={project.project} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{project.project}</div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    project.status === 'ahead' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {project.status === 'ahead' ? 'Ahead of Schedule' : 'On Track'}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                    style={{width: `${project.progress}%`}}
                  ></div>
                </div>
                <div className="text-sm text-gray-600">{project.timeline}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Insights & Analytics Tab Content
  const renderInsightsAnalytics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Advanced Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Deep insights and predictive analytics dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
          <button 
            onClick={() => {
              setIsLoading(true);
              setLoadingAction('Generating analytics report');
              setTimeout(() => {
                const reportData = {
                  totalRevenue: '₱26.5M',
                  growth: '+15.2%',
                  activeUsers: '245K',
                  satisfaction: '4.8/5',
                  kpis: [
                    { metric: 'Trip Completion Rate', value: '96.8%', trend: 'up' },
                    { metric: 'Average Response Time', value: '3.2min', trend: 'down' },
                    { metric: 'Driver Utilization', value: '87%', trend: 'up' },
                    { metric: 'Customer Retention', value: '89.5%', trend: 'up' },
                    { metric: 'Revenue per Trip', value: '₱112', trend: 'up' }
                  ],
                  insights: [
                    'Peak demand hours shifted to 7-9 AM due to office hour changes',
                    'Customer satisfaction increased by 12% after implementing new driver training',
                    'Revenue growth is 18% higher in tourist-heavy areas',
                    'Driver retention improved by 25% with new incentive programs',
                    'Mobile app usage increased by 34% in the last quarter'
                  ]
                };
                setAnalyticsReportData(reportData);
                setShowAnalyticsReport(true);
                setIsLoading(false);
                setLoadingAction('');
              }, 2500);
            }}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading && loadingAction.includes('report') ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : (
              'Generate Report'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          label="Total Revenue" 
          value="₱26.5M"
          trend="+15.2% vs last month"
          trendUp={true}
          icon={DollarSign}
        />
        <KpiCard 
          label="Completed Trips" 
          value="142K"
          trend="+8.7% vs last month"
          trendUp={true}
          icon={CheckCircle}
        />
        <KpiCard 
          label="Active Drivers" 
          value="3.2K"
          trend="+12.3% vs last month"
          trendUp={true}
          icon={Users}
        />
        <KpiCard 
          label="Customer Satisfaction" 
          value="4.8/5"
          trend="+0.2 vs last month"
          trendUp={true}
          icon={Star}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          </div>
          <div className="p-4">
            <div className="text-center text-gray-500 py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <div className="text-lg font-medium text-gray-900 mb-2">Revenue Analytics Chart</div>
              <div className="text-sm text-gray-600">Interactive revenue trends visualization</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Predictive Insights</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <div className="font-medium text-blue-900">Revenue Forecast</div>
              </div>
              <div className="text-sm text-blue-800">Expected 18% increase in next quarter based on current trends</div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-600" />
                <div className="font-medium text-green-900">Driver Demand</div>
              </div>
              <div className="text-sm text-green-800">Optimal driver count achieved in Metro Manila region</div>
            </div>
            
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <div className="font-medium text-orange-900">Market Alert</div>
              </div>
              <div className="text-sm text-orange-800">Increased competition detected in Pampanga area</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <LoadingOverlay />
      <ModelMonitorModal />
      <ImplementationResultModal />
      <RecommendationDetailsModal />
      <ExpansionPlanResultModal />
      <AnalyticsReportModal />
      <MarketAnalysisModal />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nexus AI</h1>
              <p className="text-gray-600">Intelligent expansion management with AI-powered insights and recommendations</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search regions, models, recommendations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                />
                {searchTerm && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Navigation Tabs - Matching Settings/Bookings Pattern */}
        <div className="flex items-center gap-1 overflow-x-auto mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-blue-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'regional-ai' && renderRegionalAI()}
            {activeTab === 'recommendations' && renderAIRecommendations()}
            {activeTab === 'models' && renderModelOperations()}
            {activeTab === 'expansions' && renderMarketExpansion()}
            {activeTab === 'insights' && renderInsightsAnalytics()}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default AIExpansionsPage;