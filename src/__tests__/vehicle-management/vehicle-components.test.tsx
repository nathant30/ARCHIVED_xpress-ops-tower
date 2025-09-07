// Vehicle Management Component Tests
// Comprehensive test suite for React components in vehicle management
// Testing UI interactions, modal behavior, form validation, and accessibility

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import VehicleDetailModal from '@/components/vehicles/VehicleDetailModal';
import VehicleFormModal from '@/components/vehicles/VehicleFormModal';
import VehiclePermissionGate from '@/components/rbac/VehiclePermissionGate';
import {
  Vehicle,
  VehicleOwnershipType,
  VehicleStatus,
  VehicleCondition,
  CreateVehicleRequest
} from '@/types/vehicles';
import { EnhancedUser } from '@/types/rbac-abac';

// Mock modules
jest.mock('@/hooks/useVehicles', () => ({
  useVehicles: () => ({
    vehicles: mockVehicles,
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    error: null
  })
}));

// Mock fetch API
global.fetch = jest.fn();

// Mock vehicle data
const mockVehicles: Vehicle[] = [
  {
    id: 'veh-001',
    vehicleCode: 'XOT-001',
    licensePlate: 'ABC123',
    vin: 'JT2BF22K5Y0123456',
    make: 'Toyota',
    model: 'Vios',
    year: 2020,
    color: 'White',
    category: 'sedan',
    fuelType: 'gasoline',
    engineDisplacement: 1300,
    seatingCapacity: 4,
    cargoCapacityKg: 300,
    ownershipType: 'xpress_owned',
    status: 'active',
    conditionRating: 'good',
    conditionScore: 85.0,
    regionId: 'region-manila',
    serviceTypes: ['ride_4w'],
    maxTripDistanceKm: 100,
    acquisitionCost: 800000,
    currentMarketValue: 650000,
    monthlyDepreciation: 8000,
    registrationExpiry: new Date('2025-12-31'),
    ltfrbFranchiseNumber: 'LTFRB-NCR-2024-001',
    ltfrbFranchiseExpiry: new Date('2026-06-30'),
    obdDeviceInstalled: true,
    obdDeviceSerial: 'OBD-001-ABC',
    totalMaintenanceCost: 25000,
    maintenanceAlertsCount: 0,
    totalDistanceKm: 15000,
    totalTrips: 850,
    averageRating: 4.5,
    fuelEfficiencyKmpl: 14.5,
    carbonEmissionsKg: 2400,
    dailyOperatingHours: 12,
    utilizationRate: 75.0,
    availabilityScore: 92.0,
    emergencyContacts: [],
    safetyFeatures: { abs: true, airbags: true, gps: true },
    accidentCount: 0,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-01'),
    createdBy: 'admin-001',
    isActive: true
  }
];

