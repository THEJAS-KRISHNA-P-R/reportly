'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { ArrowLeft, CheckCircle2, RotateCcw, Send, Settings, Eye, Clock, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [narrativeText, setNarrativeText] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write your AI narrative or custom analysis here...' }),
      CharacterCount.configure({ limit: 2000 })
    ],
    content: narrativeText,
    onUpdate: ({ editor }) => {
      setNarrativeText(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm xl:prose-base max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
          if (data.ai_narrative) {
            setNarrativeText(data.ai_narrative);
            editor?.commands.setContent(data.ai_narrative);
          }
        }
      } catch (err) {
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [resolvedParams.id, editor]);

  const handleSave = async (newStatus?: string) => {
    setSaving(true);
    try {
      const payload: any = { ai_narrative: narrativeText };
      if (newStatus) payload.status = newStatus;
      
      const res = await fetch(`/api/reports/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success(newStatus ? `Report marked as ${newStatus}` : 'Draft saved');
        if (newStatus) setReport({ ...report, status: newStatus });
      } else {
        toast.error('Failed to save');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-sm" style={{ color: '#666666' }}>Loading editor...</div>;
  if (!report) return null;

  return (
    <div className="flex flex-col min-h-screen -mt-6 -mx-6 bg-white xl:flex-row">
      
      {/* LEFT PANEL: Section Navigator (200px) */}
      <div className="hidden xl:flex flex-col w-[240px] border-r" style={{ borderColor: '#E5E5E5', background: '#FAFAFA' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E5E5E5' }}>
          <h3 className="font-semibold text-sm" style={{ color: '#000000' }}>Sections</h3>
        </div>
        <div className="p-3 space-y-1 overflow-y-auto">
          {['Cover', 'Executive Summary', 'Metrics', 'Traffic', 'Narrative', 'Recommendations'].map((sec, i) => (
            <button 
              key={sec}
              className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-gray-100 flex items-center justify-between group"
              style={{ color: '#333333' }}
            >
              <span>{sec}</span>
              <Eye size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#999999' }} />
            </button>
          ))}
        </div>
      </div>

      {/* CENTER PANEL: Editable Blocks */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Sticky Toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b" style={{ borderColor: '#E5E5E5', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-4">
            <Link href="/reports" className="text-gray-500 hover:text-black transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: '#000000' }}>
                {report.clients?.name} — {report.month}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full" style={{ background: report.status === 'draft' ? '#CCCCCC' : '#1A7A3A'}} />
                <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#666666' }}>
                  {report.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleSave()}
              disabled={saving}
              className="h-8 px-3 rounded-md text-xs font-medium border transition-colors hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: '#E5E5E5', color: '#000000' }}
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            {report.pdf_url && (
              <a 
                href={report.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-3 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-colors hover:bg-gray-50 bg-white"
                style={{ borderColor: '#E5E5E5', color: '#000000' }}
              >
                <Eye size={14} /> View PDF
              </a>
            )}
            <button 
              disabled={saving || report.status === 'approved' || report.status === 'sent'}
              onClick={async () => {
                setSaving(true);
                try {
                  const res = await fetch(`/api/reports/${resolvedParams.id}/approve`, { method: 'POST' });
                  if (res.ok) {
                    toast.success('Report approved and sent');
                    const data = await res.json();
                    setReport({ ...report, status: data.status || 'approved' });
                  } else {
                    const err = await res.json();
                    toast.error(err.error || 'Approval failed');
                  }
                } catch (err) {
                  toast.error('Network error');
                } finally {
                  setSaving(false);
                }
              }}
              className="h-8 px-4 rounded-md text-xs font-medium flex items-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: '#000000', color: '#FFFFFF' }}
            >
              <CheckCircle2 size={14} /> {report.status === 'sent' ? 'Sent' : 'Approve & Send'}
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-y-auto p-8 relative" style={{ background: '#F8F8F8' }}>
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Block 1: Cover Header */}
            <div className="rounded-xl border p-8" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
              <div className="flex justify-between items-start mb-12">
                <div className="w-16 h-16 rounded-lg font-bold text-xl flex items-center justify-center text-white" style={{ background: '#000000' }}>
                  {report.clients?.name.charAt(0)}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">Monthly Report</p>
                  <p className="text-xl font-semibold mt-1">{report.month}</p>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-4">{report.clients?.name}</h1>
            </div>

            {/* Block 2: Generated Metrics */}
            <div className="rounded-xl border p-6" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Key Performance Metrics</h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded border bg-gray-50 text-gray-600 border-gray-200">
                  GA4 Sync: Active
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Visitors</p>
                  <p className="font-semibold text-lg">14,230</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Sessions</p>
                  <p className="font-semibold text-lg">16,504</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Bounce</p>
                  <p className="font-semibold text-lg">42.1%</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Duration</p>
                  <p className="font-semibold text-lg">2m 14s</p>
                </div>
              </div>
            </div>

            {/* Block 3: TipTap Editor (AI Narrative) */}
            <div className="rounded-xl border overflow-hidden flex flex-col" style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}>
              <div className="border-b p-3 flex justify-between items-center bg-gray-50 border-gray-200">
                <h3 className="font-semibold text-sm">AI Narrative & Analysis</h3>
                <button 
                  disabled={saving}
                  onClick={async () => {
                    if (!confirm('This will clear current draft and re-run the pipeline. Continue?')) return;
                    setSaving(true);
                    try {
                      const res = await fetch(`/api/reports/${resolvedParams.id}/trigger`, { method: 'POST' });
                      if (res.ok) {
                        toast.success('Regeneration started. You can stay here or check back later.');
                        router.refresh();
                      } else {
                        toast.error('Failed to trigger regeneration');
                      }
                    } catch (err) {
                      toast.error('Network error');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="text-xs font-medium flex items-center gap-1.5 text-gray-600 hover:text-black disabled:opacity-50"
                >
                  <RotateCcw size={12} /> {saving ? 'Triggering...' : 'Regenerate'}
                </button>
              </div>
              
              {/* TipTap Toolbar */}
              <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-white">
                <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-1.5 rounded transition-colors ${editor?.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><span className="font-bold text-sm px-1">B</span></button>
                <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={`p-1.5 rounded transition-colors ${editor?.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><span className="italic text-sm px-1">I</span></button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded transition-colors ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><span className="font-bold text-xs px-1">H3</span></button>
                <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded transition-colors ${editor?.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><span className="font-bold text-xs px-1">• List</span></button>
              </div>

              <EditorContent editor={editor} className="flex-1" />
              
              <div className="bg-gray-50 border-t border-gray-200 p-2 text-right">
                <span className="text-xs text-gray-500">
                  {editor?.storage.characterCount.characters()} / 2000 chars
                </span>
              </div>
            </div>
            
            {/* End Spacer */}
            <div className="h-8" />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Audit & Delivery (300px) */}
      <div className="hidden lg:flex flex-col w-[300px] border-l" style={{ borderColor: '#E5E5E5', background: '#FAFAFA' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E5E5E5' }}>
          <h3 className="font-semibold text-sm" style={{ color: '#000000' }}>Delivery & Audit</h3>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Validation */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Validation</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 size={14} /> Data fully synced
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 size={14} /> AI Narrative generated
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" /> Pending Approval
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Delivery</h4>
            <div className="rounded-lg border p-3 bg-white text-sm" style={{ borderColor: '#E5E5E5' }}>
              <div className="flex items-center gap-2 mb-2">
                <Mail size={14} className="text-gray-400" /> 
                <span className="font-medium">marketing@client.com</span>
              </div>
              <button className="w-full h-8 mt-2 rounded bg-black text-white text-xs font-medium hover:bg-gray-800 transition-colors">
                Send Now
              </button>
            </div>
          </div>

          {/* Timeline Mini */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Audit Log</h4>
            <div className="relative pl-3 space-y-4 border-l-2 ml-1 border-gray-200">
              <div className="relative">
                <div className="absolute w-2 h-2 rounded-full bg-gray-300 -left-[17px] top-1.5" />
                <p className="text-xs font-medium text-gray-900">Draft created</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock size={10} /> 2 hours ago</p>
              </div>
              <div className="relative">
                <div className="absolute w-2 h-2 rounded-full bg-green-500 -left-[17px] top-1.5" />
                <p className="text-xs font-medium text-gray-900">GA4 Data Synced</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock size={10} /> 1 hour ago</p>
              </div>
              <div className="relative">
                <div className="absolute w-2 h-2 rounded-full bg-black -left-[17px] top-1.5" />
                <p className="text-xs font-medium text-gray-900">AI Narrative updated</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock size={10} /> Just now</p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
