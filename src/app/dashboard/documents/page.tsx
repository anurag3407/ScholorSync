'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Circle, 
  FileText, 
  Upload, 
  Loader2, 
  ArrowRight,
  Trash2,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import type { UserDocument } from '@/types';

const requiredDocumentTypes = [
  { id: 'aadhaar', name: 'Aadhaar Card', required: true },
  { id: 'incomeCert', name: 'Income Certificate', required: true },
  { id: 'casteCert', name: 'Caste Certificate', required: false },
  { id: 'domicile', name: 'Domicile Certificate', required: false },
  { id: 'marksheet10', name: 'Mark Sheet (Class 10)', required: true },
  { id: 'marksheet12', name: 'Mark Sheet (Class 12)', required: false },
  { id: 'bankPassbook', name: 'Bank Passbook', required: true },
  { id: 'photo', name: 'Passport Photo', required: false },
];

export default function DocumentsPage() {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [documents, setDocuments] = useState<Record<string, UserDocument>>({});
  const [viewingDoc, setViewingDoc] = useState<{ type: string; doc: UserDocument } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router, isConfigured]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/profile?uid=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setProfileComplete(data.profile?.isComplete || false);
          
          const docsMap: Record<string, UserDocument> = {};
          const documentsArray = Array.isArray(data.documents) ? data.documents : [];
          documentsArray.forEach((doc: UserDocument) => {
            docsMap[doc.type] = doc;
          });
          setDocuments(docsMap);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleUpload = async (docType: string, file: File) => {
    if (!user) return;
    
    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.uid);
      formData.append('documentType', docType);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(prev => ({
          ...prev,
          [docType]: data.document
        }));
        toast.success('Document uploaded successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload document. Please try again.');
      console.error(error);
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (docType: string) => {
    if (!user) return;
    
    setDeleting(docType);
    try {
      const response = await fetch('/api/documents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, documentType: docType }),
      });

      if (response.ok) {
        setDocuments(prev => {
          const newDocs = { ...prev };
          delete newDocs[docType];
          return newDocs;
        });
        toast.success('Document deleted successfully!');
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast.error('Failed to delete document. Please try again.');
      console.error(error);
    } finally {
      setDeleting(null);
    }
  };

  const handleView = (docType: string) => {
    const doc = documents[docType];
    if (doc) {
      setViewingDoc({ type: docType, doc });
    }
  };

  const uploadedCount = Object.keys(documents).length;
  const requiredCount = requiredDocumentTypes.filter(d => d.required).length;
  const requiredUploaded = requiredDocumentTypes.filter(
    d => d.required && documents[d.id]
  ).length;
  const completionPercent = requiredCount > 0 
    ? Math.round((requiredUploaded / requiredCount) * 100) 
    : 0;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Configuration Required</CardTitle>
            <CardDescription>
              Firebase is not configured. Please set up environment variables.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Document Vault
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Upload your documents once, auto-fill applications everywhere
        </p>
      </div>

      {/* Profile Incomplete Alert */}
      {!profileComplete && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Complete Your Profile First</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Complete your profile before uploading documents for better organization.
              </p>
            </div>
            <Link href="/dashboard/profile">
              <Button className="gap-2">
                Complete Profile <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Document Completion Status
          </CardTitle>
          <CardDescription>
            Complete your document vault to increase your scholarship match rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {requiredUploaded} of {requiredCount} required documents uploaded
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {completionPercent}%
              </span>
            </div>
            <Progress value={completionPercent} className="mt-2" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {requiredDocumentTypes.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center gap-2 rounded-lg border p-3 ${
                  documents[doc.id]
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                {documents[doc.id] ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400" />
                )}
                <span
                  className={`text-sm flex-1 ${
                    documents[doc.id]
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {doc.name}
                  {doc.required && !documents[doc.id] && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Our OCR technology will automatically extract information from your documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requiredDocumentTypes.map((docType) => (
              <div
                key={docType.id}
                className={`rounded-lg border p-4 ${
                  documents[docType.id]
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                    : 'border-dashed'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {docType.name}
                    </h4>
                    {docType.required && (
                      <span className="text-xs text-red-500">Required</span>
                    )}
                  </div>
                  {documents[docType.id] && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>

                {documents[docType.id] ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {documents[docType.id].name}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 gap-1"
                        onClick={() => handleView(docType.id)}
                      >
                        <Eye className="h-3 w-3" /> View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(docType.id)}
                        disabled={deleting === docType.id}
                      >
                        {deleting === docType.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor={`upload-${docType.id}`} className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        {uploading === docType.id ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        ) : (
                          <Upload className="h-8 w-8 text-slate-400 mb-2" />
                        )}
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {uploading === docType.id ? 'Uploading...' : 'Click to upload'}
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                          PDF, JPG, PNG (max 5MB)
                        </span>
                      </div>
                    </Label>
                    <Input
                      id={`upload-${docType.id}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={uploading !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUpload(docType.id, file);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Document Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingDoc ? requiredDocumentTypes.find(d => d.id === viewingDoc.type)?.name : 'Document'}
            </DialogTitle>
            <DialogDescription>
              {viewingDoc?.doc.name}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {viewingDoc?.doc.fileUrl && (
              viewingDoc.doc.fileUrl.startsWith('data:application/pdf') || 
              viewingDoc.doc.fileUrl.endsWith('.pdf') ? (
                <iframe
                  src={viewingDoc.doc.fileUrl}
                  className="w-full h-[500px] rounded-lg border"
                  title="Document Preview"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewingDoc.doc.fileUrl}
                  alt="Document Preview"
                  className="max-w-full h-auto rounded-lg mx-auto"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
