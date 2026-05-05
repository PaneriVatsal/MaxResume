'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { ResumeEditor } from '@/components/resume/ResumeEditor';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { listResumes, getResume, updateResume } from '@/lib/api';
import { useSearchParams, useParams } from 'next/navigation';
import { Save, Download, Wand2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

// Null-safe helper: LLM may return null for optional fields, React inputs reject null.
const safe = (val: any): string => val ?? '';

// Migration helper: Ensures legacy data without IDs gets stable IDs for React keys
const migrateData = (data: any) => {
  if (!data) return data;
  const sections = ['workExperience', 'education', 'projects', 'certifications'];
  const newData = { ...data };
  
  sections.forEach(section => {
    if (newData[section] && Array.isArray(newData[section])) {
      newData[section] = newData[section].map((item: any, idx: number) => {
        if (typeof item === 'object' && item !== null && !item.id) {
          return { ...item, id: `migrated-${Date.now()}-${idx}` };
        }
        return item;
      });
    }
  });
  
  return newData;
};



export default function BuilderPage() {
  const params = useParams();
  const [resumeData, setResumeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const searchParams = useSearchParams();
  const resumeId = params.resumeId as string || searchParams.get('id');
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching resume data for ID:', resumeId);
        const targetId = resumeId;
        if (targetId) {
          const res = await getResume(targetId);
          console.log('Resume found:', res.data);
          setResumeData(migrateData(res.data.data));
        } else {
          console.log('No ID provided, fetching fallback master...');
          const listRes = await listResumes('default-user');
          if (listRes.data.length > 0) {
            const masterId = listRes.data[0].id;
            const masterData = listRes.data[0].data;
            
            // Sync URL with master ID to unlock Save button
            window.history.replaceState(null, '', `/${params.locale}/builder?id=${masterId}`);
            
            console.log('Fallback master found and URL synced:', masterId);
            setResumeData(migrateData(masterData));
          } else {
            console.warn('No resumes found in database.');
            // Give it a moment then redirect or show error
            setTimeout(() => {
              if (!resumeData) {
                showToast('No resume found. Redirecting to Dashboard to upload.', 'error');
                window.location.href = '/en';
              }
            }, 3000);
          }
        }
      } catch (err) {
        console.error('Failed to load resume:', err);
        showToast('Communication error with AI engine. Check if backend is running.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resumeId]);

  const handleUpdate = (field: string, value: any) => {
    setResumeData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleExperienceChange = (index: number, field: string, value: any) => {
    const updatedExp = [...resumeData.workExperience];
    updatedExp[index] = { ...updatedExp[index], [field]: value };
    handleUpdate('workExperience', updatedExp);
  };
  
  const addExperience = () => {
    const newExp = { id: Date.now().toString(), company: '', role: '', location: '', dates: '', descriptions: [''] };
    handleUpdate('workExperience', [...resumeData.workExperience, newExp]);
  };
  
  const removeExperience = (index: number) => {
    const updatedExp = resumeData.workExperience.filter((_: any, i: number) => i !== index);
    handleUpdate('workExperience', updatedExp);
  };

  const addEducation = () => {
    const newEdu = { id: Date.now().toString(), institution: '', degree: '', location: '', dates: '' };
    handleUpdate('education', [...resumeData.education, newEdu]);
  };

  const removeEducation = (index: number) => {
    const updatedEdu = resumeData.education.filter((_: any, i: number) => i !== index);
    handleUpdate('education', updatedEdu);
  };
  const addProject = () => {
    const newProj = { id: Date.now().toString(), name: '', description: '', link: '' };
    handleUpdate('projects', [...(resumeData.projects || []), newProj]);
  };

  const removeProject = (index: number) => {
    const updatedProj = resumeData.projects.filter((_: any, i: number) => i !== index);
    handleUpdate('projects', updatedProj);
  };

  const addCertification = () => {
    const newCert = { id: Date.now().toString(), name: '', issuer: '', date: '' };
    handleUpdate('certifications', [...(resumeData.certifications || []), newCert]);
  };

  const removeCertification = (index: number) => {
    const updatedCert = resumeData.certifications.filter((_: any, i: number) => i !== index);
    handleUpdate('certifications', updatedCert);
  };

  
  const addSkill = (skill: string) => {
    if (!skill || resumeData.technicalSkills.includes(skill)) return;
    handleUpdate('technicalSkills', [...resumeData.technicalSkills, skill]);
  };

  const removeSkill = (skill: string) => {
    handleUpdate('technicalSkills', resumeData.technicalSkills.filter((s: string) => s !== skill));
  };
  
  const handleSave = async () => {
    if (!resumeId) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      await updateResume(resumeId, resumeData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save:', err);
      showToast('Failed to save changes. Check backend connection.', 'error');
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      await updateResume(resumeId as string, resumeData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      window.open(`/${params.locale}/print/${resumeId}?template=${template}`, '_blank');
    } catch (err) {
      console.error('Failed to save before export:', err);
      showToast('Failed to sync before export. Check connection.', 'error');
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  const [template, setTemplate] = useState<'classic' | 'modern-2col'>('modern-2col');

  if (loading || !resumeData) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="font-space font-black uppercase text-2xl animate-pulse">
            {loading ? 'Synchronizing with AI...' : 'Resume Not Found'}
          </div>
          {!loading && (
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Return to Dashboard
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-canvas flex flex-col overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Editor Pane */}
        <div className="w-1/2 overflow-y-auto p-8 border-r-4 border-black">
          {/* ... (Editor content stays same) */}
          <div className="max-w-2xl mx-auto space-y-12 pb-24">
            <header className="flex justify-between items-end border-b-4 border-black pb-4">
              <div>
                <h1 className="text-4xl font-space font-black uppercase tracking-tighter">Builder</h1>
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Edit your master resume</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={saving || !resumeId}
                  className={saveStatus === 'saved' ? 'border-green-500 text-green-600' : ''}
                >
                  <Save size={16} className="mr-2"/>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
                </Button>
                <Button variant="primary" size="sm" onClick={handleExport}>
                  <Download size={16} className="mr-2"/>Export
                </Button>
              </div>
            </header>

            {/* Sections 01-07 remain same */}
            <section className="space-y-4">
              <h2 className="text-xl font-space font-black uppercase tracking-tight bg-black text-white px-2 inline-block">01. Personal Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    value={safe(resumeData.personalInfo?.name)} 
                    onChange={(e) => handleUpdate('personalInfo', { ...resumeData.personalInfo, name: e.target.value })}
                    className="w-full border-2 border-black p-2 font-bold focus:ring-2 focus:ring-hyper-blue outline-none rounded-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    value={safe(resumeData.personalInfo?.email)} 
                    onChange={(e) => handleUpdate('personalInfo', { ...resumeData.personalInfo, email: e.target.value })}
                    className="w-full border-2 border-black p-2 font-bold focus:ring-2 focus:ring-hyper-blue outline-none rounded-none"
                  />
                </div>
              </div>
                <div className="space-y-1 mt-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest">Social Links (LinkedIn, GitHub, etc.)</label>
                  <div className="flex flex-wrap gap-2">
                    {(resumeData.personalInfo?.links ?? []).map((link: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 bg-gray-100 border-2 border-black px-2 py-1 font-mono text-sm">
                        {link}
                        <button 
                          onClick={() => {
                            const newLinks = resumeData.personalInfo.links.filter((_: any, i: number) => i !== idx);
                            handleUpdate('personalInfo', { ...resumeData.personalInfo, links: newLinks });
                          }} 
                          className="text-red-500 font-bold ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <input 
                      type="text" 
                      placeholder="+ Paste LinkedIn, GitHub, or Portfolio URL (Press Enter)" 
                      className="w-full border-2 border-black border-dashed px-3 py-2 text-sm font-mono outline-none focus:border-solid focus:border-hyper-blue bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            const newLinks = [...(resumeData.personalInfo?.links || []), val];
                            handleUpdate('personalInfo', { ...resumeData.personalInfo, links: newLinks });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
            </section>

            {/* Summary Section */}
            <section className="space-y-4">
              <h2 className="text-xl font-space font-black uppercase tracking-tight bg-black text-white px-2 inline-block">02. Summary</h2>
              <ResumeEditor 
                content={resumeData.summary} 
                onChange={(content) => handleUpdate('summary', content)} 
              />
            </section>

            {/* Experience Section */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-space font-black uppercase tracking-tight bg-black text-white px-2 inline-block">03. Experience</h2>
                <Button variant="outline" size="sm" onClick={addExperience}>+ Add Job</Button>
              </div>
              <div className="space-y-8">
                {(resumeData.workExperience ?? []).map((exp: any, idx: number) => (
                  <Card key={exp.id || `exp-${idx}`} padding="sm" className="space-y-4 relative group">
                    <button 
                      onClick={() => removeExperience(idx)}
                      className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 border border-red-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                    >
                      Delete
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        className="font-bold border-b-2 border-black focus:border-hyper-blue outline-none bg-transparent"
                        placeholder="Role"
                        value={safe(exp.role)}
                        onChange={(e) => handleExperienceChange(idx, 'role', e.target.value)}
                      />
                      <input 
                        className="font-mono text-right text-xs outline-none bg-transparent"
                        placeholder="Dates"
                        value={safe(exp.dates)}
                        onChange={(e) => handleExperienceChange(idx, 'dates', e.target.value)}
                      />
                    </div>
                    <input 
                      className="w-full italic text-sm outline-none bg-transparent"
                      placeholder="Company"
                      value={safe(exp.company)}
                      onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)}
                    />
                    <ResumeEditor 
                      content={exp.descriptions[0]} 
                      onChange={(content) => {
                        const newDescs = [...exp.descriptions];
                        newDescs[0] = content;
                        handleExperienceChange(idx, 'descriptions', newDescs);
                      }} 
                    />
                  </Card>
                ))}
              </div>
            </section>

            {/* Skills Section */}
            <section className="space-y-4">
              <h2 className="text-xl font-space font-black uppercase tracking-tight bg-black text-white px-2 inline-block">04. Technical Skills</h2>
              <div className="flex flex-wrap gap-2">
                {(resumeData.technicalSkills ?? []).map((skill: string) => (
                  <div key={skill} className="flex items-center gap-1 bg-gray-100 border-2 border-black px-2 py-1 font-mono text-sm group">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="text-red-500 font-bold ml-1 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                ))}
                <input 
                  type="text" 
                  placeholder="+ Add Skill" 
                  className="border-2 border-black border-dashed px-2 py-1 text-sm font-mono outline-none focus:border-solid focus:border-hyper-blue w-24"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addSkill((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>
            </section>

            {/* Education Section */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-space font-black uppercase tracking-tight bg-black text-white px-2 inline-block">05. Education</h2>
                <Button variant="outline" size="sm" onClick={addEducation}>+ Add School</Button>
              </div>
              <div className="space-y-4">
                {(resumeData.education ?? []).map((edu: any, idx: number) => (
                  <Card key={edu.id || `edu-${idx}`} padding="sm" className="relative group">
                    <button 
                      onClick={() => removeEducation(idx)}
                      className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 border border-red-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                    >
                      Delete
                    </button>
                    <div className="space-y-3">
                      <div className="flex justify-between items-end gap-4">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Institution</label>
                          <input 
                            className="w-full font-bold border-b-2 border-black focus:border-hyper-blue outline-none bg-white"
                            value={safe(edu.institution)}
                            onChange={(e) => {
                              const newEdu = [...resumeData.education];
                              newEdu[idx] = { ...newEdu[idx], institution: e.target.value };
                              handleUpdate('education', newEdu);
                            }}
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right block">Dates</label>
                          <input 
                            className="w-full text-right font-mono text-xs outline-none bg-white"
                            value={safe(edu.dates)}
                            onChange={(e) => {
                              const newEdu = [...resumeData.education];
                              newEdu[idx] = { ...newEdu[idx], dates: e.target.value };
                              handleUpdate('education', newEdu);
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Degree / Program</label>
                        <input 
                          className="w-full italic text-sm outline-none bg-white border-b border-gray-100 focus:border-hyper-blue"
                          value={safe(edu.degree)}
                          onChange={(e) => {
                            const newEdu = [...resumeData.education];
                            newEdu[idx] = { ...newEdu[idx], degree: e.target.value };
                            handleUpdate('education', newEdu);
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Projects Section */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-space font-black uppercase tracking-tight bg-black text-white px-2 inline-block">06. Projects</h2>
                <Button variant="outline" size="sm" onClick={addProject}>+ Add Project</Button>
              </div>
              <div className="space-y-4">
                {(resumeData.projects ?? []).map((proj: any, idx: number) => (
                  <Card key={proj.id || `proj-${idx}`} padding="sm" className="relative group">
                    <button 
                      onClick={() => removeProject(idx)}
                      className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 border border-red-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                    >
                      Delete
                    </button>
                    <input 
                      className="w-full font-bold border-b-2 border-black mb-2 outline-none bg-white"
                      placeholder="Project Name"
                      value={safe(proj.name)}
                      onChange={(e) => {
                        const newProj = [...resumeData.projects];
                        newProj[idx] = { ...newProj[idx], name: e.target.value };
                        handleUpdate('projects', newProj);
                      }}
                    />
                    <input 
                      className="w-full text-[10px] font-mono text-hyper-blue mb-2 outline-none bg-white"
                      placeholder="Project URL (GitHub/Live Demo)"
                      value={safe(proj.link)}
                      onChange={(e) => {
                        const newProj = [...resumeData.projects];
                        newProj[idx] = { ...newProj[idx], link: e.target.value };
                        handleUpdate('projects', newProj);
                      }}
                    />
                    <textarea 
                      className="w-full text-sm outline-none bg-white resize-none"
                      placeholder="Description"
                      rows={3}
                      value={safe(proj.description)}
                      onChange={(e) => {
                        const newProj = [...resumeData.projects];
                        newProj[idx] = { ...newProj[idx], description: e.target.value };
                        handleUpdate('projects', newProj);
                      }}
                    />
                  </Card>
                ))}
              </div>
            </section>

            {/* Certifications Section */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-space font-black uppercase tracking-tight bg-black text-white px-2 inline-block">07. Certifications</h2>
                <Button variant="outline" size="sm" onClick={addCertification}>+ Add Cert</Button>
              </div>
              <div className="space-y-4">
                {(resumeData.certifications ?? []).map((cert: any, idx: number) => (
                  <Card key={cert.id || `cert-${idx}`} padding="sm" className="relative group">
                    <button 
                      onClick={() => removeCertification(idx)}
                      className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 border border-red-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                    >
                      Delete
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        className="font-bold border-b-2 border-black outline-none"
                        placeholder="Certification Name"
                        value={safe(cert.name)}
                        onChange={(e) => {
                          const newCert = [...resumeData.certifications];
                          newCert[idx] = { ...newCert[idx], name: e.target.value };
                          handleUpdate('certifications', newCert);
                        }}
                      />
                      <input 
                        className="text-right italic text-xs outline-none"
                        placeholder="Issuer (e.g. AWS, IIT Patna)"
                        value={safe(cert.issuer)}
                        onChange={(e) => {
                          const newCert = [...resumeData.certifications];
                          newCert[idx] = { ...newCert[idx], issuer: e.target.value };
                          handleUpdate('certifications', newCert);
                        }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right: Preview Pane */}
        <div className="w-1/2 bg-gray-200 overflow-y-auto p-12">
          <div className="sticky top-0 z-10 flex justify-center gap-4 mb-8">
            <button 
              onClick={() => setTemplate('classic')}
              className={`px-4 py-2 font-space font-black uppercase tracking-tight border-4 border-black transition-all ${template === 'classic' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
            >
              Classic (1-Col)
            </button>
            <button 
              onClick={() => setTemplate('modern-2col')}
              className={`px-4 py-2 font-space font-black uppercase tracking-tight border-4 border-black transition-all ${template === 'modern-2col' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
            >
              Modern (2-Col)
            </button>
          </div>
          <div className="shadow-brutalist-xl">
            <ResumePreview data={resumeData} template={template} />
          </div>
        </div>
      </main>
    </div>
  );
}
