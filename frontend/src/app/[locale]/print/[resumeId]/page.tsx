'use client';

import React, { useEffect, useState } from 'react';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { getResume } from '@/lib/api';
import { useParams, useSearchParams } from 'next/navigation';

export default function PrintPage() {
  const { resumeId } = useParams();
  const searchParams = useSearchParams();
  const template = searchParams.get('template') as any || 'modern-2col';
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getResume(resumeId as string);
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to load resume for printing', error);
      }
    };
    fetchData();
  }, [resumeId]);

  useEffect(() => {
    if (data) {
      // Small timeout to ensure content is fully rendered before dialog opens
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="bg-white">
      <ResumePreview data={data} template={template} />
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body { 
            background: white !important;
            margin: 0;
            padding: 0;
          }
          nav, button, footer { display: none !important; }
        }
      `}</style>
    </div>
  );
}
