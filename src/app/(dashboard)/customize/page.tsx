'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  LayoutTemplate, 
  Layers, 
  Mail, 
  CheckCircle2, 
  Upload, 
  Layout, 
  Eye,
  Type,
  ImageIcon,
  Droplets,
  Settings2,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useAgencyStore } from '@/lib/store/agencyStore';
import { AgencyBranding } from '@/types/report';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Scaffold } from '@/components/layout/Scaffold';

export default function CustomizePage() {
  const [activeTab, setActiveTab] = useState('branding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { branding, setBranding } = useAgencyStore();
  
  const defaultBranding: AgencyBranding = {
    primary_color: '#0f172a',
    secondary_color: '#ffffff',
    accent_color: '#6366f1',
    logo_url: null,
    logo_position: 'top-left',
    report_font: 'Inter',
    report_font_size: 'medium',
    metric_density: 'standard',
    report_layout: 'standard',
    watermark_text: 'CONFIDENTIAL',
    watermark_enabled: false,
    show_powered_by: true,
    pdf_sections: ['cover', 'summary', 'metrics', 'conclusion'],
    email_html: '<h1>Report Ready</h1>',
    email_css: 'body { font-family: sans-serif; }'
  };

  const [brand, setBrand] = useState<AgencyBranding>(branding || defaultBranding);

  useEffect(() => {
    if (branding) {
      setBrand(branding);
    }
  }, [branding]);

  useEffect(() => {
    async function fetchBranding() {
      try {
        const res = await fetch('/api/agencies/branding');
        if (res.ok) {
          const data = await res.json();
          if (data && data.data) {
            setBranding(data.data);
          }
        }
      } catch {
        toast.error('Failed to load branding settings');
      } finally {
        setLoading(false);
      }
    }
    fetchBranding();
  }, [setBranding]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/agencies/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand)
      });
      if (res.ok) {
        const updated = await res.json();
        setBranding(updated.data || updated);
        toast.success('Enterprise profile synchronized');
      } else {
        const _resErr = await res.json();
        toast.error(_resErr.error || 'Sync failed');
      }
    } catch {
      toast.error('Network protocol error');
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (type: 'primary' | 'secondary' | 'accent', value: string) => {
    setBrand(prev => ({ ...prev, [`${type}_color`]: value }));
  };

  const suggestAccent = () => {
    if (!brand.primary_color) return;
    const color = brand.primary_color.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    const lighten = (c: number) => Math.min(255, Math.floor(c + (255 - c) * 0.85)).toString(16).padStart(2, '0');
    const newAccent = `#${lighten(r)}${lighten(g)}${lighten(b)}`;
    setBrand(prev => ({ ...prev, accent_color: newAccent }));
    toast.success('Accent color optimized for accessibility');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) fileInputRef.current.value = '';

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'logo');

    try {
      const res = await fetch('/api/agencies/branding/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        setBrand(prev => ({ ...prev, logo_url: url }));
        toast.success('Agency signature updated');
      } else {
        const _resErr = await res.json();
        toast.error(_resErr.error || 'Transmission failed');
      }
    } catch {
      toast.error('Network interruption during upload');
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'branding', icon: Palette, label: 'Identity & Style' },
    { id: 'watermark', icon: Droplets, label: 'Security' },
    { id: 'layout', icon: LayoutTemplate, label: 'Layout' },
    { id: 'sections', icon: Layers, label: 'Modules' },
    { id: 'email', icon: Mail, label: 'Delivery' },
  ];

  const logoPositions = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'center', label: 'Center' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];


  const actions = (
    <Button
      onClick={handleSave}
      disabled={saving}
      className="h-9 px-4 font-bold shadow-sm flex items-center gap-2"
    >
      {saving ? <RotateCcw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
      {saving ? 'Syncing...' : 'Save Configuration'}
    </Button>
  );

  return (
    <Scaffold
      title="Customize"
      description="Configure your agency's branding, report layout, and delivery settings."
      actions={actions}
    >
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left: Navigation & Forms */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sub-navigation */}
            <div className="w-full md:w-48 shrink-0">
              <nav className="flex flex-col gap-0.5 sticky top-6">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all text-left",
                        isActive 
                          ? "bg-surface-200 text-foreground" 
                          : "text-foreground-muted hover:text-foreground hover:bg-surface-100"
                      )}
                    >
                      <Icon size={14} className={cn("shrink-0", isActive ? "text-foreground" : "text-foreground-subtle")} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Form Area */}
            <div className="flex-1 space-y-10 min-w-0">
              {activeTab === 'branding' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Logo Section */}
                  <section className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-base font-medium text-foreground">Logo</h3>
                      <p className="text-sm text-foreground-muted">Upload your organization logo for report headers.</p>
                    </div>
                    
                    <div className="bg-white border border-border rounded-xl p-6 md:p-8">
                      <div className="flex flex-col sm:flex-row gap-8 items-start">
                        <div 
                          className="w-40 h-40 shrink-0 rounded-xl border border-border bg-surface-200 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer transition-all hover:bg-surface-300 shadow-sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {brand.logo_url ? (
                            <Image src={brand.logo_url} alt="Logo" fill className="object-contain p-6" />
                          ) : (
                            <div className="flex flex-col items-center text-slate-400">
                              <Upload size={24} className="mb-2" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Upload Logo</span>
                            </div>
                          )}
                          {uploading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                               <RotateCcw size={20} className="animate-spin text-slate-900" />
                            </div>
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />

                        <div className="flex-1 space-y-6 w-full">
                          <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logo Placement</label>
                            <div className="flex flex-wrap gap-2">
                              {logoPositions.map(pos => (
                                <button
                                  key={pos.id}
                                  onClick={() => setBrand({ ...brand, logo_position: pos.id })}
                                  className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all",
                                    brand.logo_position === pos.id 
                                      ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                                      : "bg-white text-slate-600 border-border hover:border-slate-400"
                                  )}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-4 border border-border text-[12px] text-slate-500 leading-relaxed font-medium">
                            Use high-resolution transparent PNG or SVG for optimal quality.
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Colors Section */}
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-base font-medium text-foreground">Colors</h3>
                        <p className="text-sm text-foreground-muted">Primary and accent colors for document styling.</p>
                      </div>
                      <button 
                        onClick={suggestAccent}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-200 text-foreground text-[10px] font-medium uppercase tracking-wider hover:bg-surface-300 transition-all border border-border"
                      >
                        <Sparkles size={12} />
                        Optimize
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { key: 'primary', label: 'Primary Brand' },
                        { key: 'secondary', label: 'Canvas Layer' },
                        { key: 'accent', label: 'Highlight' }
                      ].map(type => (
                        <div key={type.key} className="bg-surface-100 border border-border rounded-xl p-4 space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{type.label}</label>
                          <div className="flex items-center gap-3 p-1.5 rounded-lg border border-border bg-white shadow-sm focus-within:ring-2 focus-within:ring-slate-900/5 transition-all">
                            <div className="relative w-8 h-8 rounded border border-border overflow-hidden shrink-0">
                              <input
                                type="color"
                                value={(brand as any)[`${type.key}_color`] || '#000000'}
                                onChange={(e) => handleColorChange(type.key as any, e.target.value)}
                                className="absolute -inset-4 w-[200%] h-[200%] cursor-pointer border-none p-0 bg-transparent"
                              />
                            </div>
                            <input
                              type="text"
                              value={(brand as any)[`${type.key}_color`] || '#000000'}
                              onChange={(e) => handleColorChange(type.key as any, e.target.value.toUpperCase())}
                              className="flex-1 bg-transparent border-none text-[13px] font-mono font-bold uppercase focus:ring-0 p-0 text-slate-900"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-base font-medium text-foreground">Typography</h3>
                      <p className="text-sm text-foreground-muted">Configure global document fonts and attribution.</p>
                    </div>
                    <div className="bg-white border border-border rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Font Engine</label>
                        <select
                          value={brand.report_font || 'Inter'}
                          onChange={(e) => setBrand({ ...brand, report_font: e.target.value })}
                          className="w-full h-10 px-4 rounded-lg border border-border text-[13px] font-semibold bg-white focus:ring-2 focus:ring-slate-900/5 outline-none transition-all cursor-pointer text-slate-900"
                        >
                          <option value="Inter">Inter (High-Density Baseline)</option>
                          <option value="Helvetica">Helvetica (Standard Enterprise)</option>
                          <option value="Georgia">Georgia (Classic Narrative)</option>
                          <option value="Playfair Display">Playfair (Premium Executive)</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between p-3.5 px-4 rounded-lg bg-white border border-border shadow-sm">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-900">White-Label Mode</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60 text-[8px]">Remove Attribution</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={brand.show_powered_by} onChange={(e) => setBrand({...brand, show_powered_by: e.target.checked})} />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                        </label>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'watermark' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <section className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-base font-medium text-foreground">Watermark</h3>
                      <p className="text-sm text-foreground-muted">Protect intellectual property with custom overlays.</p>
                    </div>

                    <div className="bg-white border border-border rounded-xl p-6 space-y-6">
                      <div className="flex items-center justify-between p-4 px-5 rounded-lg bg-white border border-border shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-50 border border-border text-slate-600 rounded-lg shrink-0">
                            <Droplets size={18} />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-slate-900">Enable Watermark Policy</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">Global overlay protection</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={brand.watermark_enabled} onChange={(e) => setBrand({...brand, watermark_enabled: e.target.checked})} />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                        </label>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Watermark Signal (Text)</label>
                        <Input
                          placeholder="CONFIDENTIAL"
                          value={brand.watermark_text || ''}
                          onChange={(e) => setBrand({ ...brand, watermark_text: e.target.value })}
                          className="h-10 px-4 text-sm font-medium bg-white border-border focus:ring-1 focus:ring-slate-900/5 transition-all text-slate-900"
                        />
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <section className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-base font-medium text-foreground">Layout</h3>
                      <p className="text-sm text-foreground-muted">Define the structural baseline for generated reports.</p>
                    </div>

                    <div className="bg-white border border-border rounded-xl p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        {[
                          { id: 'standard', name: 'Strategic', desc: 'Granular, multi-page dive.' },
                          { id: 'compact', name: 'Velocity', desc: 'High-density, rapid speed.' },
                          { id: 'executive', name: 'Decision', desc: 'Single-page highlight reel.' }
                        ].map(layout => (
                          <button
                            key={layout.id}
                            onClick={() => setBrand({ ...brand, report_layout: layout.id as any })}
                            className={cn(
                              "flex flex-col text-left p-4 rounded-xl border transition-all",
                              brand.report_layout === layout.id 
                                ? "border-slate-900 bg-white text-slate-900 shadow-sm" 
                                : "border-border bg-white text-slate-500 hover:border-slate-400"
                            )}
                          >
                            <div className={cn(
                               "w-8 h-8 rounded-lg flex items-center justify-center mb-4 transition-colors",
                               brand.report_layout === layout.id ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400"
                            )}>
                               <LayoutTemplate size={16} />
                            </div>
                            <p className="text-xs font-bold">{layout.name}</p>
                            <p className="text-[10px] font-semibold mt-1 opacity-60 leading-normal">{layout.desc}</p>
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Global Scaling</label>
                          <select
                            value={brand.report_font_size || 'medium'}
                            onChange={(e) => setBrand({ ...brand, report_font_size: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-border text-xs font-bold bg-white outline-none cursor-pointer text-slate-900"
                          >
                            <option value="small">Small (Extreme Density)</option>
                            <option value="medium">Medium (Standard)</option>
                            <option value="large">Large (High Access)</option>
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Information Density</label>
                          <select
                            value={brand.metric_density || 'standard'}
                            onChange={(e) => setBrand({ ...brand, metric_density: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-border text-xs font-bold bg-white outline-none cursor-pointer text-slate-900"
                          >
                            <option value="standard">Standard (Strategic)</option>
                            <option value="high">High (Data Native)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'sections' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <section className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-base font-medium text-foreground">Modules</h3>
                      <p className="text-sm text-foreground-muted">Toggle active sections within the generation pipeline.</p>
                    </div>

                    <div className="bg-white border border-border rounded-xl p-6 space-y-3">
                      {[
                        { id: 'cover', name: 'Identity Header', desc: 'Agency branding and period metadata.' },
                        { id: 'summary', name: 'Strategic Brief', desc: 'AI-distilled performance narrative.' },
                        { id: 'google_ads', name: 'Search Engine Intel', desc: 'Google Ads efficiency metrics.' },
                        { id: 'meta_ads', name: 'Social Graph Analysis', desc: 'Meta Ads creative density.' },
                        { id: 'ga4', name: 'User Flow Analytics', desc: 'Traffic origin and site density.' },
                        { id: 'conclusion', name: 'Tactical Roadmap', desc: 'Strategic recommendations.' }
                      ].map(section => {
                        const isActive = (brand.pdf_sections || []).includes(section.id as any);
                        return (
                          <div 
                            key={section.id}
                            className={cn(
                              "flex items-center justify-between p-4 px-5 rounded-xl border transition-all",
                              isActive ? "bg-white border-slate-900 shadow-sm" : "bg-white/50 border-border opacity-60 hover:opacity-100"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                 "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                 isActive ? "bg-slate-900 text-white shadow-sm" : "bg-slate-50 text-slate-400"
                              )}>
                                 <Layers size={16} />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                 <p className="text-xs font-bold text-slate-900 truncate">{section.name}</p>
                                 <p className="text-[10px] font-semibold text-slate-500 truncate">{section.desc}</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-4">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={isActive} 
                                onChange={(e) => {
                                  const sections = brand.pdf_sections || [];
                                  if (e.target.checked) {
                                    setBrand({ ...brand, pdf_sections: [...sections, section.id as any] });
                                  } else {
                                    setBrand({ ...brand, pdf_sections: sections.filter(s => s !== section.id) });
                                  }
                                }} 
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <section className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-base font-medium text-foreground">Delivery</h3>
                      <p className="text-sm text-foreground-muted">Configure outbound email templates and styling.</p>
                    </div>

                    <div className="bg-white border border-border rounded-xl p-6 gap-6 grid grid-cols-1">
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HTML Template</label>
                            <textarea
                              value={brand.email_html || ''}
                              onChange={(e) => setBrand({ ...brand, email_html: e.target.value })}
                              className="w-full h-48 px-4 py-3 rounded-lg border border-border text-[12px] font-mono focus:ring-1 focus:ring-slate-900/5 outline-none transition-all resize-none bg-white text-slate-900 shadow-sm"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CSS Styles</label>
                            <textarea
                              value={brand.email_css || ''}
                              onChange={(e) => setBrand({ ...brand, email_css: e.target.value })}
                              className="w-full h-32 px-4 py-3 rounded-lg border border-border text-[12px] font-mono focus:ring-1 focus:ring-slate-900/5 outline-none transition-all resize-none bg-white text-slate-900 shadow-sm"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-6 shadow-xl flex flex-col min-h-[400px]">
                           <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <Eye size={12} /> Preview
                              </span>
                              <div className="flex gap-1">
                                 <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                 <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                 <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                              </div>
                           </div>
                           <div className="flex-1 rounded-xl bg-white overflow-hidden shadow-inner p-4 text-[13px]">
                              <iframe
                                title="Email Preview"
                                srcDoc={`<html><head><style>${brand.email_css}</style></head><body>${brand.email_html}</body></html>`}
                                className="w-full h-full border-none"
                              />
                           </div>
                        </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <aside className="hidden xl:block w-[400px] shrink-0">
          <div className="sticky top-6 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">Report Preview</h3>
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-surface-200 border border-border text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Live
              </div>
            </div>

            <div 
              className="w-full aspect-[1/1.414] bg-white border border-border-strong shadow-2xl rounded-sm overflow-hidden flex flex-col transition-all duration-500"
              style={{ fontFamily: brand.report_font || 'Inter' }}
            >
              {/* Report Header Preview */}
              <div 
                className="h-[35%] p-8 flex flex-col justify-end relative transition-colors duration-500" 
                style={{ backgroundColor: (brand.primary_color || '#0f172a') as string, color: (brand.secondary_color || '#ffffff') as string }}
              >
                <div className={cn(
                  "absolute p-6",
                  brand.logo_position === 'top-left' ? 'top-0 left-0' :
                  brand.logo_position === 'top-right' ? 'top-0 right-0' :
                  brand.logo_position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                  brand.logo_position === 'bottom-left' ? 'bottom-0 left-0' :
                  brand.logo_position === 'bottom-right' ? 'bottom-0 right-0' : 'top-0 left-0'
                )}>
                    {brand.logo_url && <Image src={brand.logo_url} height={20} width={20} className="w-5 h-5 object-contain opacity-40 brightness-0 invert" alt="Brand Logo" />}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-40 transition-colors" style={{ color: (brand.accent_color || '#000000') as string }}>Insights Report</p>
                  <h4 className="text-xl font-bold leading-tight">Strategic Growth Node</h4>
                  <div className="h-0.5 w-12 rounded-full bg-current opacity-20 mt-4" />
                </div>
              </div>

              {/* Report Body Preview */}
              <div className="flex-1 p-8 relative flex flex-col gap-6">
                {brand.watermark_enabled && brand.watermark_text && (
                  <div className="absolute inset-0 flex items-center justify-center rotate-[-35deg] pointer-events-none opacity-[0.03] select-none">
                    <span className="text-2xl font-black uppercase tracking-[1em] whitespace-nowrap">
                      {brand.watermark_text}
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="h-2 w-1/3 bg-slate-100 rounded-full" />
                  <div className="h-1.5 w-full bg-slate-50 rounded-full" />
                  <div className="h-1.5 w-full bg-slate-50 rounded-full" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 rounded-xl border border-border p-4 space-y-4 bg-slate-50/50">
                      <div className="h-1.5 w-1/2 bg-slate-200 rounded-full" />
                      <div className="h-4 w-3/4 rounded-lg bg-current opacity-[0.08]" style={{ backgroundColor: (brand.primary_color || '#000000') as string }} />
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-6 border-t border-border flex items-center justify-between opacity-30">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white">R</div>
                    <span className="text-[8px] font-bold tracking-widest uppercase">Entity Node</span>
                  </div>
                  {brand.show_powered_by && <span className="text-[6px] font-bold tracking-tighter uppercase">Powered by Reportly</span>}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-surface-100 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Preview Mode</h4>
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                Adaptive frame rendering with {brand.report_layout} layout and {brand.report_font} typography engine.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </Scaffold>
  );
}
