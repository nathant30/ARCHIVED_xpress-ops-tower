'use client';

/**
 * Identity Verification Review Interface
 * Split-screen document viewer with dynamic verification checklist
 * Built by Agent 13 - Identity Verification UI Developer
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Types
type DocumentType = 'government_id' | 'drivers_license' | 'proof_of_address' | 'vehicle_registration' | 'background_check';

interface Document {
  id: string;
  type: DocumentType;
  url: string;
  filename: string;
  side?: 'front' | 'back';
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  required: boolean;
}

interface DriverInfo {
  id: string;
  name: string;
  photo: string;
  registrationDate: string;
  email: string;
  phone: string;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  notes?: string;
}

// Mock data
const MOCK_DRIVER: DriverInfo = {
  id: 'D-0234',
  name: 'Juan dela Cruz',
  photo: '/placeholder-driver.jpg',
  registrationDate: '2026-01-15',
  email: 'juan.delacruz@email.com',
  phone: '+63 917 123 4567',
};

const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'DOC-001',
    type: 'government_id',
    url: '/placeholder-id-front.jpg',
    filename: 'government_id_front.jpg',
    side: 'front',
  },
  {
    id: 'DOC-002',
    type: 'government_id',
    url: '/placeholder-id-back.jpg',
    filename: 'government_id_back.jpg',
    side: 'back',
  },
  {
    id: 'DOC-003',
    type: 'drivers_license',
    url: '/placeholder-license-front.jpg',
    filename: 'drivers_license_front.jpg',
    side: 'front',
  },
  {
    id: 'DOC-004',
    type: 'drivers_license',
    url: '/placeholder-license-back.jpg',
    filename: 'drivers_license_back.jpg',
    side: 'back',
  },
  {
    id: 'DOC-005',
    type: 'proof_of_address',
    url: '/placeholder-address.jpg',
    filename: 'proof_of_address.jpg',
  },
];

const MOCK_AUDIT_TRAIL: AuditEntry[] = [
  {
    id: 'AUD-001',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actor: 'System',
    action: 'Verification submitted',
  },
  {
    id: 'AUD-002',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    actor: 'Sarah Chen',
    action: 'Assigned to reviewer',
  },
];

// Checklists for different document types
const DOCUMENT_CHECKLISTS: Record<DocumentType, ChecklistItem[]> = {
  government_id: [
    { id: 'gi-1', label: 'Document is clear and readable', checked: false, required: true },
    { id: 'gi-2', label: 'Document is not expired', checked: false, required: true },
    { id: 'gi-3', label: 'Photo matches driver selfie', checked: false, required: true },
    { id: 'gi-4', label: 'Name matches across all documents', checked: false, required: true },
    { id: 'gi-5', label: 'Date of birth is valid (18+ years old)', checked: false, required: true },
  ],
  drivers_license: [
    { id: 'dl-1', label: 'License is valid and not expired', checked: false, required: true },
    { id: 'dl-2', label: 'License class allows rideshare driving', checked: false, required: true },
    { id: 'dl-3', label: 'No restrictions that prevent driving', checked: false, required: true },
    { id: 'dl-4', label: 'License number is valid format', checked: false, required: true },
  ],
  proof_of_address: [
    { id: 'pa-1', label: 'Document is within 3 months', checked: false, required: true },
    { id: 'pa-2', label: 'Address is complete and valid', checked: false, required: true },
    { id: 'pa-3', label: 'Name matches other documents', checked: false, required: true },
  ],
  vehicle_registration: [
    { id: 'vr-1', label: 'Registration is current and valid', checked: false, required: true },
    { id: 'vr-2', label: 'Vehicle details match records', checked: false, required: true },
    { id: 'vr-3', label: 'Owner name matches driver', checked: false, required: true },
  ],
  background_check: [
    { id: 'bc-1', label: 'No disqualifying criminal history', checked: false, required: true },
    { id: 'bc-2', label: 'Report is recent (within 6 months)', checked: false, required: true },
    { id: 'bc-3', label: 'All required checks completed', checked: false, required: true },
  ],
};

const VerificationReviewPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [documents] = useState<Document[]>(MOCK_DOCUMENTS);
  const [driver] = useState<DriverInfo>(MOCK_DRIVER);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>(MOCK_AUDIT_TRAIL);
  const [checklists, setChecklists] = useState<Record<DocumentType, ChecklistItem[]>>(DOCUMENT_CHECKLISTS);
  const [notes, setNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestDocuments, setRequestDocuments] = useState<DocumentType[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentDocument = documents[currentDocIndex];
  const currentChecklist = currentDocument ? checklists[currentDocument.type] : [];

  const handleChecklistToggle = (itemId: string) => {
    if (!currentDocument) return;
    setChecklists(prev => ({
      ...prev,
      [currentDocument.type]: prev[currentDocument.type].map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    }));
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleFullscreen = () => setIsFullscreen(!isFullscreen);

  const handlePrevDocument = () => {
    if (currentDocIndex > 0) setCurrentDocIndex(currentDocIndex - 1);
  };

  const handleNextDocument = () => {
    if (currentDocIndex < documents.length - 1) setCurrentDocIndex(currentDocIndex + 1);
  };

  const allRequiredChecked = () => {
    return Object.values(checklists).every(checklist =>
      checklist.filter(item => item.required).every(item => item.checked)
    );
  };

  const handleApprove = () => {
    if (!allRequiredChecked()) {
      alert('Please complete all required checklist items before approving.');
      return;
    }

    const auditEntry: AuditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Current User',
      action: 'Verification approved',
      ...(notes && { notes }),
    };

    setAuditTrail([...auditTrail, auditEntry]);
    alert('Verification approved successfully!');
    router.push('/identity-verification');
  };

  const handleReject = () => {
    if (!rejectReason) {
      alert('Please select a reason for rejection.');
      return;
    }

    const auditEntry: AuditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Current User',
      action: 'Verification rejected',
      notes: `Reason: ${rejectReason}. ${rejectNotes}`,
    };

    setAuditTrail([...auditTrail, auditEntry]);
    alert('Verification rejected.');
    router.push('/identity-verification');
  };

  const handleRequestMoreInfo = () => {
    if (requestDocuments.length === 0) {
      alert('Please select at least one document type to request.');
      return;
    }

    const auditEntry: AuditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Current User',
      action: 'Requested more information',
      notes: `Requested: ${requestDocuments.join(', ')}. ${requestMessage}`,
    };

    setAuditTrail([...auditTrail, auditEntry]);
    alert('More information requested from driver.');
    router.push('/identity-verification');
  };

  const addNote = () => {
    if (!notes.trim()) return;

    const auditEntry: AuditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Current User',
      action: 'Added note',
      notes,
    };

    setAuditTrail([...auditTrail, auditEntry]);
    setNotes('');
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels: Record<DocumentType, string> = {
      government_id: 'Government ID',
      drivers_license: "Driver's License",
      proof_of_address: 'Proof of Address',
      vehicle_registration: 'Vehicle Registration',
      background_check: 'Background Check',
    };
    return labels[type];
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Review Verification - {params.id}</h1>
              <p className="text-sm text-gray-600">Driver: {driver.name} ({driver.id})</p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-800">In Review</Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 h-[calc(100vh-88px)]">
        {/* Left Side: Document Viewer (60%) */}
        <div className="lg:col-span-3 bg-gray-900 flex flex-col">
          {/* Document Viewer Controls */}
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevDocument}
                disabled={currentDocIndex === 0}
                className="text-white hover:bg-gray-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-white">
                <p className="text-sm font-medium">
                  {currentDocument && getDocumentTypeLabel(currentDocument.type)}
                  {currentDocument?.side && ` (${currentDocument.side})`}
                </p>
                <p className="text-xs text-gray-400">
                  Document {currentDocIndex + 1} of {documents.length}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextDocument}
                disabled={currentDocIndex === documents.length - 1}
                className="text-white hover:bg-gray-700"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="text-white hover:bg-gray-700"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <span className="text-white text-sm w-16 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="text-white hover:bg-gray-700"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotate}
                className="text-white hover:bg-gray-700"
              >
                <RotateCw className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
                className="text-white hover:bg-gray-700"
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Document Display */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div
              className="bg-white shadow-2xl flex items-center justify-center"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease',
              }}
            >
              {currentDocument ? (
                <div className="w-[600px] h-[400px] bg-gray-200 flex items-center justify-center">
                  <FileText className="h-32 w-32 text-gray-400" />
                  <div className="absolute text-center">
                    <p className="text-gray-600 font-semibold">{currentDocument.filename}</p>
                    <p className="text-sm text-gray-500 mt-2">Document preview placeholder</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No document selected</p>
              )}
            </div>
          </div>

          {/* Document Navigation Thumbnails */}
          <div className="bg-gray-800 px-6 py-4">
            <div className="flex gap-2 overflow-x-auto">
              {documents.map((doc, index) => (
                <button
                  key={doc.id}
                  onClick={() => setCurrentDocIndex(index)}
                  className={`flex-shrink-0 w-24 h-16 bg-gray-700 rounded border-2 transition-all ${
                    index === currentDocIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-500'
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-xs text-white text-center mt-1 truncate px-1">
                    {getDocumentTypeLabel(doc.type).slice(0, 10)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Verification Panel (40%) */}
        <div className="lg:col-span-2 bg-white overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Driver Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Driver Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                    <p className="text-sm text-gray-600">ID: {driver.id}</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Registered: {new Date(driver.registrationDate).toLocaleDateString()}</span>
                      </div>
                      <p>{driver.email}</p>
                      <p>{driver.phone}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Verification Checklist: {currentDocument && getDocumentTypeLabel(currentDocument.type)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentChecklist.length > 0 ? (
                  <div className="space-y-3">
                    {currentChecklist.map(item => (
                      <div key={item.id} className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={item.id}
                          checked={item.checked}
                          onChange={() => handleChecklistToggle(item.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={item.id} className="flex-1 text-sm text-gray-700 cursor-pointer">
                          {item.label}
                          {item.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No checklist available for this document type.</p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleApprove}
                  disabled={!allRequiredChecked()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Verification
                </Button>

                <Button
                  onClick={() => setShowRejectDialog(true)}
                  variant="destructive"
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Verification
                </Button>

                <Button
                  onClick={() => setShowRequestDialog(true)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request More Info
                </Button>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  Reviewer Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes or observations..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <Button onClick={addNote} disabled={!notes.trim()} size="sm" className="w-full mt-2">
                  Add Note
                </Button>
              </CardContent>
            </Card>

            {/* Audit Trail */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditTrail.map(entry => (
                    <div key={entry.id} className="flex gap-3 pb-3 border-b border-gray-200 last:border-0">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{entry.action}</p>
                        {entry.notes && <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{entry.actor}</span>
                          <span>•</span>
                          <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Reject Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for rejection *</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason...</option>
                  <option value="document_expired">Document Expired</option>
                  <option value="poor_quality">Poor Quality</option>
                  <option value="name_mismatch">Name Mismatch</option>
                  <option value="fraudulent">Fraudulent</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional notes</label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Provide additional details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setShowRejectDialog(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleReject} variant="destructive" className="flex-1">
                  Confirm Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Request More Info Dialog */}
      {showRequestDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                Request More Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Documents to re-submit *</label>
                <div className="space-y-2">
                  {(Object.keys(DOCUMENT_CHECKLISTS) as DocumentType[]).map(docType => (
                    <div key={docType} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`req-${docType}`}
                        checked={requestDocuments.includes(docType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRequestDocuments([...requestDocuments, docType]);
                          } else {
                            setRequestDocuments(requestDocuments.filter(d => d !== docType));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`req-${docType}`} className="text-sm text-gray-700 cursor-pointer">
                        {getDocumentTypeLabel(docType)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message to driver</label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Explain what information is needed..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setShowRequestDialog(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleRequestMoreInfo} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
                  Send Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VerificationReviewPage;
