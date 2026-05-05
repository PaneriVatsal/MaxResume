'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DiffModal } from '@/components/resume/DiffModal';
import { listResumes, generateMatch, confirmMatch } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Wand2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { useRouter } from '@/i18n/routing';

export default function TailorPage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState<any>(null);
  const { showToast } = useToast();
  const [improvementId, setImprovementId] = useState('');
  const [previewHash, setPreviewHash] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await listResumes('default-user');
        setResumes(response.data);
        if (response.data.length > 0) setSelectedResume(response.data[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchResumes();
  }, []);

  const handleMatch = async () => {
    if (!selectedResume || !jobDescription) return;
    setLoading(true);
    try {
      const response = await generateMatch(selectedResume, jobDescription);
      setDiff(response.data.diff);
      setImprovementId(response.data.improvement_id);
      setPreviewHash(response.data.preview_hash);
    } catch (err) {
      console.error(err);
      alert('Failed to generate match. Check console.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const response = await confirmMatch(improvementId, previewHash);
      const newResumeId = response.data.tailored_resume_id;
      router.push(`/builder?id=${newResumeId}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to apply improvements. Check AI engine status.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 space-y-12">
        <header className="border-b-8 border-black pb-8">
          <h1 className="text-6xl font-space font-black uppercase tracking-tighter">
            Tailor <span className="text-hyper-blue">Resume</span>
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mt-2">
            Match your identity to the role with Swiss precision.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {/* Step 1: Select Resume */}
          <section className="space-y-4">
            <h2 className="text-xl font-space font-black uppercase tracking-tight bg-black text-white px-2 inline-block">01. Select Master</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {resumes.map((r) => (
                <Card 
                  key={r.id} 
                  padding="sm" 
                  className={`min-w-[200px] cursor-pointer transition-all ${selectedResume === r.id ? 'border-hyper-blue bg-blue-50 ring-2 ring-hyper-blue' : 'hover:border-gray-400'}`}
                  onClick={() => setSelectedResume(r.id)}
                >
                  <FileText className={selectedResume === r.id ? 'text-hyper-blue' : 'text-gray-400'} />
                  <p className="mt-2 font-bold text-sm truncate">{r.data.personalInfo.name}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Step 2: Job Description */}
          <section className="space-y-4">
            <h2 className="text-xl font-space font-black uppercase tracking-tight bg-black text-white px-2 inline-block">02. Job Description</h2>
            <Card padding="none" className="overflow-hidden">
              <textarea 
                className="w-full h-64 p-6 font-sans text-sm focus:outline-none bg-white resize-none"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <div className="p-4 bg-gray-50 border-t-2 border-black flex items-center gap-2">
                <AlertCircle size={16} className="text-yellow-600" />
                <p className="text-[10px] font-bold uppercase text-gray-500">Inputs are sanitized for prompt safety.</p>
              </div>
            </Card>
          </section>

          <Button 
            variant="primary" 
            size="lg" 
            className="w-full flex justify-center gap-4 py-8"
            disabled={loading || !selectedResume || !jobDescription}
            onClick={handleMatch}
          >
            {loading ? 'Analyzing Alignment...' : (
              <>
                <Wand2 size={24} />
                Generate Match Diffs
              </>
            )}
          </Button>
        </div>

        {diff && (
          <DiffModal 
            diffs={diff} 
            onConfirm={handleConfirm} 
            onClose={() => setDiff(null)} 
          />
        )}
      </main>
    </div>
  );
}
