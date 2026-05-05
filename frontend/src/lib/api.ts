import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1/',
  timeout: 300000, // 5 min timeout — local Ollama can take time
});

export const getHealth = () => api.get('health');
export const getConfig = () => api.get('config');
export const updateConfig = (config: any) => api.post('config', config);

export const uploadResume = (file: File, sessionId: string) => {
  const formData = new FormData();
  formData.append('file', file);
  // 5 min timeout for upload — local Gemma4 (9.6GB) needs time to process
  return api.post(`resumes/upload?session_id=${sessionId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  });
};

export const listResumes = (sessionId: string) => api.get(`resumes/?session_id=${sessionId}`);
export const getResume = (id: string) => api.get(`resumes/${id}/`);
export const deleteResume = (id: string) => api.delete(`resumes/${id}/`);
export const updateResume = (id: string, data: any) => api.put(`resumes/${id}/`, { data });

export const generateMatch = (resumeId: string, jobDescription: string) => 
  api.post('improvements/match/', { resume_id: resumeId, job_description: jobDescription });

export const confirmMatch = (improvementId: string, previewHash: string) =>
  api.post('improvements/confirm/', { improvement_id: improvementId, preview_hash: previewHash });

export const getStats = (sessionId: string) => api.get(`stats/?session_id=${sessionId}`);

export default api;
