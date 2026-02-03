'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Save, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddVehicle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: '',
    vin: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'Car',
    color: '',
    depotId: '',
    purchaseDate: '',
    purchasePrice: '',
    insuranceProvider: '',
    insurancePolicy: '',
    insuranceExpiry: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = 'Plate number is required';
    }
    if (!formData.vin.trim()) {
      newErrors.vin = 'VIN is required';
    } else if (formData.vin.length !== 17) {
      newErrors.vin = 'VIN must be exactly 17 characters';
    }
    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    if (!formData.depotId) {
      newErrors.depotId = 'Depot assignment is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call to save vehicle
      console.log('Saving vehicle:', formData);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push('/fleet/vehicles');
    } catch (error) {
      console.error('Failed to save vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Add New Vehicle</h1>
          <p className="text-neutral-600 mt-1">
            Register a new vehicle to your fleet
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/fleet/vehicles')}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Vehicles
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader className="border-b border-neutral-200">
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plate Number */}
                <div>
                  <label htmlFor="plateNumber" className="block text-sm font-medium text-neutral-700 mb-2">
                    Plate Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="plateNumber"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.plateNumber ? 'border-red-500' : 'border-neutral-300'
                    }`}
                    placeholder="e.g., ABC-1234"
                  />
                  {errors.plateNumber && (
                    <p className="text-red-600 text-sm mt-1">{errors.plateNumber}</p>
                  )}
                </div>

                {/* VIN */}
                <div>
                  <label htmlFor="vin" className="block text-sm font-medium text-neutral-700 mb-2">
                    VIN (Vehicle Identification Number) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="vin"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    maxLength={17}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.vin ? 'border-red-500' : 'border-neutral-300'
                    }`}
                    placeholder="17-character VIN"
                  />
                  {errors.vin && (
                    <p className="text-red-600 text-sm mt-1">{errors.vin}</p>
                  )}
                </div>

                {/* Make */}
                <div>
                  <label htmlFor="make" className="block text-sm font-medium text-neutral-700 mb-2">
                    Make <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="make"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.make ? 'border-red-500' : 'border-neutral-300'
                    }`}
                    placeholder="e.g., Honda, Toyota"
                  />
                  {errors.make && (
                    <p className="text-red-600 text-sm mt-1">{errors.make}</p>
                  )}
                </div>

                {/* Model */}
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-neutral-700 mb-2">
                    Model <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.model ? 'border-red-500' : 'border-neutral-300'
                    }`}
                    placeholder="e.g., Beat, Vios"
                  />
                  {errors.model && (
                    <p className="text-red-600 text-sm mt-1">{errors.model}</p>
                  )}
                </div>

                {/* Year */}
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-neutral-700 mb-2">
                    Year <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    min="2000"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-neutral-700 mb-2">
                    Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Taxi">Taxi</option>
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-neutral-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Black, White"
                  />
                </div>

                {/* Depot */}
                <div>
                  <label htmlFor="depotId" className="block text-sm font-medium text-neutral-700 mb-2">
                    Depot Assignment <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="depotId"
                    name="depotId"
                    value={formData.depotId}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.depotId ? 'border-red-500' : 'border-neutral-300'
                    }`}
                  >
                    <option value="">Select Depot</option>
                    <option value="depot-1">Metro Manila Hub</option>
                    <option value="depot-2">Cebu Hub</option>
                    <option value="depot-3">Davao Hub</option>
                  </select>
                  {errors.depotId && (
                    <p className="text-red-600 text-sm mt-1">{errors.depotId}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase & Insurance Information */}
          <Card>
            <CardHeader className="border-b border-neutral-200">
              <CardTitle>Purchase & Insurance Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="purchaseDate" className="block text-sm font-medium text-neutral-700 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    id="purchaseDate"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="purchasePrice" className="block text-sm font-medium text-neutral-700 mb-2">
                    Purchase Price (₱)
                  </label>
                  <input
                    type="number"
                    id="purchasePrice"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="insuranceProvider" className="block text-sm font-medium text-neutral-700 mb-2">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    id="insuranceProvider"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., PLDT Insurance"
                  />
                </div>

                <div>
                  <label htmlFor="insurancePolicy" className="block text-sm font-medium text-neutral-700 mb-2">
                    Insurance Policy Number
                  </label>
                  <input
                    type="text"
                    id="insurancePolicy"
                    name="insurancePolicy"
                    value={formData.insurancePolicy}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Policy number"
                  />
                </div>

                <div>
                  <label htmlFor="insuranceExpiry" className="block text-sm font-medium text-neutral-700 mb-2">
                    Insurance Expiry Date
                  </label>
                  <input
                    type="date"
                    id="insuranceExpiry"
                    name="insuranceExpiry"
                    value={formData.insuranceExpiry}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader className="border-b border-neutral-200">
              <CardTitle>Photos (Up to 5)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-neutral-500">PNG, JPG up to 10MB</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/fleet/vehicles')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Add Vehicle
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
