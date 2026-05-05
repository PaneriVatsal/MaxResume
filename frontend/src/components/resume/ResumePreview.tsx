'use client';

import React from 'react';
import DOMPurify from 'dompurify';

interface ResumePreviewProps {
  data: any;
  template?: 'classic' | 'modern' | 'classic-2col' | 'modern-2col';
}

export const ResumePreview = ({ data, template = 'classic' }: ResumePreviewProps) => {
  if (!data) return <div className="p-8 text-center bg-white border-2 border-dashed border-black uppercase font-black">No resume data to preview</div>;

  const { personalInfo, summary, workExperience, education, technicalSkills, projects, certifications } = data;
  const isModern = template.includes('modern');
  const isTwoColumn = template.includes('2col');

  const clean = (html: string) => {
    if (typeof window === 'undefined') return html;
    return DOMPurify.sanitize(html);
  };

  return (
    <div className="bg-white text-black shadow-brutalist-xl mx-auto overflow-hidden print:shadow-none font-sans" id="resume-preview" style={{ width: '210mm', minHeight: '297mm', padding: '8mm 10mm' }}>
      {/* Header */}
      <header className="text-center border-b-4 border-black pb-2 mb-2">
        <h1 className="text-3xl font-space font-black uppercase tracking-tighter mb-1">{personalInfo?.name || 'Untitled'}</h1>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 text-[10px] font-black uppercase tracking-tight">
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && <span>{personalInfo.phone}</span>}
          {personalInfo?.location && <span>{personalInfo.location}</span>}
        </div>
        <div className="mt-1 flex flex-wrap justify-center gap-x-4">
          {(personalInfo?.links ?? []).map((link: string, idx: number) => (
            <a key={idx} href={link} target="_blank" className="text-[9px] font-mono font-bold text-hyper-blue underline hover:text-black transition-colors">{link}</a>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <div className={isTwoColumn ? "grid grid-cols-[1fr_240px] gap-6" : "space-y-4"}>
        
        {/* Main Column */}
        <div className="space-y-4">
          {/* Summary */}
          {summary && (
            <section>
              <h2 className="font-space font-black uppercase text-[10px] tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-1.5">Professional Summary</h2>
              <div className="text-[11px] leading-snug italic text-gray-800 font-medium" dangerouslySetInnerHTML={{ __html: clean(summary) }} />
            </section>
          )}

          {/* Experience */}
          <section>
            <h2 className="font-space font-black uppercase text-[10px] tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-2">Work Experience</h2>
            <div className="space-y-3.5">
              {(workExperience ?? []).map((exp: any, idx: number) => (
                <div key={idx} className="relative group">
                  <div className="flex justify-between items-baseline mb-0">
                    <h3 className="font-black text-[12px] uppercase tracking-tight">{exp.role}</h3>
                    <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-tighter">{exp.dates}</span>
                  </div>
                  <p className="text-[10px] font-black italic mb-1 text-hyper-blue">{exp.company}</p>
                  <ul className="list-disc list-outside ml-3.5 space-y-0.5">
                    {(exp.descriptions ?? []).map((desc: string, i: number) => (
                      <li key={i} className="text-[10px] leading-tight pl-0.5 font-medium" dangerouslySetInnerHTML={{ __html: clean(desc) }} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section>
            <h2 className="font-space font-black uppercase text-[10px] tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-2">Selected Projects</h2>
            <div className="space-y-2.5">
              {(projects ?? []).map((project: any, idx: number) => (
                <div key={idx} className="border-l-4 border-black pl-3">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-black text-[10.5px] uppercase tracking-tight">{project.name}</h3>
                    {project.link && <a href={project.link} className="text-[8px] font-mono font-black text-hyper-blue underline uppercase">View Project</a>}
                  </div>
                  <p className="text-[10px] leading-snug text-gray-700 font-medium">{project.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        {isTwoColumn ? (
          <aside className="space-y-5 border-l-4 border-black pl-6">
            {/* Skills */}
            <section>
              <h2 className={`font-space font-black uppercase text-[9px] tracking-widest ${isModern ? 'bg-hyper-blue' : 'bg-black'} text-white px-2 py-0.5 inline-block mb-3`}>Tech Stack</h2>
              <div className="flex flex-wrap gap-1">
                {(technicalSkills ?? []).map((skill: string, idx: number) => (
                  <span key={idx} className="bg-white border border-black px-1 py-0.5 text-[8px] font-mono font-black">{skill}</span>
                ))}
              </div>
            </section>

            {/* Certifications */}
            {certifications && certifications.length > 0 && (
              <section>
                <h2 className={`font-space font-black uppercase text-[9px] tracking-widest ${isModern ? 'bg-hyper-blue' : 'bg-black'} text-white px-2 py-0.5 inline-block mb-3`}>Certs</h2>
                <div className="space-y-2">
                  {(certifications ?? []).map((cert: any, idx: number) => (
                    <div key={idx} className="space-y-0.5 border-b border-gray-100 pb-1.5">
                      <p className="font-black text-[10px] leading-tight uppercase tracking-tight">{cert.name}</p>
                      <p className="text-[9px] font-mono font-bold text-gray-500 uppercase">{cert.issuer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            <section>
              <h2 className={`font-space font-black uppercase text-[9px] tracking-widest ${isModern ? 'bg-hyper-blue' : 'bg-black'} text-white px-2 py-0.5 inline-block mb-3`}>Education</h2>
              <div className="space-y-4">
                {(education ?? []).map((edu: any, idx: number) => (
                  <div key={idx} className="space-y-0.5">
                    <h3 className="font-black text-[10px] uppercase leading-tight tracking-tight">{edu.institution}</h3>
                    <p className="text-[9px] italic font-bold text-hyper-blue">{edu.degree}</p>
                    <p className="text-[8px] font-mono font-black text-gray-400 uppercase">{edu.dates}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        ) : (
          /* Single Column (Classic) Bottom Flow */
          <div className="space-y-4 pt-3 border-t-4 border-black">
            <section>
              <h2 className="font-space font-black uppercase text-[10px] tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-2">Tech Stack</h2>
              <div className="flex flex-wrap gap-1">
                {(technicalSkills ?? []).map((skill: string, idx: number) => (
                  <span key={idx} className="bg-white border-2 border-black px-1.5 py-0.5 text-[9px] font-mono font-black">{skill}</span>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-space font-black uppercase text-[10px] tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-2">Education</h2>
              <div className="grid grid-cols-2 gap-4">
                {(education ?? []).map((edu: any, idx: number) => (
                  <div key={idx} className="space-y-0.5">
                    <h3 className="font-black text-[11px] uppercase tracking-tight">{edu.institution}</h3>
                    <p className="text-[10px] italic font-bold text-hyper-blue">{edu.degree}</p>
                    <p className="text-[9px] font-mono font-black text-gray-400 uppercase">{edu.dates}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
