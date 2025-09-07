'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  Truck,
  Calendar,
  Award,
  AlertTriangle,
  Save,
  X,
  Edit,
  Eye,
  Plus,
  Download,
  Upload
} from 'lucide-react';

import { Operator, CreateOperatorRequest, UpdateOperatorRequest, OperatorType, OperatorStatus } from '@/types/operators';
import { useAuth } from '@/hooks/useAuth';

interface OperatorModalProps {
  operator: Operator | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (operator: Operator) => void;
  language: 'en' | 'fil';
}

const OperatorModal: React.FC<OperatorModalProps> = ({
  operator,
  isOpen,
  onClose,
  onSave,
  language
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateOperatorRequest>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();
  const isNewOperator = !operator;

  // Translations
  const translations = {
    en: {
      title: isNewOperator ? 'Add New Operator' : 'Operator Details',
      overview: 'Overview',
      financial: 'Financial',
      performance: 'Performance',
      fleet: 'Fleet',
      documents: 'Documents',
      history: 'History',
      edit: 'Edit',
      save: 'Save Changes',
      cancel: 'Cancel',
      close: 'Close',
      businessInfo: 'Business Information',
      contactInfo: 'Contact Information',
      operationalInfo: 'Operational Information',
      businessName: 'Business Name',
      legalName: 'Legal Name',
      tradeName: 'Trade Name (Optional)',
      operatorCode: 'Operator Code',
      operatorType: 'Operator Type',
      status: 'Status',
      registrationNumber: 'Business Registration Number',
      tin: 'TIN (Optional)',
      ltfrbAuthority: 'LTFRB Authority Number',
      contactName: 'Contact Person',
      contactPosition: 'Position',
      contactPhone: 'Phone Number',
      contactEmail: 'Email Address',
      businessAddress: 'Business Address',
      street: 'Street Address',
      city: 'City',
      province: 'Province',
      region: 'Region',
      postalCode: 'Postal Code',
      maxVehicles: 'Maximum Vehicles',
      primaryRegion: 'Primary Region',
      partnershipStart: 'Partnership Start Date',
      operationalHours: 'Operational Hours',
      startTime: 'Start Time',
      endTime: 'End Time',
      performanceScore: 'Performance Score',
      commissionTier: 'Commission Tier',
      monthlyEarnings: 'Monthly Earnings',
      totalEarnings: 'Total Earnings',
      vehicleCount: 'Vehicle Count',
      activeDrivers: 'Active Drivers',
      tnvs: 'TNVS',
      general: 'General',
      fleet: 'Fleet',
      tier_1: 'Tier 1',
      tier_2: 'Tier 2',
      tier_3: 'Tier 3',
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      pending_approval: 'Pending Approval',
      requiredField: 'This field is required',
      invalidEmail: 'Please enter a valid email address',
      invalidPhone: 'Please enter a valid Philippine phone number',
      success: 'Operator saved successfully',
      error: 'Failed to save operator'
    },
    fil: {
      title: isNewOperator ? 'Magdagdag ng Bagong Operator' : 'Mga Detalye ng Operator',
      overview: 'Pangkalahatang Tingnan',
      financial: 'Pananalapi',
      performance: 'Performance',
      fleet: 'Fleet',
      documents: 'Mga Dokumento',
      history: 'Kasaysayan',
      edit: 'I-edit',
      save: 'I-save ang mga Pagbabago',
      cancel: 'Kanselahin',
      close: 'Isara',
      businessInfo: 'Impormasyon ng Negosyo',
      contactInfo: 'Impormasyon sa Pakikipag-ugnayan',
      operationalInfo: 'Impormasyon sa Operasyon',
      businessName: 'Pangalan ng Negosyo',
      legalName: 'Legal na Pangalan',
      tradeName: 'Trade Name (Opsyonal)',
      operatorCode: 'Operator Code',
      operatorType: 'Uri ng Operator',
      status: 'Status',
      registrationNumber: 'Business Registration Number',
      tin: 'TIN (Opsyonal)',
      ltfrbAuthority: 'LTFRB Authority Number',
      contactName: 'Taong Makikipag-ugnayan',
      contactPosition: 'Posisyon',
      contactPhone: 'Numero ng Telepono',
      contactEmail: 'Email Address',
      businessAddress: 'Business Address',
      street: 'Street Address',
      city: 'Lungsod',
      province: 'Probinsya',
      region: 'Rehiyon',
      postalCode: 'Postal Code',
      maxVehicles: 'Pinakamataas na Bilang ng Sasakyan',
      primaryRegion: 'Pangunahing Rehiyon',
      partnershipStart: 'Simula ng Partnership',
      operationalHours: 'Oras ng Operasyon',
      startTime: 'Oras ng Simula',
      endTime: 'Oras ng Pagtatapos',
      performanceScore: 'Performance Score',
      commissionTier: 'Commission Tier',
      monthlyEarnings: 'Buwanang Kita',
      totalEarnings: 'Kabuuang Kita',
      vehicleCount: 'Bilang ng Sasakyan',
      activeDrivers: 'Aktibong Drivers',
      tnvs: 'TNVS',
      general: 'General',
      fleet: 'Fleet',
      tier_1: 'Tier 1',
      tier_2: 'Tier 2',
      tier_3: 'Tier 3',
      active: 'Aktibo',
      inactive: 'Hindi Aktibo',
      suspended: 'Nasuspinde',
      pending_approval: 'Naghihintay ng Approval',
      requiredField: 'Kailangan ang field na ito',
      invalidEmail: 'Maglagay ng valid na email address',
      invalidPhone: 'Maglagay ng valid na Philippine phone number',
      success: 'Matagumpay na na-save ang operator',
      error: 'Hindi na-save ang operator'
    }
  };

  const t = translations[language];

  // Initialize form data
  useEffect(() => {
    if (operator) {
      setFormData({
        operator_code: operator.operator_code,
        business_name: operator.business_name,
        legal_name: operator.legal_name,
        trade_name: operator.trade_name,
        operator_type: operator.operator_type,
        primary_contact: operator.primary_contact,
        business_address: operator.business_address,
        business_registration_number: operator.business_registration_number,
        tin: operator.tin,
        ltfrb_authority_number: operator.ltfrb_authority_number,
        primary_region_id: operator.primary_region_id,
        max_vehicles: operator.max_vehicles,
        partnership_start_date: operator.partnership_start_date,
        operational_hours: operator.operational_hours
      });
    } else {
      setFormData({
        operator_type: 'tnvs',
        primary_contact: {
          name: '',
          phone: '',
          email: '',
          position: ''
        },
        business_address: {
          street: '',
          city: '',
          province: '',
          region: '',
          postal_code: '',
          country: 'Philippines'
        },
        operational_hours: {
          start: '06:00',
          end: '22:00'
        }
      });
      setIsEditing(true);
    }
  }, [operator]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newData;
      }
    });
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.business_name?.trim()) {
      errors.business_name = t.requiredField;
    }
    
    if (!formData.legal_name?.trim()) {
      errors.legal_name = t.requiredField;
    }
    
    if (!formData.operator_code?.trim()) {
      errors.operator_code = t.requiredField;
    }
    
    if (!formData.business_registration_number?.trim()) {
      errors.business_registration_number = t.requiredField;
    }
    
    if (!formData.primary_contact?.name?.trim()) {
      errors['primary_contact.name'] = t.requiredField;
    }
    
    if (!formData.primary_contact?.email?.trim()) {
      errors['primary_contact.email'] = t.requiredField;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_contact.email)) {
      errors['primary_contact.email'] = t.invalidEmail;
    }
    
    if (!formData.primary_contact?.phone?.trim()) {
      errors['primary_contact.phone'] = t.requiredField;
    } else if (!/^(\+63|0)[0-9]{10}$/.test(formData.primary_contact.phone.replace(/\s|-/g, ''))) {
      errors['primary_contact.phone'] = t.invalidPhone;
    }
    
    if (!formData.business_address?.street?.trim()) {
      errors['business_address.street'] = t.requiredField;
    }
    
    if (!formData.business_address?.city?.trim()) {
      errors['business_address.city'] = t.requiredField;
    }
    
    if (!formData.business_address?.province?.trim()) {
      errors['business_address.province'] = t.requiredField;
    }
    
    if (!formData.business_address?.region?.trim()) {
      errors['business_address.region'] = t.requiredField;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const url = operator ? `/api/operators/${operator.id}` : '/api/operators';
      const method = operator ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        onSave(data.operator);
      } else {
        const error = await response.json();
        console.error('Save failed:', error);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render overview tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t.businessInfo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="business_name">{t.businessName}</Label>
              <Input
                id="business_name"
                value={formData.business_name || ''}
                onChange={(e) => handleFieldChange('business_name', e.target.value)}
                disabled={!isEditing}
                className={validationErrors.business_name ? 'border-red-500' : ''}
              />
              {validationErrors.business_name && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.business_name}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="legal_name">{t.legalName}</Label>
              <Input
                id="legal_name"
                value={formData.legal_name || ''}
                onChange={(e) => handleFieldChange('legal_name', e.target.value)}
                disabled={!isEditing}
                className={validationErrors.legal_name ? 'border-red-500' : ''}
              />
              {validationErrors.legal_name && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.legal_name}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="trade_name">{t.tradeName}</Label>
              <Input
                id="trade_name"
                value={formData.trade_name || ''}
                onChange={(e) => handleFieldChange('trade_name', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            
            <div>
              <Label htmlFor="operator_code">{t.operatorCode}</Label>
              <Input
                id="operator_code"
                value={formData.operator_code || ''}
                onChange={(e) => handleFieldChange('operator_code', e.target.value)}
                disabled={!isEditing}
                className={validationErrors.operator_code ? 'border-red-500' : ''}
              />
              {validationErrors.operator_code && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.operator_code}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="operator_type">{t.operatorType}</Label>
              <Select
                value={formData.operator_type}
                onValueChange={(value) => handleFieldChange('operator_type', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tnvs">{t.tnvs}</SelectItem>
                  <SelectItem value="general">{t.general}</SelectItem>
                  <SelectItem value="fleet">{t.fleet}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {operator && (
              <div>
                <Label>{t.status}</Label>
                <div className="mt-2">
                  <Badge 
                    variant="outline"
                    className={
                      operator.status === 'active' ? 'bg-green-100 text-green-800' :
                      operator.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }
                  >
                    {t[operator.status as keyof typeof t]}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="registration_number">{t.registrationNumber}</Label>
              <Input
                id="registration_number"
                value={formData.business_registration_number || ''}
                onChange={(e) => handleFieldChange('business_registration_number', e.target.value)}
                disabled={!isEditing}
                className={validationErrors.business_registration_number ? 'border-red-500' : ''}
              />
              {validationErrors.business_registration_number && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.business_registration_number}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="tin">{t.tin}</Label>
              <Input
                id="tin"
                value={formData.tin || ''}
                onChange={(e) => handleFieldChange('tin', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            
            <div>
              <Label htmlFor="ltfrb_authority">{t.ltfrbAuthority}</Label>
              <Input
                id="ltfrb_authority"
                value={formData.ltfrb_authority_number || ''}
                onChange={(e) => handleFieldChange('ltfrb_authority_number', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            
            <div>
              <Label htmlFor="partnership_start">{t.partnershipStart}</Label>
              <Input
                id="partnership_start"
                type="date"
                value={formData.partnership_start_date?.split('T')[0] || ''}
                onChange={(e) => handleFieldChange('partnership_start_date', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t.contactInfo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_name">{t.contactName}</Label>
              <Input
                id="contact_name"
                value={formData.primary_contact?.name || ''}
                onChange={(e) => handleFieldChange('primary_contact.name', e.target.value)}
                disabled={!isEditing}
                className={validationErrors['primary_contact.name'] ? 'border-red-500' : ''}
              />
              {validationErrors['primary_contact.name'] && (
                <p className="text-sm text-red-500 mt-1">{validationErrors['primary_contact.name']}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="contact_position">{t.contactPosition}</Label>
              <Input
                id="contact_position"
                value={formData.primary_contact?.position || ''}
                onChange={(e) => handleFieldChange('primary_contact.position', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            
            <div>
              <Label htmlFor="contact_phone">{t.contactPhone}</Label>
              <Input
                id="contact_phone"
                value={formData.primary_contact?.phone || ''}
                onChange={(e) => handleFieldChange('primary_contact.phone', e.target.value)}
                disabled={!isEditing}
                className={validationErrors['primary_contact.phone'] ? 'border-red-500' : ''}
              />
              {validationErrors['primary_contact.phone'] && (
                <p className="text-sm text-red-500 mt-1">{validationErrors['primary_contact.phone']}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="contact_email">{t.contactEmail}</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.primary_contact?.email || ''}
                onChange={(e) => handleFieldChange('primary_contact.email', e.target.value)}
                disabled={!isEditing}
                className={validationErrors['primary_contact.email'] ? 'border-red-500' : ''}
              />
              {validationErrors['primary_contact.email'] && (
                <p className="text-sm text-red-500 mt-1">{validationErrors['primary_contact.email']}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t.businessAddress}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street">{t.street}</Label>
            <Input
              id="street"
              value={formData.business_address?.street || ''}
              onChange={(e) => handleFieldChange('business_address.street', e.target.value)}
              disabled={!isEditing}
              className={validationErrors['business_address.street'] ? 'border-red-500' : ''}
            />
            {validationErrors['business_address.street'] && (
              <p className="text-sm text-red-500 mt-1">{validationErrors['business_address.street']}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">{t.city}</Label>
              <Input
                id="city"
                value={formData.business_address?.city || ''}
                onChange={(e) => handleFieldChange('business_address.city', e.target.value)}
                disabled={!isEditing}
                className={validationErrors['business_address.city'] ? 'border-red-500' : ''}
              />
              {validationErrors['business_address.city'] && (
                <p className="text-sm text-red-500 mt-1">{validationErrors['business_address.city']}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="province">{t.province}</Label>
              <Input
                id="province"
                value={formData.business_address?.province || ''}
                onChange={(e) => handleFieldChange('business_address.province', e.target.value)}
                disabled={!isEditing}
                className={validationErrors['business_address.province'] ? 'border-red-500' : ''}
              />
              {validationErrors['business_address.province'] && (
                <p className="text-sm text-red-500 mt-1">{validationErrors['business_address.province']}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="region">{t.region}</Label>
              <Input
                id="region"
                value={formData.business_address?.region || ''}
                onChange={(e) => handleFieldChange('business_address.region', e.target.value)}
                disabled={!isEditing}
                className={validationErrors['business_address.region'] ? 'border-red-500' : ''}
              />
              {validationErrors['business_address.region'] && (
                <p className="text-sm text-red-500 mt-1">{validationErrors['business_address.region']}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="postal_code">{t.postalCode}</Label>
              <Input
                id="postal_code"
                value={formData.business_address?.postal_code || ''}
                onChange={(e) => handleFieldChange('business_address.postal_code', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render performance summary
  const renderPerformanceTab = () => {
    if (!operator) return <div>Performance data not available for new operators</div>;
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t.performance}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {operator.performance_score}/100
                </div>
                <p className="text-muted-foreground">{t.performanceScore}</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {operator.commission_tier.charAt(0).toUpperCase() + operator.commission_tier.slice(1)}
                </div>
                <p className="text-muted-foreground">{t.commissionTier}</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  ₱{operator.earnings_month.toLocaleString()}
                </div>
                <p className="text-muted-foreground">{t.monthlyEarnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {t.title}
            </DialogTitle>
            
            {operator && !isNewOperator && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isLoading}
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  {isEditing ? t.cancel : t.edit}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t.overview}</TabsTrigger>
            {operator && (
              <>
                <TabsTrigger value="performance">{t.performance}</TabsTrigger>
                <TabsTrigger value="financial">{t.financial}</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {renderOverviewTab()}
          </TabsContent>

          {operator && (
            <>
              <TabsContent value="performance" className="mt-6">
                {renderPerformanceTab()}
              </TabsContent>
              
              <TabsContent value="financial" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold">₱{operator.earnings_today.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">Today</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold">₱{operator.earnings_week.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">This Week</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold">₱{operator.earnings_month.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">This Month</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold">₱{operator.total_commissions_earned.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">Total Earned</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t.close}
          </Button>
          
          {(isEditing || isNewOperator) && (
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
              <Save className="h-4 w-4 mr-2" />
              {t.save}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OperatorModal;