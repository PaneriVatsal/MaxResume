'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getConfig, updateConfig } from '@/lib/api';
import { Save, Shield, Globe, Cpu, Key } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const DEFAULT_MODELS: Record<string, string> = {
  ollama: 'gemma4:e2b',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
  gemini: 'gemini/gemini-2.5-flash',
  openrouter: 'openrouter/google/gemma-3-4b-it:free',
};

export default function SettingsPage() {
  const [config, setConfig] = useState<any>({
    llm_provider: 'mock',
    llm_model: '',
    openai_api_key: '',
    anthropic_api_key: '',
    gemini_api_key: '',
    openrouter_api_key: '',
    ollama_base_url: 'http://localhost:11434',
    generate_cover_letter: true,
    generate_outreach: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await getConfig();
        setConfig((prev: any) => ({ ...prev, ...response.data }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(config);
      showToast('Settings saved successfully. AI engine updated.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings. Check backend connection.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 space-y-12">
        <header className="border-b-8 border-black pb-8">
          <h1 className="text-6xl font-space font-black uppercase tracking-tighter">
            Settings
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mt-2">
            Configure your AI brain and system preferences.
          </p>
        </header>

        <div className="space-y-8">
          {/* LLM Config */}
          <section className="space-y-4">
            <h2 className="text-xl font-space font-black uppercase tracking-tight bg-black text-white px-2 inline-block flex items-center gap-2">
              <Cpu size={18} /> 01. Intelligence Engine
            </h2>
            <Card className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">LLM Provider</label>
                <select 
                  className="w-full border-2 border-black p-3 font-bold bg-white focus:ring-2 focus:ring-hyper-blue outline-none rounded-none"
                  value={config.llm_provider}
                  onChange={(e) => {
                    const provider = e.target.value;
                    setConfig({ 
                      ...config, 
                      llm_provider: provider,
                      llm_model: DEFAULT_MODELS[provider] || config.llm_model
                    });
                  }}
                >
                  <option value="mock">Mock (Testing Only)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="anthropic">Anthropic (Claude 3.5)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="openrouter">OpenRouter (Multi-model)</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>
              
              {config.llm_provider !== 'mock' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">LLM Model Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. gemma4:e2b, gpt-4o-mini, gemini/gemini-2.5-flash"
                    className="w-full border-2 border-black p-3 font-mono focus:ring-2 focus:ring-hyper-blue outline-none rounded-none"
                    value={config.llm_model || ''}
                    onChange={(e) => setConfig({ ...config, llm_model: e.target.value })}
                  />
                </div>
              )}

              {config.llm_provider !== 'mock' && config.llm_provider !== 'ollama' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Key size={14} /> API Key
                  </label>
                  <input 
                    type="password"
                    placeholder="Enter your API key..."
                    className="w-full border-2 border-black p-3 font-mono focus:ring-2 focus:ring-hyper-blue outline-none rounded-none"
                    value={config[`${config.llm_provider}_api_key`] || ''}
                    onChange={(e) => setConfig({ ...config, [`${config.llm_provider}_api_key`]: e.target.value })}
                  />
                </div>
              )}

              {config.llm_provider === 'ollama' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Ollama Base URL</label>
                  <input 
                    type="text"
                    className="w-full border-2 border-black p-3 font-mono focus:ring-2 focus:ring-hyper-blue outline-none rounded-none"
                    value={config.ollama_base_url}
                    onChange={(e) => setConfig({ ...config, ollama_base_url: e.target.value })}
                  />
                </div>
              )}
            </Card>
          </section>

          {/* Feature Toggles */}
          <section className="space-y-4">
            <h2 className="text-xl font-space font-black uppercase tracking-tight bg-black text-white px-2 inline-block flex items-center gap-2">
              <Globe size={18} /> 02. Preferences
            </h2>
            <Card className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center justify-between p-4 border-2 border-black">
                <span className="font-bold text-sm uppercase tracking-tight">Cover Letter Gen</span>
                <input 
                  type="checkbox" 
                  checked={config.generate_cover_letter}
                  onChange={(e) => setConfig({ ...config, generate_cover_letter: e.target.checked })}
                  className="w-6 h-6 accent-hyper-blue"
                />
              </div>
              <div className="flex items-center justify-between p-4 border-2 border-black">
                <span className="font-bold text-sm uppercase tracking-tight">Outreach Gen</span>
                <input 
                  type="checkbox" 
                  checked={config.generate_outreach}
                  onChange={(e) => setConfig({ ...config, generate_outreach: e.target.checked })}
                  className="w-6 h-6 accent-hyper-blue"
                />
              </div>
            </Card>
          </section>

          <Button 
            variant="primary" 
            size="lg" 
            className="w-full flex justify-center gap-4"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? 'Saving...' : (
              <>
                <Save size={24} />
                Save System Configuration
              </>
            )}
          </Button>

          <div className="bg-yellow-100 border-2 border-yellow-400 p-6 flex gap-4 items-start">
            <Shield className="text-yellow-600 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              <span className="font-bold block uppercase mb-1">Security Notice</span>
              API keys are stored locally in your <code>data/config.json</code> file. They are never sent to Max Resume servers. Always keep your local environment secure.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
