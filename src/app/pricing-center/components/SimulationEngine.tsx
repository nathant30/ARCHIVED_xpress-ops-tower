'use client';

import { useState } from 'react';
import { Play, Settings, BarChart3, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SimulationResult {
  simulation_id: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  scenario_name: string;
  results?: {
    revenue_impact: {
      expected_change_pct: number;
      confidence_interval: [number, number];
      risk_level: 'low' | 'medium' | 'high';
    };
    market_impact: {
      trip_volume_change_pct: number;
      market_share_impact: number;
    };
    recommendations: string[];
  };
  estimated_completion?: string;
}

export function SimulationEngine() {
  const [activeTab, setActiveTab] = useState<'create' | 'results'>('create');
  const [simulations, setSimulations] = useState<SimulationResult[]>([
    {
      simulation_id: 'sim_001',
      status: 'completed',
      progress: 100,
      scenario_name: 'Base Fare Increase 15%',
      results: {
        revenue_impact: {
          expected_change_pct: 12.3,
          confidence_interval: [8.7, 15.9],
          risk_level: 'medium'
        },
        market_impact: {
          trip_volume_change_pct: -8.2,
          market_share_impact: -2.1
        },
        recommendations: [
          'Implement gradual rollout over 2 weeks',
          'Monitor competitor response closely',
          'Consider surge cap adjustments during peak hours'
        ]
      }
    },
    {
      simulation_id: 'sim_002',
      status: 'running',
      progress: 67,
      scenario_name: 'Dynamic Surge Cap Test',
      estimated_completion: '2 minutes'
    }
  ]);

  const [formData, setFormData] = useState({
    scenario_name: '',
    simulation_type: 'pricing_change',
    base_fare_change_pct: 0,
    surge_cap_change: 0,
    time_horizon_days: 30,
    iterations: 10000
  });

  const handleStartSimulation = async () => {
    if (!formData.scenario_name) return;

    const newSimulation: SimulationResult = {
      simulation_id: `sim_${Date.now()}`,
      status: 'running',
      progress: 0,
      scenario_name: formData.scenario_name,
      estimated_completion: '5 minutes'
    };

    setSimulations(prev => [newSimulation, ...prev]);
    setActiveTab('results');

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setSimulations(prev => prev.map(sim => {
        if (sim.simulation_id === newSimulation.simulation_id && sim.status === 'running') {
          const newProgress = Math.min(sim.progress + Math.random() * 15, 100);
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return {
              ...sim,
              status: 'completed' as const,
              progress: 100,
              results: {
                revenue_impact: {
                  expected_change_pct: Math.random() * 20 - 5,
                  confidence_interval: [Math.random() * 10, Math.random() * 15 + 10] as [number, number],
                  risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
                },
                market_impact: {
                  trip_volume_change_pct: Math.random() * 20 - 10,
                  market_share_impact: Math.random() * 5 - 2.5
                },
                recommendations: [
                  'Monitor market response carefully',
                  'Consider phased implementation',
                  'Adjust based on competitor behavior'
                ]
              }
            };
          }
          return { ...sim, progress: newProgress };
        }
        return sim;
      }));
    }, 1000);

    // Reset form
    setFormData({
      scenario_name: '',
      simulation_type: 'pricing_change',
      base_fare_change_pct: 0,
      surge_cap_change: 0,
      time_horizon_days: 30,
      iterations: 10000
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Play className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Monte Carlo Simulation Engine</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Pricing impact modeling and risk assessment</p>
        
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Create Simulation
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'results'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Simulation Results ({simulations.length})
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'create' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Scenario Name
              </label>
              <input
                type="text"
                value={formData.scenario_name}
                onChange={(e) => setFormData(prev => ({ ...prev, scenario_name: e.target.value }))}
                placeholder="e.g., Base Fare Increase 10%"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 dark:text-white dark:border-slate-600 dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Base Fare Change (%)
                </label>
                <input
                  type="number"
                  value={formData.base_fare_change_pct}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_fare_change_pct: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 dark:text-white dark:border-slate-600 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Surge Cap Change
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.surge_cap_change}
                  onChange={(e) => setFormData(prev => ({ ...prev, surge_cap_change: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 dark:text-white dark:border-slate-600 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Time Horizon (Days)
                </label>
                <input
                  type="number"
                  value={formData.time_horizon_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, time_horizon_days: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 dark:text-white dark:border-slate-600 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Iterations
                </label>
                <select
                  value={formData.iterations}
                  onChange={(e) => setFormData(prev => ({ ...prev, iterations: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 dark:text-white dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value={1000}>1,000 (Fast)</option>
                  <option value={10000}>10,000 (Standard)</option>
                  <option value={100000}>100,000 (Precise)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStartSimulation}
              disabled={!formData.scenario_name}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
            >
              <Play className="h-4 w-4" />
              Start Simulation
            </button>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-4">
            {simulations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No simulations yet. Create your first simulation to see results.
              </div>
            ) : (
              simulations.map((sim) => (
                <div key={sim.simulation_id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {sim.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {sim.status === 'running' && <Clock className="h-5 w-5 text-blue-500" />}
                      {sim.status === 'failed' && <AlertCircle className="h-5 w-5 text-red-500" />}
                      <h4 className="font-medium text-slate-900 dark:text-white">{sim.scenario_name}</h4>
                    </div>
                    <span className="text-sm text-slate-500">{sim.simulation_id}</span>
                  </div>

                  {sim.status === 'running' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                        <span>Progress: {Math.round(sim.progress)}%</span>
                        <span>ETA: {sim.estimated_completion}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${sim.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {sim.status === 'completed' && sim.results && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded p-3">
                        <h5 className="font-medium text-slate-900 dark:text-white mb-2">Revenue Impact</h5>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Expected Change:</span>
                            <span className={`font-medium ${
                              sim.results.revenue_impact.expected_change_pct > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {sim.results.revenue_impact.expected_change_pct > 0 ? '+' : ''}
                              {sim.results.revenue_impact.expected_change_pct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">95% CI:</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              [{sim.results.revenue_impact.confidence_interval[0].toFixed(1)}%, {sim.results.revenue_impact.confidence_interval[1].toFixed(1)}%]
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Risk Level:</span>
                            <span className={`font-medium ${
                              sim.results.revenue_impact.risk_level === 'low' ? 'text-green-600' :
                              sim.results.revenue_impact.risk_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {sim.results.revenue_impact.risk_level.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800 rounded p-3">
                        <h5 className="font-medium text-slate-900 dark:text-white mb-2">Market Impact</h5>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Trip Volume:</span>
                            <span className={`font-medium ${
                              sim.results.market_impact.trip_volume_change_pct > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {sim.results.market_impact.trip_volume_change_pct > 0 ? '+' : ''}
                              {sim.results.market_impact.trip_volume_change_pct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Market Share:</span>
                            <span className={`font-medium ${
                              sim.results.market_impact.market_share_impact > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {sim.results.market_impact.market_share_impact > 0 ? '+' : ''}
                              {sim.results.market_impact.market_share_impact.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                        <h5 className="font-medium text-slate-900 dark:text-white mb-2">Recommendations</h5>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                          {sim.results.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-600 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}