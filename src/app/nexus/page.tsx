'use client';

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Brain, MapPin, TrendingUp, Activity, Target, Lightbulb, 
  Users, DollarSign, BarChart3, AlertTriangle, CheckCircle,
  Clock, Settings, Eye, Shield, Globe, Database, Zap,
  RefreshCw, Play, Search, Filter, ArrowUpRight, ArrowDownRight,
  Star, RotateCcw, X, XCircle, AlertCircle, ArrowUp, ArrowDown, Gauge
} from 'lucide-react';

// Error Boundary Component for robust error handling
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class NexusErrorBoundary extends Component<{children: ReactNode}, ErrorBoundaryState> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Nexus AI Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
            <div className="text-center mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-gray-600">The Nexus AI dashboard encountered an unexpected error.</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-red-900 mb-2">Error Details:</h3>
              <p className="text-sm text-red-800 font-mono">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reload Dashboard
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Go Back
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  Show technical details (dev mode)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Merged Nexus AI + AI Expansions Page
// Using ai-expansions styling with nexus technical functionality
const NexusAIPage = () => {
  // States from both pages
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeframe, setTimeframe] = useState('30days');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  
  // Filter states for recommendations
  const [priorityFilter, setPriorityFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [impactFilter, setImpactFilter] = useState('');
  
  // Modal states
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
  
  // Operational modal states
  const [showModelTweakModal, setShowModelTweakModal] = useState(false);
  const [showModelRollbackModal, setShowModelRollbackModal] = useState(false);
  const [showAddRegionModal, setShowAddRegionModal] = useState(false);
  const [showRegionManagementModal, setShowRegionManagementModal] = useState(false);
  const [showRolloutSchedulerModal, setShowRolloutSchedulerModal] = useState(false);
  
  // Technical ML metrics from nexus
  const [metrics, setMetrics] = useState({
    events_per_second: 0,
    features_computed: 0,
    models_serving: 0,
    inference_latency_ms: 0,
    prediction_accuracy: 0,
    data_freshness_score: 0
  });
  
  const [models, setModels] = useState<any[]>([]);
  const [featureGroups, setFeatureGroups] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [pythonBridgeHealth, setPythonBridgeHealth] = useState<any>(null);

  // Business data from ai-expansions  
  const [regions] = useState([
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
  ]);

  const [allRecommendations] = useState([
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
      impact: '+12% safety',
      priority: 'high',
      category: 'safety',
      timeframe: '1 week'
    },
    {
      id: 3,
      title: 'Optimize driver routing algorithms in NCR',
      region: 'NCR',
      confidence: 0.85,
      impact: '+8% efficiency',
      priority: 'medium',
      category: 'optimization',
      timeframe: '3 weeks'
    }
  ]);

  // Navigation tabs - using ai-expansions structure
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'regional-ai', label: 'Regional AI', icon: MapPin },
    { id: 'recommendations', label: 'AI Recommendations', icon: Lightbulb },
    { id: 'models', label: 'Model Operations', icon: Database },
    { id: 'expansions', label: 'Market Expansion', icon: Globe },
    { id: 'insights', label: 'Insights & Analytics', icon: BarChart3 },
  ];

  // Fetch real ML metrics (from nexus functionality)
  const fetchMLMetrics = async () => {
    try {
      const [metricsRes, modelsRes, pythonHealthRes] = await Promise.all([
        fetch('/api/ml/events/ingest?check=metrics'),
        fetch('/api/ai/status?component=serving'),
        fetch('/api/ml/bridge/python?action=health')
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics({
          events_per_second: metricsData.processing?.events_per_second || Math.floor(Math.random() * 1000) + 500,
          features_computed: metricsData.processing?.features_computed || Math.floor(Math.random() * 50000) + 100000,
          models_serving: 4,
          inference_latency_ms: Math.floor(Math.random() * 20) + 15,
          prediction_accuracy: Math.random() * 0.1 + 0.9,
          data_freshness_score: Math.random() * 0.1 + 0.9
        });
      }

      // Mock models with real structure
      setModels([
        {
          id: 'fraud_detection_v2',
          name: 'Fraud Detection',
          version: 'v2.1.0',
          status: 'active',
          accuracy: 0.947,
          requests_per_hour: 12420,
          last_updated: '2025-01-10T15:30:00Z'
        },
        {
          id: 'demand_prediction_v1',
          name: 'Demand Prediction',
          version: 'v1.3.0',
          status: 'active',
          accuracy: 0.892,
          requests_per_hour: 8630,
          last_updated: '2025-01-10T14:45:00Z'
        },
        {
          id: 'route_optimization_v3',
          name: 'Route Optimization',
          version: 'v3.0.1',
          status: 'active',
          accuracy: 0.934,
          requests_per_hour: 23100,
          last_updated: '2025-01-10T16:20:00Z'
        }
      ]);

      setFeatureGroups([
        {
          name: 'driver_behavior',
          feature_count: 9,
          entities_count: 15643,
          freshness_score: 0.96,
          quality_score: 0.94,
          issues: 2
        },
        {
          name: 'passenger_engagement',
          feature_count: 7,
          entities_count: 45221,
          freshness_score: 0.92,
          quality_score: 0.89,
          issues: 1
        }
      ]);

      if (pythonHealthRes.ok) {
        const healthData = await pythonHealthRes.json();
        setPythonBridgeHealth(healthData);
      }

      setAlerts([
        {
          id: 'alert_1',
          type: 'model_drift',
          severity: 'medium',
          title: 'Model Drift Detected',
          message: 'Fraud detection model accuracy decreased by 3% in Metro Manila region',
          timestamp: '2025-01-10T15:45:00Z',
          model_affected: 'fraud_detection_v2'
        }
      ]);

    } catch (error) {
      console.error('Failed to fetch ML metrics:', error);
    }
  };

  useEffect(() => {
    fetchMLMetrics();
    const interval = setInterval(fetchMLMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper components
  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      training: 'bg-yellow-100 text-yellow-800',
      mature_market: 'bg-green-100 text-green-800',
      growth_market: 'bg-blue-100 text-blue-800',
      emerging_market: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const KpiCard = ({ label, value, trend, trendUp, icon: Icon, tooltip }: {
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: any;
    tooltip?: string;
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-blue-500" />
      </div>
      {trend && (
        <div className="flex items-center mt-2">
          {trendUp ? (
            <ArrowUp className="h-3 w-3 text-green-500" />
          ) : (
            <ArrowDown className="h-3 w-3 text-red-500" />
          )}
          <span className={`text-xs ml-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'training': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Model operational functions
  const handleTweakModel = async (model: any) => {
    setSelectedModel(model);
    setShowModelTweakModal(true);
  };

  const handleDisableModel = async (model: any) => {
    const isConfirmed = window.confirm(
      `⚠️ CRITICAL ACTION WARNING ⚠️\n\n` +
      `You are about to disable "${model.name}".\n\n` +
      `This will:\n` +
      `• Stop ALL live predictions for this model\n` +
      `• Affect production traffic immediately\n` +
      `• Require manual re-enabling\n\n` +
      `Current model status: ${model.status}\n` +
      `Current accuracy: ${(model.accuracy * 100).toFixed(1)}%\n\n` +
      `Are you absolutely sure you want to proceed?`
    );

    if (isConfirmed) {
      // Second confirmation for critical action
      const doubleConfirm = window.confirm(
        `FINAL CONFIRMATION REQUIRED\n\n` +
        `This is your last chance to cancel.\n\n` +
        `Disabling "${model.name}" will stop live predictions.\n\n` +
        `Click OK to disable the model NOW.`
      );

      if (doubleConfirm) {
        setIsLoading(true);
        setLoadingAction(`⚠️ Disabling model ${model.name}...`);
        
        try {
          // Simulate API call to disable model
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Update model status
          const updatedModels = models.map(m => 
            m.id === model.id ? { ...m, status: 'disabled', last_updated: new Date().toISOString() } : m
          );
          setModels(updatedModels);
          
          alert(`✅ SUCCESS: Model "${model.name}" has been disabled.\n\nThe model is no longer serving predictions. You can re-enable it from the Models tab.`);
        } catch (error) {
          alert(`❌ ERROR: Failed to disable model "${model.name}".\n\nPlease try again or contact support if the issue persists.`);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleRollbackModel = async (model: any) => {
    setSelectedModel(model);
    setShowModelRollbackModal(true);
  };

  // Region management functions
  const handleAddRegion = () => {
    setShowAddRegionModal(true);
  };

  const handleManageRegions = () => {
    setShowRegionManagementModal(true);
  };

  // Recommendation rollout functions
  const handleScheduleRollout = (recommendation: any) => {
    setSelectedRecommendation(recommendation);
    setShowRolloutSchedulerModal(true);
  };

  // Business logic functions
  const handleImplementRecommendation = async (recommendation: any) => {
    setIsLoading(true);
    setLoadingAction('Implementing recommendation');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result = {
        recommendation,
        estimatedImpact: recommendation.impact,
        deploymentTime: new Date(),
        nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'success'
      };
      
      setImplementationResult(result);
      setShowImplementationResult(true);
    } catch (error) {
      console.error('Implementation failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleGenerateExpansionPlan = async (region: string = 'new_region') => {
    setIsLoading(true);
    setLoadingAction('Generating expansion plan');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const result = {
        targetRegion: region,
        projectedROI: '+34%',
        marketSize: '₱2.4M',
        timeline: '6 months',
        investment: '₱180K',
        strategies: [
          'Deploy fraud detection models with 94% accuracy baseline',
          'Implement surge pricing algorithms for peak demand periods',
          'Establish partnerships with local transportation cooperatives',
          'Launch targeted marketing campaigns in high-density areas'
        ]
      };
      
      setExpansionPlanResult(result);
      setShowExpansionPlanResult(true);
    } catch (error) {
      console.error('Plan generation failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleGenerateAnalyticsReport = async () => {
    setIsLoading(true);
    setLoadingAction('Generating analytics report');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      const result = {
        totalRevenue: '₱26.5M',
        growth: '+14.7%',
        activeUsers: '847K',
        satisfaction: '94.2%',
        kpis: [
          { metric: 'Customer Acquisition Cost', value: '₱127', trend: 'down' },
          { metric: 'Average Revenue Per User', value: '₱31.40', trend: 'up' },
          { metric: 'Driver Retention Rate', value: '89.3%', trend: 'up' },
          { metric: 'Passenger Satisfaction', value: '4.7/5', trend: 'stable' }
        ],
        insights: [
          'Metro Manila showing 18% revenue growth driven by AI surge pricing',
          'Fraud detection models prevented ₱2.1M in potential losses',
          'Route optimization reduced average trip time by 12%'
        ]
      };
      
      setAnalyticsReportData(result);
      setShowAnalyticsReport(true);
    } catch (error) {
      console.error('Analytics generation failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleGenerateMarketAnalysis = async (region: string) => {
    setIsLoading(true);
    setLoadingAction('Analyzing market opportunities');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result = {
        region,
        potentialScore: 87,
        recommendation: 'Highly recommended for expansion',
        marketSize: '₱4.2M',
        competition: 'Medium',
        growthRate: '+22%',
        opportunities: [
          'Underserved suburban routes with high demand potential',
          'Corporate partnerships with BPO companies for employee transport',
          'Integration with local mall and shopping center traffic patterns'
        ],
        risks: [
          'Seasonal traffic variations during monsoon periods',
          'Regulatory compliance requirements for new territories'
        ],
        timeline: '4-6 months to full deployment'
      };
      
      setMarketAnalysisData(result);
      setShowMarketAnalysis(true);
    } catch (error) {
      console.error('Market analysis failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  // Filter functions
  const getFilteredRecommendations = () => {
    return allRecommendations.filter(rec => {
      const matchesSearch = searchTerm === '' || 
        rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.region.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = priorityFilter === '' || rec.priority === priorityFilter;
      const matchesRegion = regionFilter === '' || rec.region === regionFilter;
      const matchesImpact = impactFilter === '' || rec.impact.includes(impactFilter);
      
      return matchesSearch && matchesPriority && matchesRegion && matchesImpact;
    });
  };

  const getFilteredRegions = () => {
    return regions.filter(region => {
      return searchTerm === '' || 
        region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        region.id.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  // Tooltip component
  // Operational Modal Components
  const ModelTweakModal: React.FC<{ isOpen: boolean; onClose: () => void; model: any }> = ({ isOpen, onClose, model }) => {
    if (!isOpen || !model) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tweak Model: {model.name}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Accuracy Threshold</label>
                <input type="range" min="0.5" max="0.99" step="0.01" defaultValue="0.85" 
                       className="w-full" />
                <div className="text-xs text-gray-500">Current: 85%</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confidence Threshold</label>
                <input type="range" min="0.1" max="0.9" step="0.01" defaultValue="0.7"
                       className="w-full" />
                <div className="text-xs text-gray-500">Current: 70%</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fraud Sensitivity</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="conservative">Conservative (fewer false positives)</option>
                <option value="balanced">Balanced</option>
                <option value="aggressive">Aggressive (catch more fraud)</option>
              </select>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">A/B Testing Mode</h4>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Deploy changes to 20% of traffic first</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={onClose} 
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ModelRollbackModal: React.FC<{ isOpen: boolean; onClose: () => void; model: any }> = ({ isOpen, onClose, model }) => {
    if (!isOpen || !model) return null;

    const versions = [
      { id: 'v2.1.3', deployed: '2024-09-01', accuracy: 0.892, status: 'current' },
      { id: 'v2.1.2', deployed: '2024-08-28', accuracy: 0.887, status: 'previous' },
      { id: 'v2.1.1', deployed: '2024-08-25', accuracy: 0.881, status: 'stable' }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Rollback Model: {model.name}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">⚠️ Rollback Warning</h4>
              <p className="text-sm text-red-800">
                Rolling back will immediately affect all live predictions. Ensure you understand the impact.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Available Versions:</h3>
              {versions.map((version) => (
                <div key={version.id} className={`p-4 border rounded-lg ${version.status === 'current' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{version.id}</span>
                        {version.status === 'current' && (
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Current</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Deployed: {version.deployed} | Accuracy: {(version.accuracy * 100).toFixed(1)}%
                      </div>
                    </div>
                    {version.status !== 'current' && (
                      <button className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">
                        Rollback to This
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={onClose} 
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AddRegionModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Add New Region</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Region Name</label>
              <input type="text" placeholder="e.g., Zambales, Bulacan" 
                     className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Population</label>
                <input type="number" placeholder="750000" 
                       className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tier</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="tier_1">Tier 1 (Major Cities)</option>
                  <option value="tier_2">Tier 2 (Provincial)</option>
                  <option value="tier_3">Tier 3 (Rural)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={onClose} 
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Create Region
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RolloutSchedulerModal: React.FC<{ isOpen: boolean; onClose: () => void; recommendation: any }> = ({ isOpen, onClose, recommendation }) => {
    const [startDate, setStartDate] = useState('');
    const [rolloutStrategy, setRolloutStrategy] = useState('gradual');
    const [trafficPercentage, setTrafficPercentage] = useState(20);
    const [successCriteria, setSuccessCriteria] = useState({
      revenueIncrease: true,
      customerSatisfaction: true,
      modelAccuracy: true
    });
    const [errors, setErrors] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !recommendation) return null;

    const validateForm = () => {
      const newErrors: any = {};
      
      // Validate start date
      if (!startDate) {
        newErrors.startDate = 'Start date is required';
      } else {
        const selectedDate = new Date(startDate);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (selectedDate < tomorrow) {
          newErrors.startDate = 'Start date must be at least 24 hours from now';
        }
      }

      // Validate traffic percentage for gradual rollout
      if (rolloutStrategy === 'gradual' && (trafficPercentage < 5 || trafficPercentage > 50)) {
        newErrors.trafficPercentage = 'Traffic percentage must be between 5% and 50% for gradual rollout';
      }

      // Validate at least one success criteria is selected
      if (!Object.values(successCriteria).some(Boolean)) {
        newErrors.successCriteria = 'At least one success criterion must be selected';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
      if (!validateForm()) return;

      setIsSubmitting(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        alert(`✅ Rollout scheduled successfully!\n\nRecommendation: ${recommendation.title}\nStrategy: ${rolloutStrategy}\nStart Date: ${startDate}\nInitial Traffic: ${trafficPercentage}%`);
        onClose();
      } catch (error) {
        alert('❌ Failed to schedule rollout. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Schedule Rollout: {recommendation.title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Recommendation Summary</h4>
              <p className="text-sm text-blue-800">
                <strong>Impact:</strong> {recommendation.impact} | 
                <strong>Confidence:</strong> {(recommendation.confidence * 100).toFixed(1)}% | 
                <strong>Region:</strong> {recommendation.region}
              </p>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Start Date *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 ${errors.startDate ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                min={new Date(Date.now() + 24*60*60*1000).toISOString().slice(0, 16)}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>

            {/* Rollout Strategy */}
            <div>
              <label className="block text-sm font-medium mb-2">Rollout Strategy *</label>
              <select 
                value={rolloutStrategy} 
                onChange={(e) => setRolloutStrategy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="gradual">Gradual Rollout (recommended)</option>
                <option value="immediate">Immediate Full Deployment</option>
                <option value="ab_test">A/B Test First</option>
                <option value="canary">Canary Deployment</option>
              </select>
            </div>

            {/* Traffic Percentage (only for gradual rollout) */}
            {rolloutStrategy === 'gradual' && (
              <div>
                <label className="block text-sm font-medium mb-2">Initial Traffic Percentage *</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={trafficPercentage}
                    onChange={(e) => setTrafficPercentage(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-medium w-16 text-center">{trafficPercentage}%</span>
                </div>
                {errors.trafficPercentage && <p className="text-red-500 text-sm mt-1">{errors.trafficPercentage}</p>}
              </div>
            )}

            {/* Success Criteria */}
            <div>
              <label className="block text-sm font-medium mb-3">Success Criteria *</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={successCriteria.revenueIncrease}
                    onChange={(e) => setSuccessCriteria({...successCriteria, revenueIncrease: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Revenue increase ≥ {recommendation.impact}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={successCriteria.customerSatisfaction}
                    onChange={(e) => setSuccessCriteria({...successCriteria, customerSatisfaction: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">No increase in customer complaints</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={successCriteria.modelAccuracy}
                    onChange={(e) => setSuccessCriteria({...successCriteria, modelAccuracy: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Model accuracy maintained above 85%</span>
                </label>
              </div>
              {errors.successCriteria && <p className="text-red-500 text-sm mt-1">{errors.successCriteria}</p>}
            </div>

            {/* Schedule Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Rollout Schedule Preview</h4>
              <div className="space-y-2">
                {rolloutStrategy === 'gradual' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Phase 1 (Week 1):</span>
                      <span>{trafficPercentage}% of {recommendation.region} traffic</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Phase 2 (Week 2):</span>
                      <span>Scale to 100% based on success criteria</span>
                    </div>
                  </>
                )}
                {rolloutStrategy === 'immediate' && (
                  <div className="flex justify-between text-sm">
                    <span>Immediate deployment:</span>
                    <span>100% of {recommendation.region} traffic</span>
                  </div>
                )}
                {rolloutStrategy === 'ab_test' && (
                  <div className="flex justify-between text-sm">
                    <span>A/B Test phase:</span>
                    <span>50/50 split for 1 week, then full rollout</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={onClose} 
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={isSubmitting}>
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Scheduling...' : 'Schedule Rollout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Tooltip = ({ 
    children, 
    content, 
    position = 'top' 
  }: { 
    children: React.ReactNode; 
    content: string; 
    position?: 'top' | 'bottom' | 'left' | 'right' 
  }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };
    
    const arrowClasses = {
      top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
      left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
      right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800'
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

  // Loading overlay component
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

  // Modal Components
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
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard 
                label="Current QPS" 
                value="1,847"
                trend="+12% vs avg"
                trendUp={true}
                icon={Zap}
              />
              <KpiCard 
                label="Latency (P95)" 
                value="23ms"
                trend="Within SLA"
                trendUp={true}
                icon={Clock}
              />
              <KpiCard 
                label="Error Rate" 
                value="0.03%"
                trend="-50% vs yesterday"
                trendUp={true}
                icon={CheckCircle}
              />
              <KpiCard 
                label="Model Health" 
                value={`${(selectedModel.accuracy * 100).toFixed(1)}%`}
                trend="Stable"
                trendUp={true}
                icon={Brain}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Performance Trends</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Accuracy (24h avg)</span>
                    <span className="font-medium text-green-600">{(selectedModel.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Requests processed</span>
                    <span className="font-medium">{selectedModel.requests_per_hour.toLocaleString()}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last deployment</span>
                    <span className="font-medium">{new Date(selectedModel.last_updated).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Regional Performance</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Metro Manila</span>
                    <span className="font-medium">94.2% accuracy</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bataan</span>
                    <span className="font-medium">91.8% accuracy</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pampanga</span>
                    <span className="font-medium">89.7% accuracy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
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
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowRecommendationDetails(false);
                  handleImplementRecommendation(selectedRecommendation);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Implement Now
              </button>
              <button 
                onClick={() => setShowRecommendationDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
            
            <button 
              onClick={() => setShowImplementationResult(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  };

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
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <span className="text-sm text-gray-700">{strategy}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Download Plan
              </button>
              <button 
                onClick={() => setShowExpansionPlanResult(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{kpi.value}</span>
                        <div className={`text-xs ${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-500' : 'text-gray-600'}`}>
                          {kpi.trend === 'up' ? '↗' : kpi.trend === 'down' ? '↘' : '→'} {kpi.trend}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Key Insights</h4>
                <div className="space-y-3">
                  {analyticsReportData.insights.map((insight: string, index: number) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Export Report
              </button>
              <button 
                onClick={() => setShowAnalyticsReport(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                      <span className="text-sm text-gray-700">{opportunity}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Potential Risks</h4>
                <div className="space-y-2">
                  {marketAnalysisData.risks.map((risk: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                      <span className="text-sm text-gray-700">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Recommended Timeline</h4>
              <p className="text-sm text-gray-700">{marketAnalysisData.timeline}</p>
            </div>
            
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Create Action Plan
              </button>
              <button 
                onClick={() => setShowMarketAnalysis(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading Nexus AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - ai-expansions style */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nexus AI</h1>
              <p className="text-gray-600">Intelligent ML infrastructure with business insights and technical monitoring</p>
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
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${pythonBridgeHealth?.python_service ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600">
                  {pythonBridgeHealth?.system_health?.overall_health || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Navigation Tabs - ai-expansions pattern */}
        <div className="flex items-center gap-1 overflow-x-auto mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Real-time metrics from nexus + business KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <KpiCard
                label="Events/sec"
                value={metrics.events_per_second.toString()}
                trend="12% vs last hour"
                trendUp={true}
                icon={Zap}
              />
              <KpiCard
                label="Features"
                value={metrics.features_computed.toLocaleString()}
                trend="8% vs yesterday"
                trendUp={true}
                icon={Database}
              />
              <KpiCard
                label="Models"
                value={metrics.models_serving.toString()}
                trend="3 active, 1 training"
                trendUp={true}
                icon={Brain}
              />
              <KpiCard
                label="Latency"
                value={`${metrics.inference_latency_ms}ms`}
                trend="5ms improvement"
                trendUp={true}
                icon={Gauge}
              />
              <KpiCard
                label="Accuracy"
                value={`${(metrics.prediction_accuracy * 100).toFixed(1)}%`}
                trend="Avg across models"
                trendUp={true}
                icon={Target}
              />
              <KpiCard
                label="Data Fresh"
                value={`${(metrics.data_freshness_score * 100).toFixed(0)}%`}
                trend="Avg feature age: 3.2min"
                trendUp={true}
                icon={Clock}
              />
            </div>

            {/* Combined business + technical overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regional AI Health */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Regional AI Health</h3>
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {regions.map((region) => (
                      <div key={region.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{region.name}</div>
                          <StatusBadge status={region.status} />
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{region.aiHealth}%</div>
                          <div className="text-xs text-gray-500">{region.activeModels} models</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Model Status */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Model Status</h3>
                    <Brain className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {models.map((model) => (
                      <div key={model.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(model.status)}
                          <div>
                            <div className="font-medium text-gray-900">{model.name}</div>
                            <div className="text-xs text-gray-500">{model.version}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{(model.accuracy * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">{model.requests_per_hour.toLocaleString()}/hr</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-6">
            {/* Technical model operations from nexus */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {models.map((model) => (
                <div key={model.id} className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                        <p className="text-sm text-gray-600">{model.version}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(model.status)}
                        <StatusBadge status={model.status} />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Accuracy</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${model.accuracy * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold">{(model.accuracy * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Requests/hour</p>
                        <p className="text-lg font-bold text-blue-600">{model.requests_per_hour.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Last updated: {new Date(model.last_updated).toLocaleTimeString()}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedModel(model);
                            setShowModelMonitor(true);
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          Monitor
                        </button>
                        <button 
                          onClick={() => handleTweakModel(model)}
                          className="text-green-600 hover:underline"
                        >
                          Tweak
                        </button>
                        <button 
                          onClick={() => handleDisableModel(model)}
                          className="text-red-600 hover:underline"
                        >
                          Disable
                        </button>
                        <button 
                          onClick={() => handleRollbackModel(model)}
                          className="text-orange-600 hover:underline"
                        >
                          Rollback
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Groups */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featureGroups.map((group) => (
                <div key={group.name} className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {group.name.replace('_', ' ')}
                      </h3>
                      {group.issues > 0 && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                          {group.issues} issue{group.issues !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Features</p>
                        <p className="text-lg font-bold">{group.feature_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Entities</p>
                        <p className="text-lg font-bold">{group.entities_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quality</p>
                        <p className="text-lg font-bold text-green-600">{(group.quality_score * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Freshness</span>
                        <span className="text-sm font-medium">{(group.freshness_score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${group.freshness_score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Operational Workflow Guide */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">How to Use Nexus AI</h3>
                  <p className="text-sm text-gray-600">Complete operational workflow guide</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🔧 Model Operations</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Monitor:</span> Check model health, accuracy, and performance metrics</div>
                      <div><span className="font-medium">Tweak:</span> Adjust thresholds, sensitivity, and regional weights</div>
                      <div><span className="font-medium">Disable:</span> Emergency stop for breaking models (affects live traffic)</div>
                      <div><span className="font-medium">Rollback:</span> Return to previous stable version instantly</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🌏 Region Management</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Auto-Discovery:</span> Regions are detected from traffic patterns</div>
                      <div><span className="font-medium">Manual Addition:</span> Use "Add Region" for new market expansion</div>
                      <div><span className="font-medium">AI Deployment:</span> Models auto-deploy based on region tier</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🚀 Recommendation Rollouts</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Implement:</span> Deploy recommendation immediately</div>
                      <div><span className="font-medium">Schedule:</span> Plan staged rollout over 2+ weeks</div>
                      <div><span className="font-medium">A/B Test:</span> Deploy to subset for validation</div>
                      <div><span className="font-medium">Auto-Rollback:</span> Automatic revert if metrics fail</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">⚡ Emergency Procedures</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Model Breaking:</span> Use "Disable" button → immediate stop</div>
                      <div><span className="font-medium">Performance Drop:</span> Check alerts → rollback if needed</div>
                      <div><span className="font-medium">Regional Issues:</span> Disable region-specific models only</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Best Practices</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Always A/B test recommendation changes before full rollout</li>
                  <li>• Monitor model accuracy for 24h after any tweaks</li>
                  <li>• Use gradual rollouts for high-impact recommendations</li>
                  <li>• Keep previous model versions for quick rollbacks</li>
                  <li>• New regions auto-inherit Tier 2 model configurations</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search recommendations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Regions</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.name}>{region.name}</option>
                    ))}
                  </select>
                  <select
                    value={impactFilter}
                    onChange={(e) => setImpactFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Impact</option>
                    <option value="High">High Impact</option>
                    <option value="Medium">Medium Impact</option>
                    <option value="Low">Low Impact</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filtered Recommendations */}
            <div className="grid grid-cols-1 gap-4">
              {getFilteredRecommendations().map((rec) => (
                <div key={rec.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                        <StatusBadge status={rec.priority} />
                        <span className="text-sm text-gray-500">{rec.region}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>Confidence: {(rec.confidence * 100).toFixed(1)}%</span>
                        <span>Impact: {rec.impact}</span>
                        <span>Timeline: {rec.timeframe}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleImplementRecommendation(rec)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        disabled={isLoading}
                      >
                        Implement
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedRecommendation(rec);
                          setShowRecommendationDetails(true);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      >
                        Details
                      </button>
                      <button 
                        onClick={() => handleScheduleRollout(rec)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                      >
                        Schedule
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'regional-ai' && (
          <div className="space-y-6">
            {/* Region Management Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Region Management</h3>
                  <p className="text-sm text-gray-600">Add new regions or manage existing AI deployments</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleAddRegion}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Add Region
                  </button>
                  <button 
                    onClick={handleManageRegions}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Manage All
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {regions.map((region) => (
                <div key={region.id} className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{region.name}</h3>
                        <StatusBadge status={region.status} />
                      </div>
                      <MapPin className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <KpiCard
                        label="AI Health"
                        value={`${region.aiHealth}%`}
                        trendUp={true}
                        icon={Brain}
                      />
                      <KpiCard
                        label="Models"
                        value={region.activeModels.toString()}
                        trend="Active"
                        trendUp={true}
                        icon={Database}
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Population</span>
                        <span className="font-medium">{region.population.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Revenue</span>
                        <span className="font-medium">₱{region.monthlyRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Growth Rate</span>
                        <span className="font-medium text-green-600">+{(region.growthRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expansion Readiness</span>
                        <span className="font-medium">{(region.expansionReadiness * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'expansions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Market Expansion Opportunities</h3>
                  <p className="text-sm text-gray-600">AI-powered analysis of expansion potential</p>
                </div>
                <button 
                  onClick={handleGenerateExpansionPlan}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Globe className="w-4 h-4" />
                  Generate Plan
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Expansion Readiness Score</h4>
                  <div className="space-y-3">
                    {regions.map((region) => (
                      <div key={region.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-gray-900">{region.name}</div>
                          <StatusBadge status={region.tier} />
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {(region.expansionReadiness * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500">Ready to expand</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Growth Potential</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">High Growth Markets</span>
                      </div>
                      <p className="text-sm text-green-800">Bataan (+18%), Pampanga (+24%) showing strong expansion signals</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Investment Priority</span>
                      </div>
                      <p className="text-sm text-blue-800">Focus on Tier 2 markets with AI infrastructure readiness &gt;75%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <KpiCard
                    label="Total Predictions Today"
                    value="156,847"
                    trend="+23% vs yesterday"
                    trendUp={true}
                    icon={Brain}
                  />
                  <KpiCard
                    label="Python Bridge Health"
                    value={pythonBridgeHealth?.system_health?.overall_health || 'Unknown'}
                    trend="Dual processing active"
                    trendUp={true}
                    icon={Activity}
                  />
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Business Impact</h3>
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-900">₱26.5M</div>
                      <div className="text-sm text-green-600">Monthly Revenue</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">14.7%</div>
                      <div className="text-sm text-blue-600">Avg Growth Rate</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    AI-powered optimizations contributing to consistent revenue growth across all regions.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Active Alerts & Monitoring</h3>
                <p className="text-sm text-gray-600">Real-time system health and notifications</p>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                      <p>No active alerts</p>
                      <p className="text-sm">All systems are operating normally</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)} mt-1`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{alert.title}</p>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                {alert.type.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                          {alert.model_affected && (
                            <p className="text-xs text-blue-600 mt-1">
                              Affected model: {alert.model_affected}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Generate Analytics Report</h3>
                <button 
                  onClick={handleGenerateAnalyticsReport}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2"
                  disabled={isLoading}
                >
                  <BarChart3 className="w-4 h-4" />
                  Generate Report
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Create comprehensive analytics report including AI performance metrics, 
                regional insights, and business impact analysis.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Market Analysis</h3>
                <button 
                  onClick={handleGenerateMarketAnalysis}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2"
                  disabled={isLoading}
                >
                  <TrendingUp className="w-4 h-4" />
                  Analyze Market
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Deep market analysis with competitor insights, growth opportunities, 
                and strategic recommendations for business expansion.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Placeholder Modal Components - These need to be implemented */}
      {showModelMonitor && selectedModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Model Monitor: {selectedModel.name}</h2>
              <button onClick={() => setShowModelMonitor(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Performance Metrics */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Accuracy</span>
                    <span className="font-semibold text-green-600">{(selectedModel.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Requests/Hour</span>
                    <span className="font-semibold">{selectedModel.requests_per_hour?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Status</span>
                    <div className="flex items-center gap-2">
                      {selectedModel.status === 'healthy' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="capitalize font-medium">{selectedModel.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 p-2 bg-green-50 rounded">
                    ✓ Model serving normally - 2 minutes ago
                  </div>
                  <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
                    ℹ Performance check completed - 15 minutes ago
                  </div>
                  <div className="text-xs text-gray-500 p-2 bg-yellow-50 rounded">
                    ⚠ High request volume detected - 1 hour ago
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                onClick={() => {
                  setShowModelMonitor(false);
                  handleTweakModel(selectedModel);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Tweak Parameters
              </button>
              <button 
                onClick={() => {
                  setShowModelMonitor(false);
                  handleRollbackModel(selectedModel);
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Rollback Version
              </button>
              <button 
                onClick={() => setShowModelMonitor(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecommendationDetails && selectedRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recommendation Details</h2>
              <button onClick={() => setShowRecommendationDetails(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <h3>{selectedRecommendation.title}</h3>
              <p>Region: {selectedRecommendation.region}</p>
              <p>Impact: {selectedRecommendation.impact}</p>
              <p>Confidence: {(selectedRecommendation.confidence * 100).toFixed(1)}%</p>
              <button 
                onClick={() => {
                  setShowRecommendationDetails(false);
                  handleImplementRecommendation(selectedRecommendation);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Implement Recommendation
              </button>
            </div>
          </div>
        </div>
      )}

      {showImplementationResult && implementationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Implementation Result</h2>
              <button onClick={() => setShowImplementationResult(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Implementation Successful</h3>
              <p className="text-gray-600">{implementationResult?.message || 'Recommendation has been implemented successfully.'}</p>
            </div>
          </div>
        </div>
      )}

      {showExpansionPlanResult && expansionPlanResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Expansion Plan</h2>
              <button onClick={() => setShowExpansionPlanResult(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p>Expansion plan generated successfully - detailed analysis and timeline to be shown here.</p>
          </div>
        </div>
      )}

      {showAnalyticsReport && analyticsReportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Analytics Report</h2>
              <button onClick={() => setShowAnalyticsReport(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p>Analytics report generated - comprehensive metrics and insights to be displayed here.</p>
          </div>
        </div>
      )}

      {showMarketAnalysis && marketAnalysisData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Market Analysis</h2>
              <button onClick={() => setShowMarketAnalysis(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p>Market analysis complete - competitive insights and growth opportunities to be shown here.</p>
          </div>
        </div>
      )}

      {/* Operational Modals */}
      <ModelTweakModal 
        isOpen={showModelTweakModal}
        onClose={() => setShowModelTweakModal(false)}
        model={selectedModel}
      />

      <ModelRollbackModal 
        isOpen={showModelRollbackModal}
        onClose={() => setShowModelRollbackModal(false)}
        model={selectedModel}
      />

      <AddRegionModal 
        isOpen={showAddRegionModal}
        onClose={() => setShowAddRegionModal(false)}
      />

      <RolloutSchedulerModal 
        isOpen={showRolloutSchedulerModal}
        onClose={() => setShowRolloutSchedulerModal(false)}
        recommendation={selectedRecommendation}
      />

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isLoading} action={loadingAction} />
    </div>
  );
};

export default NexusAIPage;