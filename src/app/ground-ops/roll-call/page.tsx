'use client';

/**
 * Ground Ops - Roll Call Page
 * Tablet-optimized driver check-in interface
 * Built by Agent 10 - Critical Frontend UI Developer
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  MapPin,
  Car,
  CheckCircle,
  AlertCircle,
  User,
  Clock,
  FileSignature,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGroundOpsStore, RollCallData } from '@/stores/groundOpsStore';
import { useRouter } from 'next/navigation';

const RollCallPage = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [step, setStep] = useState<'search' | 'verify' | 'photo' | 'vehicle' | 'signature' | 'complete'>('search');
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [geofenceValid, setGeofenceValid] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [signature, setSignature] = useState('');

  const { rollCallData, addRollCall } = useGroundOpsStore();

  useEffect(() => {
    setIsClient(true);
    // Simulate geofence check
    setGeofenceValid(true);
  }, []);

  // Mock driver search
  const handleSearchDriver = (id: string) => {
    if (id.length >= 4) {
      setDriverId(id);
      setStep('verify');
    }
  };

  // Handle check-in completion
  const handleCompleteCheckIn = () => {
    const rollCall: RollCallData = {
      driverId,
      driverName: `Driver ${driverId}`,
      vehicleId,
      depotId: 'depot-1',
      checkInTime: new Date().toISOString(),
      geofenceValidated: geofenceValid,
      photoUrl: photoTaken ? 'photo-url.jpg' : undefined,
      signature: signature || undefined,
      acknowledged: true,
    };

    addRollCall(rollCall);
    setStep('complete');

    // Reset after 3 seconds
    setTimeout(() => {
      setStep('search');
      setDriverId('');
      setVehicleId('');
      setPhotoTaken(false);
      setSignature('');
    }, 3000);
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Tablet landscape layout (1024x768 optimized)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => router.back()}
            className="text-lg"
          >
            <ArrowLeft className="h-6 w-6 mr-2" />
            Back
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Driver Roll Call</h1>
            <p className="text-gray-600 mt-2 text-lg">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="w-32" /> {/* Spacer for centering */}
        </div>

        {/* Geofence Status */}
        <div className={`mb-8 p-4 rounded-xl ${geofenceValid ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
          <div className="flex items-center justify-center gap-3">
            <MapPin className={`h-6 w-6 ${geofenceValid ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`text-lg font-semibold ${geofenceValid ? 'text-green-900' : 'text-red-900'}`}>
              {geofenceValid ? 'Location Verified - At Depot' : 'Location Error - Not at Depot'}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <Card className="shadow-2xl">
          <CardContent className="p-12">
            {/* Step 1: Search Driver */}
            {step === 'search' && (
              <div className="text-center space-y-8">
                <div>
                  <User className="h-24 w-24 mx-auto mb-6 text-blue-600" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Enter Your Driver ID</h2>
                  <p className="text-gray-600 text-lg">Tap to start check-in</p>
                </div>

                <div className="max-w-md mx-auto">
                  <input
                    type="text"
                    placeholder="D-####"
                    value={driverId}
                    onChange={(e) => handleSearchDriver(e.target.value)}
                    className="w-full text-3xl text-center p-6 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>

                {/* Recent Check-ins */}
                {rollCallData.length > 0 && (
                  <div className="mt-12">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Check-ins Today</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {rollCallData.slice(0, 6).map((data, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="font-mono font-semibold text-gray-900">{data.driverId}</p>
                          <p className="text-sm text-gray-600">{new Date(data.checkInTime).toLocaleTimeString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Verify Driver */}
            {step === 'verify' && (
              <div className="text-center space-y-8">
                <div>
                  <CheckCircle className="h-24 w-24 mx-auto mb-6 text-green-600" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Driver Found</h2>
                  <div className="bg-blue-50 rounded-xl p-6 max-w-md mx-auto">
                    <p className="text-gray-600 text-lg mb-2">Driver ID</p>
                    <p className="text-4xl font-mono font-bold text-gray-900">{driverId}</p>
                    <p className="text-xl text-gray-700 mt-4">Driver {driverId}</p>
                  </div>
                </div>

                <div className="flex gap-6 justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep('search')}
                    className="text-xl px-12 py-8"
                  >
                    Not Me
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => setStep('photo')}
                    className="text-xl px-12 py-8 bg-blue-600 hover:bg-blue-700"
                  >
                    Confirm - Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Take Photo */}
            {step === 'photo' && (
              <div className="text-center space-y-8">
                <div>
                  <Camera className="h-24 w-24 mx-auto mb-6 text-blue-600" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Take Photo</h2>
                  <p className="text-gray-600 text-lg">Look at the camera and smile</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="bg-gray-200 rounded-xl aspect-square flex items-center justify-center">
                    {photoTaken ? (
                      <div className="text-center">
                        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
                        <p className="text-xl font-semibold text-gray-900">Photo Captured</p>
                      </div>
                    ) : (
                      <Camera className="h-32 w-32 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="flex gap-6 justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep('verify')}
                    className="text-xl px-8 py-8"
                  >
                    Back
                  </Button>
                  {!photoTaken ? (
                    <Button
                      size="lg"
                      onClick={() => setPhotoTaken(true)}
                      className="text-xl px-12 py-8 bg-blue-600 hover:bg-blue-700"
                    >
                      <Camera className="h-6 w-6 mr-3" />
                      Capture Photo
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => setStep('vehicle')}
                      className="text-xl px-12 py-8 bg-green-600 hover:bg-green-700"
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Select Vehicle */}
            {step === 'vehicle' && (
              <div className="text-center space-y-8">
                <div>
                  <Car className="h-24 w-24 mx-auto mb-6 text-blue-600" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Select Your Vehicle</h2>
                  <p className="text-gray-600 text-lg">Choose the vehicle you will be driving today</p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {['V-001', 'V-002', 'V-003', 'V-004', 'V-005', 'V-006'].map((vid) => (
                    <button
                      key={vid}
                      onClick={() => setVehicleId(vid)}
                      className={`p-8 rounded-xl border-2 transition-all ${
                        vehicleId === vid
                          ? 'border-blue-600 bg-blue-50 shadow-lg'
                          : 'border-gray-300 bg-white hover:border-blue-400'
                      }`}
                    >
                      <Car className={`h-12 w-12 mx-auto mb-3 ${vehicleId === vid ? 'text-blue-600' : 'text-gray-400'}`} />
                      <p className={`text-2xl font-mono font-bold ${vehicleId === vid ? 'text-blue-900' : 'text-gray-900'}`}>
                        {vid}
                      </p>
                      <Badge className="mt-2">Available</Badge>
                    </button>
                  ))}
                </div>

                <div className="flex gap-6 justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep('photo')}
                    className="text-xl px-8 py-8"
                  >
                    Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => setStep('signature')}
                    disabled={!vehicleId}
                    className="text-xl px-12 py-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Signature */}
            {step === 'signature' && (
              <div className="text-center space-y-8">
                <div>
                  <FileSignature className="h-24 w-24 mx-auto mb-6 text-blue-600" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Sign Acknowledgment</h2>
                  <p className="text-gray-600 text-lg">I acknowledge receipt of vehicle {vehicleId}</p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-white">
                    <textarea
                      placeholder="Type your name to sign..."
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      className="w-full text-3xl text-center p-4 border-0 focus:outline-none resize-none"
                      rows={2}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-6 justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep('vehicle')}
                    className="text-xl px-8 py-8"
                  >
                    Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleCompleteCheckIn}
                    disabled={!signature}
                    className="text-xl px-12 py-8 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-6 w-6 mr-3" />
                    Complete Check-In
                  </Button>
                </div>
              </div>
            )}

            {/* Step 6: Complete */}
            {step === 'complete' && (
              <div className="text-center space-y-8 py-12">
                <div>
                  <CheckCircle className="h-32 w-32 mx-auto mb-6 text-green-600 animate-pulse" />
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">Check-In Complete!</h2>
                  <p className="text-gray-600 text-xl">Have a safe shift, {driverId}</p>
                </div>

                <div className="bg-green-50 rounded-xl p-8 max-w-md mx-auto">
                  <div className="space-y-4 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Driver ID:</span>
                      <span className="font-mono font-bold">{driverId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle:</span>
                      <span className="font-mono font-bold">{vehicleId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-In Time:</span>
                      <span className="font-bold">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-bold text-green-600">✓ Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Stats */}
        {step === 'search' && (
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <Card>
              <CardContent className="pt-6">
                <p className="text-4xl font-bold text-gray-900">{rollCallData.length}</p>
                <p className="text-gray-600 mt-2">Checked In Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-4xl font-bold text-gray-900">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-gray-600 mt-2">Current Time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-4xl font-bold text-green-600">100%</p>
                <p className="text-gray-600 mt-2">Geofence Valid</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RollCallPage;
