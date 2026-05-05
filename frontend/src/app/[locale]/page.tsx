'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { Upload, FileText, Plus, ArrowRight, Zap, Printer, Trash2 } from 'lucide-react';
import { listResumes, uploadResume, deleteResume, getStats } from '@/lib/api';
import { Link, useRouter } from '@/i18n/routing';
import { useToast } from '@/components/ui/Toast';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [backendAlive, setBackendAlive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const sessionId = 'default-user';
  const router = useRouter();
  const { showToast } = useToast();

  const [stats, setStats] = useState({ total_resumes: 0, total_matches: 0, success_rate: 0 });

  const fetchData = async () => {
    try {
      const [resumesRes, statsRes] = await Promise.all([
        listResumes(sessionId),
        getStats(sessionId)
      ]);
      setResumes(resumesRes.data);
      setStats(statsRes.data);
      setBackendAlive(true);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setBackendAlive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    console.log("DEBUG: Delete button clicked for ID:", id);
    e.preventDefault();
    e.stopPropagation();
    
    console.log("DEBUG: Proceeding with 1-click deletion (confirm bypassed)...");
    // 1. Instant Optimistic Update
    const originalResumes = [...resumes];
    setResumes((prev) => prev.filter(r => r.id !== id));
    
    try {
      console.log("DEBUG: Calling API deleteResume...");
      const res = await deleteResume(id);
      console.log("DEBUG: API Response:", res.data);
      showToast('Resume deleted successfully.', 'success');
    } catch (error: any) {
      console.error('DEBUG: Delete failed with error:', error.response?.data || error.message);
      showToast('Failed to delete resume. Reverting...', 'error');
      setResumes(originalResumes);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadResume(file, sessionId);
      const newResumeId = response.data.id;
      showToast('Resume parsed and ready for tailoring!', 'success');
      router.push(`/builder?id=${newResumeId}`);
    } catch (error) {
      console.error('Upload failed', error);
      showToast('Upload failed. Ensure backend is running and file is < 10MB.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 space-y-12">
        {/* Hero / Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black pb-8">
          <div className="space-y-2">
            <h1 className="text-6xl font-space font-black uppercase tracking-tighter leading-none">
              Control <br/> <span className="text-hyper-blue">Center</span>
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
                Your Professional Identity, Precision Engineered.
              </p>
              <div className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter shadow-brutalist-sm ${
                backendAlive ? 'bg-green-500 text-white' : 'bg-red-500 text-white animate-pulse'
              }`}>
                {backendAlive ? 'Backend: Active' : 'Backend: Disconnected'}
              </div>
            </div>
          </div>
          <div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.docx" 
              onChange={handleUpload}
            />
            <Button 
              variant="primary" 
              size="lg" 
              className="flex gap-2 items-center"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <span className="animate-spin mr-2">/</span>
              ) : (
                <Upload size={20} />
              )}
              {uploading ? 'Parsing AI...' : t('upload_button')}
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black text-white" padding="sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Resumes</span>
              <FileText size={16} className="text-hyper-blue" />
            </div>
            <div className="text-4xl font-space font-black mt-2">{stats.total_resumes}</div>
          </Card>
          <Card padding="sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Matches Generated</span>
              <Zap size={16} className="text-yellow-500" />
            </div>
            <div className="text-4xl font-space font-black mt-2">{stats.total_matches}</div>
          </Card>
          <Card padding="sm" className="bg-hyper-blue text-white">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Avg. Alignment</span>
              <ArrowRight size={16} />
            </div>
            <div className="text-4xl font-space font-black mt-2">{stats.success_rate}%</div>
          </Card>
        </div>

        {/* Resume List Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-space font-black uppercase tracking-tight italic underline decoration-hyper-blue decoration-4 underline-offset-4">
              My Master Resumes
            </h2>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-200 border-2 border-black" />)}
            </div>
          ) : resumes.length === 0 ? (
            <Card className="border-dashed flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 bg-gray-100 border-2 border-black rotate-3">
                <FileText size={48} className="text-gray-400" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500 max-w-xs">
                {t('empty_state')}
              </p>
              <Button variant="outline" size="sm">
                <Plus size={16} className="mr-2" />
                Initialize Master
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {resumes.map((resume) => (
                <Card 
                  key={resume.id}
                  className="hover:translate-x-[4px] hover:translate-y-[-4px] hover:shadow-brutalist-lg transition-all group"
                  padding="sm"
                >
                  <div className="flex justify-between items-center">
                    <Link href={`/builder?id=${resume.id}`} className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-black text-white group-hover:bg-hyper-blue transition-colors">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-space font-black uppercase tracking-tight truncate">
                            {resume.data?.personalInfo?.name ?? 'Untitled Resume'}
                          </h3>
                          <span className="text-[10px] font-mono text-gray-500">
                            ID: {resume.id.split('-')[0]} • Created {new Date(resume.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="flex gap-4 items-center">
                      {resume.is_master && (
                        <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 uppercase tracking-tighter shadow-brutalist-sm">
                          MASTER
                        </span>
                      )}
                      <div className="flex gap-2">
                        <Link href={`/print/${resume.id}`}>
                          <Button variant="outline" size="sm" className="p-2 h-auto">
                            <Printer size={18} />
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="p-2 h-auto text-red-600 hover:bg-red-500 hover:text-white"
                          onClick={(e) => handleDelete(e, resume.id)}
                        >
                          <Trash2 size={18} />
                        </Button>
                        <Link href={`/builder?id=${resume.id}`}>
                          <Button variant="primary" size="sm" className="p-2 h-auto">
                            <ArrowRight size={18} />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
