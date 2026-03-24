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
    { id: 'branding', icon: Palette, label: 'Identity \u0026 Style' },
    { id: 'watermark', icon: Droplets, label: 'Digital Security' },
    { id: 'layout', icon: LayoutTemplate, label: 'Visual Hierarchy' },
    { id: 'sections', icon: Layers, label: 'Metric Modules' },
    { id: 'email', icon: Mail, label: 'Delivery Node' },
  ];

  const logoPositions = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'center', label: 'Center' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];


  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Syncing Profile...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full xl:flex-row gap-8 pb-10">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Customization Command</h1>
              <p className="text-[13px] font-medium text-slate-500 mt-1">
                Establish high-density branding protocols across all client nodes.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-11 px-6 rounded-xl text-[13px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-200 flex items-center gap-2"
            >
              {saving ? <RotateCcw size={16} className="animate-spin" /> : <Settings2 size={16} />}
              {saving ? 'Synchronizing...' : 'Save Configuration'}
            </button>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-8 w-fit overflow-x-auto no-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-[12px] font-bold rounded-lg transition-all whitespace-nowrap ${
                    isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-indigo-600' : ''} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            {activeTab === 'branding' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Logo Section */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                       <ImageIcon size={18} className="text-slate-400" />
                       Agency Signature
                    </h3>
                  </div>
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                     <div 
                       className="w-44 h-44 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer transition-all hover:border-slate-300"
                       onClick={() => fileInputRef.current?.click()}
                     >
                       {brand.logo_url ? (
                         <Image src={brand.logo_url} alt="Logo" fill className="object-contain p-6" />
                       ) : (
                         <div className="flex flex-col items-center text-slate-400">
                           <Upload size={24} className="mb-2" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Select Signal</span>
                         </div>
                       )}
                       {uploading && (
                         <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center">
                            <RotateCcw size={20} className="animate-spin text-slate-900" />
                         </div>
                       )}
                     </div>
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />

                     <div className="flex-1 space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-3">
                             <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Logo Alignment Grid</label>
                             <div className="flex flex-wrap gap-2">
                               {logoPositions.map(pos => (
                                 <button
                                   key={pos.id}
                                   onClick={() => setBrand({ ...brand, logo_position: pos.id })}
                                   className={`px-4 py-2 text-[11px] font-bold rounded-xl border transition-all ${
                                     brand.logo_position === pos.id 
                                       ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                                       : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                   }`}
                                 >
                                   {pos.label}
                                 </button>
                               ))}
                             </div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Specifications</p>
                             <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                               SVG or high-resolution PNG is mandatory for enterprise-grade PDF rendering. 
                               Recommended maximum height: 80px.
                             </p>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Colors Section */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                       <Palette size={18} className="text-slate-400" />
                       Brand Chromatics
                    </h3>
                    <button 
                      onClick={suggestAccent}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                    >
                      <Sparkles size={12} />
                      Magic Contrast
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { key: 'primary', label: 'Primary Brand' },
                      { key: 'secondary', label: 'Contrast Layer' },
                      { key: 'accent', label: 'Action Highlight' }
                    ].map(type => (
                      <div key={type.key} className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{type.label}</label>
                        <div className="flex items-center gap-3 p-1.5 pl-4 rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-slate-900 transition-all">
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-100">
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
                            className="flex-1 bg-transparent border-none text-[13px] font-mono font-bold uppercase focus:ring-0 p-0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 mb-6">
                     <Type size={18} className="text-slate-400" />
                     Typography & Standards
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Report Font Engine</label>
                       <select
                        value={brand.report_font || 'Inter'}
                        onChange={(e) => setBrand({ ...brand, report_font: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:border-slate-900 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="Inter">Inter (High-Density Baseline)</option>
                        <option value="Helvetica">Helvetica (Standard Enterprise)</option>
                        <option value="Georgia">Georgia (Classic Narrative)</option>
                        <option value="Playfair Display">Playfair (Premium Executive)</option>
                        <option value="Roboto">Roboto (Technical Grade)</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 border border-slate-100 self-end">
                      <div>
                        <p className="text-[13px] font-bold text-slate-900">White-Label Status</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Remove Reportly Attribution</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={brand.show_powered_by} onChange={(e) => setBrand({...brand, show_powered_by: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'watermark' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                   <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 mb-2">
                     <Droplets size={18} className="text-slate-400" />
                     Digital Asset Security
                  </h3>
                  <p className="text-[12px] font-medium text-slate-500 mb-8 border-b border-slate-100 pb-4">
                    Protect enterprise intellectual property with custom watermark overlays.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100">
                       <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-white shadow-sm border border-slate-100 text-slate-900 rounded-xl">
                             <CheckCircle2 size={18} />
                          </div>
                          <div>
                             <p className="text-[14px] font-bold text-slate-900">Enable Watermark Policy</p>
                             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Global overlay protection</p>
                          </div>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={brand.watermark_enabled} onChange={(e) => setBrand({...brand, watermark_enabled: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Policy Identifier (Text)</label>
                      <input
                        type="text"
                        placeholder="CONFIDENTIAL"
                        value={brand.watermark_text || ''}
                        onChange={(e) => setBrand({ ...brand, watermark_text: e.target.value })}
                        className="w-full h-12 px-5 rounded-xl border border-slate-200 text-[13px] font-bold focus:border-slate-900 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm h-fit">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 mb-6">
                      <Mail size={18} className="text-slate-400" />
                      Delivery Node Protocol
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">HTML Signal Template</label>
                        <textarea
                          value={brand.email_html || ''}
                          onChange={(e) => setBrand({ ...brand, email_html: e.target.value })}
                          className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 text-[12px] font-mono focus:border-slate-900 outline-none transition-all resize-none bg-slate-50"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Global Style CSS</label>
                        <textarea
                          value={brand.email_css || ''}
                          onChange={(e) => setBrand({ ...brand, email_css: e.target.value })}
                          className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 text-[12px] font-mono focus:border-slate-900 outline-none transition-all resize-none bg-slate-50"
                        />
                      </div>
                    </div>
                 </div>

                 <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-2xl flex flex-col min-h-[520px]">
                    <div className="flex items-center justify-between px-3 mb-6">
                       <div className="flex items-center gap-2.5">
                          <Eye size={14} className="text-slate-500" />
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Node Rendering Engine</span>
                       </div>
                       <div className="flex gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                       </div>
                    </div>
                    <div className="flex-1 rounded-2xl bg-white overflow-hidden border border-slate-800 shadow-inner">
                       <iframe
                         title="Email Preview"
                         srcDoc={`<html><head><style>${brand.email_css}</style></head><body>${brand.email_html}</body></html>`}
                         className="w-full h-full border-none"
                       />
                    </div>
                    <div className="mt-5 p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                         <Sparkles size={12} /> Macro Injection Logic
                       </p>
                       <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                         Integrate dynamic data using <code className="text-slate-300 font-black">{"{{client_name}}"}</code>, 
                         <code className="text-slate-300 font-black">{"{{period}}"}</code>, and 
                         <code className="text-slate-300 font-black">{"{{report_link}}"}</code> macros.
                       </p>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                   <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 mb-2">
                     <LayoutTemplate size={18} className="text-slate-400" />
                     Enterprise Hierarchy Grid
                  </h3>
                  <p className="text-[12px] font-medium text-slate-500 mb-8 border-b border-slate-100 pb-4">
                    Define the structural DNA for generated PDF intelligence nodes.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    {[
                      { id: 'standard', name: 'Strategic Full', desc: 'Granular, multi-page deep dive with nested analytics.' },
                      { id: 'compact', name: 'Velocity Modern', desc: 'High-density metrics optimized for executive speed.' },
                      { id: 'executive', name: 'Decision Brief', desc: 'Single-page highlight reel focusing on bottom-line KPIs.' }
                    ].map(layout => (
                      <button
                        key={layout.id}
                        onClick={() => setBrand({ ...brand, report_layout: layout.id as any })}
                        className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all ${
                          brand.report_layout === layout.id 
                            ? 'border-slate-900 bg-slate-50 shadow-md' 
                            : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${
                           brand.report_layout === layout.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                        }`}>
                           <LayoutTemplate size={20} />
                        </div>
                        <p className="text-[14px] font-bold text-slate-900">{layout.name}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-2 leading-relaxed">{layout.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Global Font Dimension</label>
                       <select
                        value={brand.report_font_size || 'medium'}
                        onChange={(e) => setBrand({ ...brand, report_font_size: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:border-slate-900 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="small">Small (Extreme Density)</option>
                        <option value="medium">Medium (Standard Enterprise)</option>
                        <option value="large">Large (High Accessibility)</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Metric Information Density</label>
                       <select
                        value={brand.metric_density || 'standard'}
                        onChange={(e) => setBrand({ ...brand, metric_density: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:border-slate-900 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="standard">Standard (Strategic)</option>
                        <option value="high">High (Data Native)</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'sections' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                   <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 mb-2">
                     <Layers size={18} className="text-slate-400" />
                     Active Module Registry
                  </h3>
                  <p className="text-[12px] font-medium text-slate-500 mb-8 border-b border-slate-100 pb-4">
                    Toggle and initialize specific analytics modules within the generation pipeline.
                  </p>

                  <div className="space-y-3">
                    {[
                      { id: 'cover', name: 'Identity Header', desc: 'Agency branding, client credentials, and period metadata.' },
                      { id: 'summary', name: 'Strategic Brief', desc: 'AI-distilled performance narrative and primary KPIs.' },
                      { id: 'google_ads', name: 'Search Engine Intel', desc: 'Google Ads efficiency, search intent, and conversion data.' },
                      { id: 'meta_ads', name: 'Social Graph Analysis', desc: 'Meta Ads creative density and cross-platform spend.' },
                      { id: 'ga4', name: 'User Flow Analytics', desc: 'Traffic origin, site interaction density, and GA4 events.' },
                      { id: 'conclusion', name: 'Tactical Roadmap', desc: 'Strategic recommendations and upcoming period objectives.' }
                    ].map(section => {
                      const isActive = (brand.pdf_sections || []).includes(section.id as any);
                      return (
                        <div 
                          key={section.id}
                          className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                            isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-5">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                               isActive ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-200 text-slate-400'
                            }`}>
                               <Layers size={18} />
                            </div>
                            <div>
                               <p className="text-[14px] font-bold text-slate-900">{section.name}</p>
                               <p className="text-[11px] font-medium text-slate-500">{section.desc}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
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
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Report View Preview */}
      <div className="hidden xl:flex flex-col w-[390px] border border-slate-200 rounded-3xl overflow-hidden bg-white self-start sticky top-6 shadow-2xl shadow-slate-200/50">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-[15px] font-black text-slate-900 leading-none">Global Preview</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 animate-pulse" />
               Logic Rendering
            </p>
          </div>
          <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-400">
             <Layout size={18} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          <div 
            className="w-full aspect-[1/1.4] rounded-sm shadow-2xl relative overflow-hidden flex flex-col bg-white border border-slate-200"
            style={{ fontFamily: brand.report_font || 'Inter' }}
          >
             {/* Report Cover Preview Frame */}
             <div className="h-1/3 p-7 flex flex-col justify-end relative" style={{ background: brand.primary_color || '#0f172a', color: brand.secondary_color || '#ffffff' }}>
                {/* Logo in Preview */}
                <div className={`absolute p-5 ${
                  brand.logo_position === 'top-left' ? 'top-0 left-0' :
                  brand.logo_position === 'top-right' ? 'top-0 right-0' :
                  brand.logo_position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                  brand.logo_position === 'bottom-left' ? 'bottom-0 left-0' :
                  brand.logo_position === 'bottom-right' ? 'bottom-0 right-0' : 'top-0 left-0'
                }`}>
                    {brand.logo_url && <Image src={brand.logo_url} height={28} width={100} className="h-7 w-auto object-contain drop-shadow-sm" alt="Preview logo" />}
                </div>

                <p className="text-[10px] font-black tracking-[0.2em] uppercase opacity-70 mb-2" style={{ color: brand.accent_color || '#6366f1' }}>Performance Record</p>
                <h4 className="text-v2xl font-black leading-tight tracking-tight">Enterprise Organic Growth Node</h4>
                <div className="flex items-center gap-3 mt-5 opacity-50">
                   <div className="w-10 h-0.5 rounded-full bg-current" />
                   <span className="text-[10px] font-black uppercase tracking-widest">March Phase</span>
                </div>
             </div>
             
             <div className="flex-1 p-7 flex flex-col gap-5 relative">
                {/* Watermark in Preview */}
                {brand.watermark_enabled && brand.watermark_text && (
                  <div className="absolute inset-0 flex items-center justify-center rotate-[-35deg] pointer-events-none overflow-hidden pr-10">
                    <span className="text-[28px] font-black text-slate-900/5 whitespace-nowrap uppercase tracking-[1em]">
                      {brand.watermark_text}
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="w-1/3 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-full h-2 rounded-full bg-slate-100" />
                  <div className="w-full h-2 rounded-full bg-slate-100" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-5">
                  <div className="h-20 rounded-2xl border border-slate-100 p-4 space-y-3">
                     <div className="w-1/2 h-2 rounded-full bg-slate-100" />
                     <div className="w-3/4 h-3.5 rounded-full" style={{ background: `${brand.primary_color}15` }} />
                  </div>
                  <div className="h-20 rounded-2xl border border-slate-100 p-4 space-y-3">
                     <div className="w-1/2 h-2 rounded-full bg-slate-100" />
                     <div className="w-3/4 h-3.5 rounded-full" style={{ background: `${brand.primary_color}15` }} />
                  </div>
                </div>

                <div className="mt-auto pt-7 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-[9px] font-black text-white shadow-sm">R</div>
                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Global Node</span>
                     </div>
                     {brand.show_powered_by && <span className="text-[8px] font-black text-slate-200 tracking-tighter">POWERED BY REPORTLY</span>}
                  </div>
                </div>
             </div>
          </div>
          
          <div className="mt-8 p-5 bg-slate-900/5 rounded-2xl border border-slate-900/10">
             <div className="flex items-center gap-2.5 mb-2.5">
                <div className="p-1 px-2 bg-slate-900 text-white rounded text-[10px] font-black tracking-widest">LOGIC</div>
                <span className="text-[12px] font-bold text-slate-900">Adaptive Preview</span>
             </div>
             <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
               This frame renders using your selected font ({brand.report_font}) and hex palette. 
               Layout scaling is approximated for the high-density grid.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
