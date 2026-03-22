'use client';

import { useState, useEffect } from 'react';
import { Palette, LayoutTemplate, Layers, Mail, CheckCircle2, ChevronRight, Layout, LayoutPanelTop, AlignLeft, Hexagon } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomizePage() {
  const [activeTab, setActiveTab] = useState('branding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState({
    primary_color: '#000000',
    secondary_color: '#FFFFFF',
    accent_color: '#333333',
    report_font: 'Inter',
    report_layout: 'modern',
    show_powered_by: true,
  });

  useEffect(() => {
    async function fetchBranding() {
      try {
        const res = await fetch('/api/agencies/branding');
        if (res.ok) {
          const data = await res.json();
          if (data) setBrand(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        toast.error('Failed to load branding settings');
      } finally {
        setLoading(false);
      }
    }
    fetchBranding();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/agencies/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand)
      });
      if (res.ok) toast.success('Settings saved successfully');
      else toast.error('Failed to save settings');
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'branding', icon: Palette, label: 'Branding & Colors' },
    { id: 'layout', icon: LayoutTemplate, label: 'Report Layout' },
    { id: 'sections', icon: Layers, label: 'PDF Sections' },
    { id: 'email', icon: Mail, label: 'Email Template' },
  ];

  const layouts = [
    { id: 'modern', name: 'Modern', icon: Layout },
    { id: 'classic', name: 'Classic', icon: AlignLeft },
    { id: 'minimal', name: 'Minimal', icon: LayoutPanelTop },
    { id: 'bold', name: 'Bold', icon: Hexagon },
  ];

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading settings...</div>;

  return (
    <div className="flex flex-col min-h-screen -mt-6 -mx-6 bg-white xl:flex-row">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#000000' }}>Customization</h1>
              <p className="text-sm mt-1" style={{ color: '#666666' }}>
                White-label your reports, configure default sections, and manage delivery templates.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-6 rounded-lg text-sm font-medium flex items-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: '#000000', color: '#FFFFFF' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="border-b flex gap-6 mb-8 overflow-x-auto" style={{ borderColor: '#E5E5E5' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
                  style={{
                    color: isActive ? '#000000' : '#666666',
                    borderBottomColor: isActive ? '#000000' : 'transparent',
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-8">
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div className="rounded-xl border p-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
                  <h3 className="font-semibold mb-6 flex items-center gap-2" style={{ color: '#000000' }}><Palette size={16}/> Brand Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['primary', 'secondary', 'accent'].map(type => (
                      <div key={type} className="space-y-2">
                        <label className="text-sm font-medium capitalize" style={{ color: '#000000' }}>{type} Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={(brand as any)[`${type}_color`]}
                            onChange={(e) => setBrand({ ...brand, [`${type}_color`]: e.target.value })}
                            className="w-10 h-10 rounded-md border cursor-pointer p-0.5"
                            style={{ borderColor: '#E5E5E5' }}
                          />
                          <input
                            type="text"
                            value={(brand as any)[`${type}_color`]}
                            onChange={(e) => setBrand({ ...brand, [`${type}_color`]: e.target.value })}
                            className="flex-1 h-10 px-3 rounded-md border text-sm font-mono uppercase"
                            style={{ borderColor: '#E5E5E5' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border p-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
                  <h3 className="font-semibold mb-6 flex items-center gap-2" style={{ color: '#000000' }}>Typography & Footer</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" style={{ color: '#000000' }}>Report Font</label>
                      <select
                        value={brand.report_font}
                        onChange={(e) => setBrand({ ...brand, report_font: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border text-sm bg-white"
                        style={{ borderColor: '#E5E5E5', color: '#000000' }}
                      >
                        <option value="Inter">Inter (Sans Serif)</option>
                        <option value="Helvetica">Helvetica (Sans Serif)</option>
                        <option value="Georgia">Georgia (Serif)</option>
                        <option value="Playfair Display">Playfair Display (Serif)</option>
                        <option value="Roboto">Roboto (Sans Serif)</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#000000' }}>Show "Powered by Reportly"</p>
                        <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Requires Pro or Agency plan to disable.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={brand.show_powered_by} onChange={(e) => setBrand({...brand, show_powered_by: e.target.checked})} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {layouts.map(layout => {
                  const Icon = layout.icon;
                  const isSelected = brand.report_layout === layout.id;
                  
                  return (
                    <div 
                      key={layout.id}
                      onClick={() => setBrand({ ...brand, report_layout: layout.id })}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`}
                      style={{ background: '#FFFFFF' }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
                            <Icon size={20} />
                          </div>
                          <p className="font-semibold text-sm">{layout.name}</p>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-black" />}
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-10 bg-gray-200 rounded w-full" />
                        <div className="flex gap-2">
                          <div className="h-12 bg-gray-200 rounded flex-1" />
                          <div className="h-12 bg-gray-200 rounded flex-1" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'sections' && (
              <div className="rounded-xl border p-12 text-center flex flex-col items-center justify-center bg-gray-50">
                <Layers size={32} className="text-gray-400 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Drag-and-Drop Editor Coming Soon</h3>
                <p className="text-sm text-gray-500 max-w-sm">Reordering default sections using @dnd-kit will be implemented in the complete module.</p>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="rounded-xl border p-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
                 <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" style={{ color: '#000000' }}>Email Subject Formula</label>
                      <input
                        type="text"
                        defaultValue="Monthly Performance Report: {client_name}"
                        className="w-full h-10 px-3 rounded-md border text-sm"
                        style={{ borderColor: '#E5E5E5' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" style={{ color: '#000000' }}>Body Message</label>
                      <textarea
                        defaultValue="Hi there,\n\nYour automated performance report for the previous month is attached. Let us know if you have any questions!\n\nBest,\n{agency_name} Team"
                        className="w-full h-32 px-3 py-2 rounded-md border text-sm resize-none"
                        style={{ borderColor: '#E5E5E5' }}
                      />
                    </div>
                    <button className="h-9 px-4 rounded-md border bg-gray-50 text-sm font-medium transition-colors hover:bg-gray-100 text-black">
                      Send test email
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Live Preview (340px) */}
      <div className="hidden xl:flex flex-col w-[360px] border-l" style={{ borderColor: '#E5E5E5', background: '#F8F8F8' }}>
        <div className="p-4 border-b bg-white" style={{ borderColor: '#E5E5E5' }}>
          <h3 className="font-semibold text-sm" style={{ color: '#000000' }}>Live Preview</h3>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Updates based on settings</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <div 
            className="w-full aspect-[1/1.4] rounded shadow hover:shadow-md transition-shadow relative overflow-hidden flex flex-col bg-white"
            style={{ fontFamily: brand.report_font }}
          >
             {/* Report Cover Preview Frame */}
             <div className="h-1/3 p-4 flex flex-col justify-end" style={{ background: brand.primary_color, color: brand.secondary_color }}>
                <p className="text-[10px] font-bold tracking-widest uppercase opacity-80" style={{ color: brand.accent_color }}>Monthly Report</p>
                <h4 className="text-lg font-bold mt-1">Client Name</h4>
             </div>
             
             <div className="flex-1 p-4 flex flex-col gap-3 object-contain">
                <div className="w-2/3 h-2 rounded bg-gray-200" />
                <div className="w-full h-2 rounded bg-gray-100" />
                <div className="w-4/5 h-2 rounded bg-gray-100" />
                <div className="w-full h-2 rounded bg-gray-100" />
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="h-10 rounded-sm" style={{ background: `${brand.primary_color}20` }} />
                  <div className="h-10 rounded-sm" style={{ background: `${brand.primary_color}20` }} />
                </div>
             </div>

             {brand.show_powered_by && (
               <div className="p-2 text-center text-[8px] text-gray-400 border-t border-gray-100">
                 Powered by Reportly
               </div>
             )}
          </div>
        </div>
      </div>

    </div>
  );
}
