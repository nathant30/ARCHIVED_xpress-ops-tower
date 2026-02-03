'use client';

/**
 * Incident Details Page
 * Full incident details with evidence upload and timeline
 * Built by Agent 10 - Critical Frontend UI Developer
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  Clock,
  User,
  MapPin,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIncidentsStore, Evidence, TimelineEvent } from '@/stores/incidentsStore';
import { useRouter } from 'next/navigation';

const IncidentDetailsPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const { selectedIncident, addEvidence, removeEvidence, addTimelineEvent } = useIncidentsStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const incident = selectedIncident;

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !incident) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = 10;

    if (incident.evidence.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(`File type not allowed: ${file.name}`);
        return;
      }

      if (file.size > maxSize) {
        alert(`File too large: ${file.name} (max 5MB)`);
        return;
      }

      // Simulate upload
      setUploadingFiles(prev => [...prev, file.name]);

      setTimeout(() => {
        const evidence: Evidence = {
          id: `EVD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: file.type.startsWith('image/') ? 'photo' : 'document',
          filename: file.name,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Current User',
          size: file.size,
        };

        addEvidence(incident.id, evidence);

        const timelineEvent: TimelineEvent = {
          id: `TL-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Current User',
          action: 'Evidence Uploaded',
          description: `Uploaded ${file.name}`,
        };

        addTimelineEvent(incident.id, timelineEvent);

        setUploadingFiles(prev => prev.filter(f => f !== file.name));
      }, 1500);
    });
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Add comment
  const handleAddComment = () => {
    if (!comment.trim() || !incident) return;

    const timelineEvent: TimelineEvent = {
      id: `TL-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Current User',
      action: 'Comment Added',
      description: comment,
    };

    addTimelineEvent(incident.id, timelineEvent);
    setComment('');
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Incident Not Found</h2>
        <Button onClick={() => router.push('/incidents')}>
          Back to Incidents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{incident.id}</h1>
              <Badge
                variant={
                  incident.severity === 'critical' ? 'destructive' :
                  incident.severity === 'high' ? 'default' :
                  'secondary'
                }
              >
                {incident.severity.toUpperCase()}
              </Badge>
              <Badge variant="outline">{incident.type}</Badge>
            </div>
            <p className="text-gray-600">{incident.title}</p>
          </div>
        </div>

        {incident.status !== 'closed' && (
          <Button
            onClick={() => router.push(`/incidents/close/${incident.id}`)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Close Incident
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details and Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-900">{incident.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Status</h4>
                  <Badge className="mt-1">
                    {incident.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Type</h4>
                  <p className="text-gray-900 mt-1 capitalize">{incident.type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Created</h4>
                  <p className="text-gray-900 mt-1">{new Date(incident.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Created By</h4>
                  <p className="text-gray-900 mt-1">{incident.createdBy}</p>
                </div>
                {incident.assignedTo && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600">Assigned To</h4>
                    <p className="text-gray-900 mt-1">{incident.assignedTo}</p>
                  </div>
                )}
              </div>

              {/* Related Entities */}
              {(incident.driverId || incident.vehicleId || incident.bookingId) && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Related</h3>
                  <div className="space-y-2">
                    {incident.driverId && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-600">Driver:</span>
                        <span className="font-mono font-semibold">{incident.driverId}</span>
                      </div>
                    )}
                    {incident.vehicleId && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-600">Vehicle:</span>
                        <span className="font-mono font-semibold">{incident.vehicleId}</span>
                      </div>
                    )}
                    {incident.bookingId && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-600">Booking:</span>
                        <span className="font-mono font-semibold">{incident.bookingId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              {incident.location && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Location</h3>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-600 mt-1" />
                    <div>
                      <p className="text-gray-900">{incident.location.address}</p>
                      <p className="text-gray-600 text-xs">
                        {incident.location.latitude.toFixed(6)}, {incident.location.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evidence Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Evidence ({incident.evidence.length}/10)</span>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                  <Button size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </span>
                  </Button>
                </label>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Drag-drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">
                  Drag and drop files here, or click Upload
                </p>
                <p className="text-sm text-gray-500">
                  Images (JPG, PNG, GIF) or PDF • Max 5MB per file • Max 10 files
                </p>
              </div>

              {/* Uploading files */}
              {uploadingFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadingFiles.map((filename) => (
                    <div key={filename} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                      <span>Uploading {filename}...</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Evidence grid */}
              {incident.evidence.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  {incident.evidence.map((evidence) => (
                    <div key={evidence.id} className="relative group">
                      <div className="border-2 border-gray-200 rounded-lg p-3 hover:border-blue-400 transition-colors">
                        {evidence.type === 'photo' ? (
                          <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        ) : (
                          <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <p className="text-xs font-medium text-gray-900 truncate">{evidence.filename}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(evidence.size)}</p>
                      </div>
                      <button
                        onClick={() => removeEvidence(incident.id, evidence.id)}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline and Comments */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incident.timeline.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
                ) : (
                  incident.timeline.map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">{event.action}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          <span>{event.actor}</span>
                          <span>•</span>
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Comment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Add Comment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your comment or notes..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <Button
                onClick={handleAddComment}
                disabled={!comment.trim()}
                className="w-full mt-3"
              >
                Add Comment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailsPage;
