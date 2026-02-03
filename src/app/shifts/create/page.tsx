'use client';

/**
 * Create Shift Page
 * Shift templates (2×12, 3×8, Custom) with clock-in rules
 * Built by Agent 10 - Critical Frontend UI Developer
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  Users,
  MapPin,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useShiftsStore, Shift, ShiftTemplate } from '@/stores/shiftsStore';
import { useRouter } from 'next/navigation';

const SHIFT_TEMPLATES = {
  '2x12': {
    name: '2×12 (Two 12-hour Shifts)',
    description: 'Day shift (6am-6pm) and night shift (6pm-6am)',
    shifts: [
      { startTime: '06:00', endTime: '18:00', label: 'Day Shift' },
      { startTime: '18:00', endTime: '06:00', label: 'Night Shift' },
    ],
  },
  '3x8': {
    name: '3×8 (Three 8-hour Shifts)',
    description: 'Morning (6am-2pm), afternoon (2pm-10pm), and night (10pm-6am)',
    shifts: [
      { startTime: '06:00', endTime: '14:00', label: 'Morning Shift' },
      { startTime: '14:00', endTime: '22:00', label: 'Afternoon Shift' },
      { startTime: '22:00', endTime: '06:00', label: 'Night Shift' },
    ],
  },
  custom: {
    name: 'Custom',
    description: 'Define your own shift times',
    shifts: [
      { startTime: '00:00', endTime: '00:00', label: 'Custom Shift' },
    ],
  },
};

const CreateShiftPage = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [step, setStep] = useState<'template' | 'details' | 'rules' | 'review'>('template');

  // Form state
  const [template, setTemplate] = useState<ShiftTemplate>('2x12');
  const [selectedShiftIndex, setSelectedShiftIndex] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [depotId, setDepotId] = useState('depot-1');
  const [supervisorId, setSupervisorId] = useState('SUP-001');
  const [minDrivers, setMinDrivers] = useState(10);
  const [maxDrivers, setMaxDrivers] = useState(20);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('18:00');
  const [earlyClockInMinutes, setEarlyClockInMinutes] = useState(15);
  const [lateClockInMinutes, setLateClockInMinutes] = useState(5);
  const [requireGeofence, setRequireGeofence] = useState(true);
  const [recurring, setRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);

  const { addShift } = useShiftsStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update times when template changes
  useEffect(() => {
    if (template !== 'custom') {
      const templateShift = SHIFT_TEMPLATES[template].shifts[selectedShiftIndex];
      if (templateShift) {
        setStartTime(templateShift.startTime);
        setEndTime(templateShift.endTime);
      }
    }
  }, [template, selectedShiftIndex]);

  const handleCreateShift = () => {
    const newShift: Shift = {
      id: `SHF-${Date.now()}`,
      depotId,
      depotName: depotId === 'depot-1' ? 'Makati Central Depot' : 'BGC Operations Hub',
      date,
      startTime,
      endTime,
      supervisorId,
      supervisorName: supervisorId === 'SUP-001' ? 'Maria Santos' : 'John Cruz',
      template,
      minDrivers,
      maxDrivers,
      assignedDrivers: [],
      clockEvents: [],
      rollCallComplete: false,
      status: 'scheduled',
      earlyClockInMinutes,
      lateClockInMinutes,
      requireGeofence,
    };

    addShift(newShift);
    router.push('/shifts');
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Shift</h1>
          <p className="text-gray-600 mt-1">Schedule a shift with driver assignments</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {['template', 'details', 'rules', 'review'].map((s, idx) => (
          <React.Fragment key={s}>
            <div
              className={`flex items-center gap-2 ${
                step === s ? 'text-blue-600' : steps.indexOf(step) > idx ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                  step === s
                    ? 'border-blue-600 bg-blue-50'
                    : steps.indexOf(step) > idx
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                {steps.indexOf(step) > idx ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{idx + 1}</span>
                )}
              </div>
              <span className="text-sm font-medium capitalize">{s}</span>
            </div>
            {idx < 3 && <div className="h-0.5 w-12 bg-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Template Selection */}
          {step === 'template' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Shift Template</h2>
                <p className="text-gray-600">Choose a predefined template or create custom shifts</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(SHIFT_TEMPLATES).map(([key, tmpl]) => (
                  <div
                    key={key}
                    onClick={() => setTemplate(key as ShiftTemplate)}
                    className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                      template === key
                        ? 'border-blue-600 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{tmpl.name}</h3>
                      {template === key && <CheckCircle className="h-6 w-6 text-blue-600" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{tmpl.description}</p>

                    {key !== 'custom' && (
                      <div className="space-y-2">
                        {tmpl.shifts.map((shift, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                            <span className="font-medium">{shift.label}</span>
                            <span className="text-gray-600">{shift.startTime} - {shift.endTime}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {template !== 'custom' && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Which shift do you want to create?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {SHIFT_TEMPLATES[template].shifts.map((shift, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedShiftIndex(idx)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedShiftIndex === idx
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{shift.label}</span>
                          {selectedShiftIndex === idx && <CheckCircle className="h-5 w-5 text-blue-600" />}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{shift.startTime} - {shift.endTime}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setStep('details')}>
                  Next: Shift Details
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Shift Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Shift Details</h2>
                <p className="text-gray-600">Configure date, depot, and driver slots</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depot <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={depotId}
                    onChange={(e) => setDepotId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="depot-1">Makati Central Depot</option>
                    <option value="depot-2">BGC Operations Hub</option>
                    <option value="depot-3">Quezon City Depot</option>
                  </select>
                </div>

                {template === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SUP-001">Maria Santos</option>
                    <option value="SUP-002">John Cruz</option>
                    <option value="SUP-003">Ana Reyes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Drivers <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={minDrivers}
                    onChange={(e) => setMinDrivers(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Drivers <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxDrivers}
                    onChange={(e) => setMaxDrivers(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('template')}>
                  Back
                </Button>
                <Button onClick={() => setStep('rules')}>
                  Next: Clock-In Rules
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Clock-In Rules */}
          {step === 'rules' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Clock-In Rules</h2>
                <p className="text-gray-600">Configure early/late clock-in windows and geofence validation</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Early Clock-In Window (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={earlyClockInMinutes}
                      onChange={(e) => setEarlyClockInMinutes(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Drivers can clock in {earlyClockInMinutes} minutes before shift starts
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Late Clock-In Penalty (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={lateClockInMinutes}
                      onChange={(e) => setLateClockInMinutes(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Flagged as late if clock in &gt; {lateClockInMinutes} minutes after shift starts
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireGeofence}
                      onChange={(e) => setRequireGeofence(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Require Geofence Validation</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Drivers must be physically at the depot to clock in. Location will be verified using GPS.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('details')}>
                  Back
                </Button>
                <Button onClick={() => setStep('review')}>
                  Next: Review
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Shift</h2>
                <p className="text-gray-600">Verify all details before creating the shift</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Shift Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Template:</span>
                      <Badge>{template.toUpperCase()}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold">{new Date(date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-semibold">{startTime} - {endTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Depot:</span>
                      <span className="font-semibold">
                        {depotId === 'depot-1' ? 'Makati Central' : 'BGC Operations'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Supervisor:</span>
                      <span className="font-semibold">
                        {supervisorId === 'SUP-001' ? 'Maria Santos' : 'John Cruz'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Driver Slots:</span>
                      <span className="font-semibold">{minDrivers} - {maxDrivers}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Clock-In Rules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Early Window:</span>
                      <span className="font-semibold">{earlyClockInMinutes} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Late Penalty:</span>
                      <span className="font-semibold">{lateClockInMinutes} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Geofence:</span>
                      {requireGeofence ? (
                        <Badge variant="default">Required</Badge>
                      ) : (
                        <Badge variant="secondary">Optional</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('rules')}>
                  Back
                </Button>
                <Button onClick={handleCreateShift} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Shift
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const steps = ['template', 'details', 'rules', 'review'];

export default CreateShiftPage;