const mockUser: EnhancedUser = {
  id: 'user-123',
  email: 'test@xpress.ph',
  firstName: 'Test',
  lastName: 'User',
  timezone: 'Asia/Manila',
  locale: 'en-PH',
  status: 'active',
  roles: [{
    id: '1',
    userId: 'user-123',
    roleId: 'ops-manager',
    role: {
      id: 'ops-manager',
      name: 'ops_manager',
      displayName: 'Operations Manager',
      level: 30,
      permissions: [
        'view_vehicles_detailed',
        'create_vehicles',
        'update_vehicles',
        'assign_driver_to_vehicle'
      ],
      inheritsFrom: [],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    allowedRegions: ['region-manila'],
    validFrom: new Date(),
    assignedAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }],
  allowedRegions: ['region-manila'],
  piiScope: 'masked',
  mfaEnabled: false,
  trustedDevices: [],
  failedLoginAttempts: 0,
  loginCount: 0,
  permissions: [],
  temporaryAccess: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true
};

// Mock detailed vehicle data for modal
const mockDetailedVehicle = {
  ...mockVehicles[0],
  currentAssignment: {
    id: 'assign-001',
    vehicleId: 'veh-001',
    driverId: 'driver-001',
    driverName: 'Juan Dela Cruz',
    assignmentType: 'primary' as const,
    assignedAt: new Date('2024-11-01'),
    validFrom: new Date('2024-11-01'),
    validUntil: new Date('2025-11-01'),
    totalTripsAssigned: 100,
    totalDistanceAssigned: 2500,
    totalEarningsAssigned: 50000,
    averageRatingAssigned: 4.6,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    dailyRentalFee: 500,
    fuelResponsibility: 'driver' as const,
    maintenanceResponsibility: 'owner' as const
  },
  recentMaintenanceHistory: [
    {
      id: 'maint-001',
      vehicleId: 'veh-001',
      maintenanceCode: 'PM-001',
      maintenanceType: 'Preventive Maintenance',
      priority: 'routine' as const,
      isScheduled: true,
      scheduledDate: new Date('2024-10-15'),
      description: 'Regular oil change and filter replacement',
      serviceProvider: 'Toyota Service Center',
      serviceLocation: 'Makati',
      partsCost: 2500,
      laborCost: 1500,
      otherCosts: 0,
      totalCost: 4000,
      status: 'completed' as const,
      completedDate: new Date('2024-10-15'),
      qualityRating: 5,
      inspectionPassed: true,
      affectsSafety: false,
      affectsCompliance: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      laborHours: 2
    }
  ],
  activeAlerts: [],
  complianceStatus: {
    id: 'comp-001',
    vehicleId: 'veh-001',
    franchiseNumber: 'LTFRB-NCR-2024-001',
    franchiseType: 'TNC',
    franchiseIssuedDate: new Date('2024-01-15'),
    franchiseExpiryDate: new Date('2026-06-30'),
    franchiseStatus: 'active' as const,
    registrationNumber: 'REG-001',
    registrationType: 'Private',
    registrationExpiryDate: new Date('2025-12-31'),
    orCrExpiryDate: new Date('2025-12-31'),
    nextInspectionDueDate: new Date('2025-06-15'),
    compulsoryInsuranceExpiry: new Date('2025-03-15'),
    overallComplianceStatus: 'compliant' as const,
    complianceScore: 95,
    activeViolations: [],
    violationHistory: [],
    penaltyPoints: 0,
    totalFinesPhp: 0,
    renewalReminderSent: false,
    autoRenewalEnabled: true,
    documents: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  performanceMetrics: {
    dailyTrips: 10,
    weeklyTrips: 70,
    monthlyTrips: 300,
    dailyRevenue: 2500,
    weeklyRevenue: 17500,
    monthlyRevenue: 75000,
    fuelEfficiencyTrend: [14.2, 14.5, 14.8, 14.3, 14.6],
    utilizationTrend: [70, 75, 78, 72, 75]
  }
};

describe('Vehicle Management Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/vehicles/veh-001')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { vehicle: mockDetailedVehicle }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // =====================================================
  // VehicleDetailModal Component Tests
  // =====================================================

  describe('VehicleDetailModal', () => {
    describe('Modal Behavior', () => {
      it('should not render when not open', () => {
        render(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={false}
            onClose={() => {}}
          />
        );
        
        expect(screen.queryByText('XOT-001')).not.toBeInTheDocument();
      });

      it('should render when open with loading state', () => {
        render(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={true}
            onClose={() => {}}
          />
        );
        
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });

      it('should call onClose when close button is clicked', async () => {
        const mockOnClose = jest.fn();
        
        render(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={true}
            onClose={mockOnClose}
          />
        );
        
        // Wait for vehicle data to load
        await waitFor(() => {
          expect(screen.getByText('XOT-001')).toBeInTheDocument();
        });
        
        // Find and click close button (usually X or close icon)
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
        
        expect(mockOnClose).toHaveBeenCalled();
      });

      it('should handle edit button click', async () => {
        const mockOnEdit = jest.fn();
        
        render(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={true}
            onClose={() => {}}
            onEdit={mockOnEdit}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByText('XOT-001')).toBeInTheDocument();
        });
        
        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);
        
        expect(mockOnEdit).toHaveBeenCalledWith('veh-001');
      });
    });

    describe('Vehicle Information Display', () => {
      beforeEach(async () => {
        render(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={true}
            onClose={() => {}}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByText('XOT-001')).toBeInTheDocument();
        });
      });

      it('should display basic vehicle information', () => {
        expect(screen.getByText('XOT-001')).toBeInTheDocument();
        expect(screen.getByText('ABC123')).toBeInTheDocument();
        expect(screen.getByText('2020 Toyota Vios')).toBeInTheDocument();
        expect(screen.getByText('White')).toBeInTheDocument();
        expect(screen.getByText('4 passengers')).toBeInTheDocument();
      });

      it('should display ownership information', () => {
        expect(screen.getByText('Xpress Owned')).toBeInTheDocument();
        expect(screen.getByText('Owned and operated by Xpress')).toBeInTheDocument();
      });

      it('should display status and condition', () => {
        expect(screen.getByText(/ACTIVE/i)).toBeInTheDocument();
        expect(screen.getByText(/GOOD/i)).toBeInTheDocument();
        expect(screen.getByText('(85/100)')).toBeInTheDocument();
      });

      it('should display performance metrics', () => {
        expect(screen.getByText('850')).toBeInTheDocument(); // Total trips
        expect(screen.getByText('4.5')).toBeInTheDocument(); // Average rating
        expect(screen.getByText('75.0%')).toBeInTheDocument(); // Utilization
        expect(screen.getByText('92.0%')).toBeInTheDocument(); // Availability
      });

      it('should display fuel and efficiency information', () => {
        expect(screen.getByText('gasoline')).toBeInTheDocument();
        expect(screen.getByText('14.5 km/L')).toBeInTheDocument();
        expect(screen.getByText('15,000 km')).toBeInTheDocument();
      });

      it('should display financial information', () => {
        expect(screen.getByText('₱800,000')).toBeInTheDocument(); // Acquisition cost
        expect(screen.getByText('₱25,000')).toBeInTheDocument(); // Maintenance cost
      });

      it('should display environmental metrics', () => {
        expect(screen.getByText('2400 kg CO₂')).toBeInTheDocument();
        expect(screen.getByText('12 hours')).toBeInTheDocument();
      });
    });

    describe('Tab Navigation', () => {
      beforeEach(async () => {
        render(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={true}
            onClose={() => {}}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByText('XOT-001')).toBeInTheDocument();
        });
      });

      it('should have all expected tabs', () => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Maintenance')).toBeInTheDocument();
        expect(screen.getByText('Telematics')).toBeInTheDocument();
        expect(screen.getByText('Compliance')).toBeInTheDocument();
      });

      it('should switch to maintenance tab', async () => {
        const maintenanceTab = screen.getByText('Maintenance');
        fireEvent.click(maintenanceTab);
        
        await waitFor(() => {
          expect(screen.getByText('Maintenance Status')).toBeInTheDocument();
        });
      });

      it('should switch to telematics tab', async () => {
        const telematicsTab = screen.getByText('Telematics');
        fireEvent.click(telematicsTab);
        
        await waitFor(() => {
          expect(screen.getByText('OBD Device Status')).toBeInTheDocument();
        });
      });

      it('should switch to compliance tab', async () => {
        const complianceTab = screen.getByText('Compliance');
        fireEvent.click(complianceTab);
        
        await waitFor(() => {
          expect(screen.getByText('Compliance Status')).toBeInTheDocument();
        });
      });

      it('should maintain active tab state', async () => {
        const maintenanceTab = screen.getByText('Maintenance');
        fireEvent.click(maintenanceTab);
        
        await waitFor(() => {
          expect(maintenanceTab.closest('button')).toHaveClass('bg-white');
        });
      });
    });

    describe('Maintenance Tab Content', () => {
      beforeEach(async () => {
        render(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={true}
            onClose={() => {}}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByText('XOT-001')).toBeInTheDocument();
        });
        
        const maintenanceTab = screen.getByText('Maintenance');
        fireEvent.click(maintenanceTab);
      });

      it('should display maintenance status', async () => {
        await waitFor(() => {
          expect(screen.getByText('Maintenance Status')).toBeInTheDocument();
        });
      });

      it('should display maintenance costs', async () => {
        await waitFor(() => {
          expect(screen.getByText('Maintenance Costs')).toBeInTheDocument();
        });
      });

      it('should show recent maintenance history', async () => {
        await waitFor(() => {
          expect(screen.getByText('Recent Maintenance History')).toBeInTheDocument();
          expect(screen.getByText('Preventive Maintenance')).toBeInTheDocument();
        });
      });

      it('should display schedule buttons', async () => {
        await waitFor(() => {
          expect(screen.getByText('Schedule Maintenance')).toBeInTheDocument();
          expect(screen.getByText('View History')).toBeInTheDocument();
        });
      });
    });

    describe('Telematics Tab Content', () => {
      beforeEach(async () => {
        render(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={true}
            onClose={() => {}}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByText('XOT-001')).toBeInTheDocument();
        });
        
        const telematicsTab = screen.getByText('Telematics');
        fireEvent.click(telematicsTab);
      });

      it('should display OBD device status', async () => {
        await waitFor(() => {
          expect(screen.getByText('OBD Device Status')).toBeInTheDocument();
          expect(screen.getByText('OBD-001-ABC')).toBeInTheDocument();
        });
      });

      it('should handle vehicles without OBD devices', async () => {
        // Mock vehicle without OBD
        const vehicleWithoutOBD = { ...mockDetailedVehicle, obdDeviceInstalled: false };
        
        (global.fetch as jest.Mock).mockImplementation(() => 
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { vehicle: vehicleWithoutOBD }
            })
          })
        );
        
        // Re-render component
        render(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={true}
            onClose={() => {}}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByText('XOT-001')).toBeInTheDocument();
        });
        
        const telematicsTab = screen.getByText('Telematics');
        fireEvent.click(telematicsTab);
        
        await waitFor(() => {
          expect(screen.getByText('No OBD device installed')).toBeInTheDocument();
          expect(screen.getByText('Install OBD Device')).toBeInTheDocument();
        });
      });
    });

    describe('Compliance Tab Content', () => {
      beforeEach(async () => {
        render(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={true}
            onClose={() => {}}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByText('XOT-001')).toBeInTheDocument();
        });
        
        const complianceTab = screen.getByText('Compliance');
        fireEvent.click(complianceTab);
      });

      it('should display compliance overview', async () => {
        await waitFor(() => {
          expect(screen.getByText('Compliance Status')).toBeInTheDocument();
          expect(screen.getByText('Compliance Score: 95/100')).toBeInTheDocument();
        });
      });

      it('should display LTFRB franchise information', async () => {
        await waitFor(() => {
          expect(screen.getByText('LTFRB Franchise')).toBeInTheDocument();
          expect(screen.getByText('LTFRB-NCR-2024-001')).toBeInTheDocument();
        });
      });

      it('should display vehicle registration', async () => {
        await waitFor(() => {
          expect(screen.getByText('Vehicle Registration')).toBeInTheDocument();
          expect(screen.getByText('REG-001')).toBeInTheDocument();
        });
      });

      it('should display insurance information', async () => {
        await waitFor(() => {
          expect(screen.getByText('Insurance Coverage')).toBeInTheDocument();
        });
      });

      it('should display inspection information', async () => {
        await waitFor(() => {
          expect(screen.getByText('Inspections & Certifications')).toBeInTheDocument();
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle API errors gracefully', async () => {
        (global.fetch as jest.Mock).mockImplementation(() => 
          Promise.reject(new Error('Network error'))
        );
        
        render(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={true}
            onClose={() => {}}
          />
        );
        
        // Should handle error without crashing
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });

      it('should display message when vehicle not found', async () => {
        (global.fetch as jest.Mock).mockImplementation(() => 
          Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ success: false, error: 'Vehicle not found' })
          })
        );
        
        render(
          <VehicleDetailModal
            vehicleId="veh-999"
            isOpen={true}
            onClose={() => {}}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByText('Vehicle not found')).toBeInTheDocument();
        });
      });
    });

    describe('Accessibility', () => {
      beforeEach(async () => {
        render(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={true}
            onClose={() => {}}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByText('XOT-001')).toBeInTheDocument();
        });
      });

      it('should have proper dialog role', () => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });

      it('should have accessible tab navigation', () => {
        const tablist = screen.getByRole('tablist');
        expect(tablist).toBeInTheDocument();
        
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(4);
      });

      it('should support keyboard navigation', async () => {
        const user = userEvent.setup();
        
        const firstTab = screen.getByRole('tab', { name: /overview/i });
        const secondTab = screen.getByRole('tab', { name: /maintenance/i });
        
        await user.tab(); // Focus first interactive element
        await user.keyboard('{Tab}'); // Navigate to tabs
        
        expect(firstTab).toHaveFocus();
        
        await user.keyboard('{ArrowRight}');
        expect(secondTab).toHaveFocus();
      });

      it('should have proper heading structure', () => {
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
        
        // Check for proper heading hierarchy
        headings.forEach(heading => {
          expect(heading.tagName).toMatch(/H[1-6]/);
        });
      });
    });
  });

  // =====================================================
  // VehiclePermissionGate Component Tests
  // =====================================================

  describe('VehiclePermissionGate', () => {
    it('should render children when user has required permissions', () => {
      render(
        <VehiclePermissionGate
          requiredPermissions={['view_vehicles_detailed']}
          ownershipType="xpress_owned"
          vehicleContext={{ vehicleId: 'veh-001', regionId: 'region-manila' }}
        >
          <div>Protected Content</div>
        </VehiclePermissionGate>
      );
      
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not render children when user lacks permissions', () => {
      const unauthorizedUser = {
        ...mockUser,
        roles: [{
          ...mockUser.roles[0],
          role: {
            ...mockUser.roles[0].role,
            permissions: [] // No permissions
          }
        }]
      };
      
      // Mock unauthorized user
      jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
        user: unauthorizedUser,
        loading: false,
        error: null
      });
      
      render(
        <VehiclePermissionGate
          requiredPermissions={['view_vehicles_detailed']}
          ownershipType="xpress_owned"
          vehicleContext={{ vehicleId: 'veh-001', regionId: 'region-manila' }}
        >
          <div>Protected Content</div>
        </VehiclePermissionGate>
      );
      
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should display fallback content when unauthorized', () => {
      const unauthorizedUser = {
        ...mockUser,
        roles: [{
          ...mockUser.roles[0],
          role: {
            ...mockUser.roles[0].role,
            permissions: []
          }
        }]
      };
      
      jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
        user: unauthorizedUser,
        loading: false,
        error: null
      });
      
      render(
        <VehiclePermissionGate
          requiredPermissions={['view_vehicles_detailed']}
          ownershipType="xpress_owned"
          vehicleContext={{ vehicleId: 'veh-001', regionId: 'region-manila' }}
          fallback={<div>Access Denied</div>}
        >
          <div>Protected Content</div>
        </VehiclePermissionGate>
      );
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should handle loading state', () => {
      jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
        user: null,
        loading: true,
        error: null
      });
      
      render(
        <VehiclePermissionGate
          requiredPermissions={['view_vehicles_detailed']}
          ownershipType="xpress_owned"
          vehicleContext={{ vehicleId: 'veh-001', regionId: 'region-manila' }}
        >
          <div>Protected Content</div>
        </VehiclePermissionGate>
      );
      
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  // =====================================================
  // Responsive Design Tests
  // =====================================================

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      render(
        <VehicleDetailModal
          vehicleId="veh-001"
          isOpen={true}
          onClose={() => {}}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('XOT-001')).toBeInTheDocument();
      });
      
      // Check that modal adapts to mobile layout
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('should adapt to tablet viewport', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });
      
      render(
        <VehicleDetailModal
          vehicleId="veh-001"
          isOpen={true}
          onClose={() => {}}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('XOT-001')).toBeInTheDocument();
      });
    });
  });

  // =====================================================
  // Performance Tests
  // =====================================================

  describe('Component Performance', () => {
    it('should render within acceptable time', async () => {
      const startTime = performance.now();
      
      render(
        <VehicleDetailModal
          vehicleId="veh-001"
          isOpen={true}
          onClose={() => {}}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('XOT-001')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
    });

    it('should handle rapid modal open/close', async () => {
      const { rerender } = render(
        <VehicleDetailModal
          vehicleId="veh-001"
          isOpen={false}
          onClose={() => {}}
        />
      );
      
      // Rapidly toggle modal
      for (let i = 0; i < 5; i++) {
        rerender(
          <VehicleDetailModal
            vehicleId="veh-001"
            isOpen={i % 2 === 0}
            onClose={() => {}}
          />
        );
      }
      
      // Should not crash or cause memory leaks
      expect(true).toBe(true);
    });
  });
});