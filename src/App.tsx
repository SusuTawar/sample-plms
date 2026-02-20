import React, { useState } from 'react';
import { initialProduct } from './mockData';
import { Product, Sample, DesignVersion, Metric, DesignStatus, SampleVerdict, Competitor } from './types';
import { CheckCircle, XCircle, AlertCircle, Beaker, PenTool, Rocket, Download, Settings, Plus, Trash2, Upload, Image as ImageIcon, ArrowRight, FileText, Maximize2, ChevronRight, ChevronDown, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

function getMetricStatus(sampleVal: number, compVal: number, higherIsBetter: boolean) {
  if (sampleVal === compVal) return 'neutral';
  if (higherIsBetter) {
    return sampleVal > compVal ? 'good' : 'bad';
  } else {
    return sampleVal < compVal ? 'good' : 'bad';
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx(
      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
      status === 'Accepted' || status === 'Approved' ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
        status === 'Rejected' ? "bg-rose-100 text-rose-800 border border-rose-200" :
          status === 'Under Review' || status === 'On Progress' ? "bg-blue-100 text-blue-800 border border-blue-200" :
            status === 'Pending' || status === 'Draft' ? "bg-slate-100 text-slate-600 border border-slate-200" :
              "bg-slate-100 text-slate-800"
    )}>
      {status}
    </span>
  );
}

export default function App() {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [rejectingSample, setRejectingSample] = useState<Sample | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [isCompetitorsModalOpen, setIsCompetitorsModalOpen] = useState(false);

  // New state for advancing status and editing images
  const [advancingItem, setAdvancingItem] = useState<{ type: 'design' | 'sample', id: string, nextStatus: DesignStatus | SampleVerdict, title: string } | null>(null);
  const [advanceNote, setAdvanceNote] = useState('');
  const [editingImage, setEditingImage] = useState<{ id: string, url: string } | null>(null);

  // Comparison Overlay state
  const [comparisonSample, setComparisonSample] = useState<Sample | null>(null);

  const isDesignAccepted = product.designs.some(d => d.status === 'Accepted');
  const hasApprovedSample = product.samples.some(s => s.verdict === 'Approved');
  const isMarketReady = isDesignAccepted && hasApprovedSample;
  const progress = (isDesignAccepted ? 50 : 0) + (hasApprovedSample ? 50 : 0);

  const updateDesignStatus = (id: string, status: DesignStatus) => {
    setProduct(prev => ({
      ...prev,
      designs: prev.designs.map(d => d.id === id ? { ...d, status } : d)
    }));
  };

  const updateSampleVerdict = (id: string, verdict: SampleVerdict, comments?: string) => {
    setProduct(prev => ({
      ...prev,
      samples: prev.samples.map(s => s.id === id ? { ...s, verdict, pmComments: comments || s.pmComments } : s)
    }));
  };

  const handleAdvanceClick = (type: 'design' | 'sample', id: string, currentStatus: string, title: string) => {
    let nextStatus: string;
    if (type === 'design') {
      nextStatus = currentStatus === 'Draft' ? 'Under Review' : 'Accepted';
    } else {
      nextStatus = currentStatus === 'Pending' ? 'Approved' : 'Approved';
    }
    setAdvancingItem({ type, id, nextStatus: nextStatus as DesignStatus | SampleVerdict, title });
    setAdvanceNote('');
  };

  const submitAdvance = () => {
    if (!advancingItem) return;

    if (advancingItem.type === 'design') {
      setProduct(prev => ({
        ...prev,
        designs: prev.designs.map(d => d.id === advancingItem.id ? {
          ...d,
          status: advancingItem.nextStatus as DesignStatus,
          notes: advanceNote ? `${d.notes}\n\n[${advancingItem.nextStatus}]: ${advanceNote}` : d.notes
        } : d)
      }));
    } else {
      setProduct(prev => ({
        ...prev,
        samples: prev.samples.map(s => s.id === advancingItem.id ? {
          ...s,
          verdict: advancingItem.nextStatus as SampleVerdict,
          pmComments: advanceNote ? `${s.pmComments ? s.pmComments + '\n\n' : ''}[${advancingItem.nextStatus}]: ${advanceNote}` : s.pmComments
        } : s)
      }));
    }
    setAdvancingItem(null);
  };

  const submitImageEdit = () => {
    if (!editingImage) return;
    setProduct(prev => ({
      ...prev,
      designs: prev.designs.map(d => d.id === editingImage.id ? { ...d, imageUrl: editingImage.url } : d)
    }));
    setEditingImage(null);
  };

  const addNewDesign = () => {
    const lastVersion = product.designs[0].version;
    const major = parseInt(lastVersion.split('.')[0].replace('v', ''));
    const minor = parseInt(lastVersion.split('.')[1]) + 1;
    const newVersion = `v${major}.${minor}`;

    const newDesign: DesignVersion = {
      id: `d-${Date.now()}`,
      version: newVersion,
      status: 'Draft',
      imageUrl: 'https://picsum.photos/seed/newdesign/800/600',
      date: new Date().toISOString().split('T')[0],
      notes: 'New version uploaded.'
    };
    setProduct(prev => ({
      ...prev,
      designs: [newDesign, ...prev.designs]
    }));
  };

  const updateCompetitorMetric = (compId: string, metricId: string, value: number) => {
    setProduct(prev => ({
      ...prev,
      competitors: prev.competitors.map(c =>
        c.id === compId
          ? { ...c, metrics: { ...c.metrics, [metricId]: value } }
          : c
      )
    }));
  };

  const updateSampleMetric = (sampleId: string, metricId: string, value: number) => {
    setProduct(prev => ({
      ...prev,
      samples: prev.samples.map(s =>
        s.id === sampleId
          ? { ...s, metrics: { ...s.metrics, [metricId]: value } }
          : s
      )
    }));
  };

  const updateMetricDef = (id: string, field: keyof Metric, value: any) => {
    setProduct(prev => ({
      ...prev,
      metricDefinitions: prev.metricDefinitions.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      )
    }));
  };

  const addMetricDef = () => {
    const newId = `m-${Date.now()}`;
    setProduct(prev => ({
      ...prev,
      metricDefinitions: [...prev.metricDefinitions, { id: newId, name: 'New Metric', unit: 'unit', higherIsBetter: true }]
    }));
  };

  const removeMetricDef = (id: string) => {
    setProduct(prev => ({
      ...prev,
      metricDefinitions: prev.metricDefinitions.filter(m => m.id !== id)
    }));
  };

  const addCompetitor = () => {
    const newId = `c-${Date.now()}`;
    const initialMetrics: Record<string, number> = {};
    product.metricDefinitions.forEach(m => initialMetrics[m.id] = 0);

    setProduct(prev => ({
      ...prev,
      competitors: [...prev.competitors, { id: newId, name: 'New Competitor', metrics: initialMetrics }]
    }));
  };

  const removeCompetitor = (id: string) => {
    setProduct(prev => ({
      ...prev,
      competitors: prev.competitors.filter(c => c.id !== id)
    }));
  };

  const updateCompetitorName = (id: string, name: string) => {
    setProduct(prev => ({
      ...prev,
      competitors: prev.competitors.map(c => c.id === id ? { ...c, name } : c)
    }));
  };

  const handleLaunch = () => {
    setProduct(prev => ({ ...prev, status: 'Launched' }));
  };

  const getFailedMetricsAgainstAll = (sample: Sample) => {
    const failures: { def: Metric, sVal: number, cName: string, cVal: number }[] = [];
    product.metricDefinitions.forEach(def => {
      const sVal = sample.metrics[def.id] || 0;
      product.competitors.forEach(comp => {
        const cVal = comp.metrics[def.id] || 0;
        if (getMetricStatus(sVal, cVal, def.higherIsBetter) === 'bad') {
          failures.push({ def, sVal, cName: comp.name, cVal });
        }
      });
    });
    return failures;
  };

  const openRejectPanel = (sample: Sample) => {
    setRejectingSample(sample);
    const failed = getFailedMetricsAgainstAll(sample);
    if (failed.length > 0) {
      const text = `Sample ${sample.batchId} failed to meet benchmark standards against competitors:\n` +
        failed.map(m => `- ${m.def.name}: ${m.sVal}${m.def.unit} (Target vs ${m.cName}: ${m.cVal}${m.def.unit})`).join('\n') +
        `\n\nNeeds more stability and refinement. Please reformulate.`;
      setFeedbackText(text);
    } else {
      setFeedbackText(`Sample ${sample.batchId} rejected.`);
    }
  };

  const submitRejection = () => {
    if (rejectingSample) {
      updateSampleVerdict(rejectingSample.id, 'Rejected', feedbackText);
      setRejectingSample(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-12">
      {/* Global Header (The Decision Bar) */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto grid grid-cols-12 items-center gap-8">
          {/* Left: Product Info */}
          <div className="col-span-3">
            <div className="flex items-center gap-3 mb-0.5">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{product.name}</h1>
              <StatusBadge status={product.status} />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">SKU: {product.id} • {product.category}</p>
          </div>

          {/* Center: Readiness Meter */}
          <div className="col-span-6 flex flex-col items-center">
            <div className="w-full max-w-md">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Readiness Meter</span>
                <span className="text-sm font-black text-indigo-600">{progress}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={clsx(
                    "h-full transition-all duration-700",
                    progress === 100 ? "bg-emerald-500" : "bg-indigo-500"
                  )}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={clsx("w-1.5 h-1.5 rounded-full", isDesignAccepted ? "bg-emerald-500" : "bg-slate-300")} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Design Accepted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={clsx("w-1.5 h-1.5 rounded-full", hasApprovedSample ? "bg-emerald-500" : "bg-slate-300")} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Sample Approved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Publish Button */}
          <div className="col-span-3 flex justify-end">
            <button
              onClick={handleLaunch}
              disabled={!isMarketReady || product.status === 'Launched'}
              className={clsx(
                "flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all transform active:scale-95",
                isMarketReady && product.status !== 'Launched'
                  ? "bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-200"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              )}
            >
              <Rocket size={18} />
              {product.status === 'Launched' ? 'LIVE IN MARKET' : 'PUBLISH TO MARKET'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Cockpit Layout */}
      <main className="max-w-[1600px] mx-auto px-8 mt-10 grid grid-cols-12 gap-10">

        {/* Left Column: The Design Track (Vertical Flow) */}
        <aside className="col-span-3 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <PenTool size={18} className="text-indigo-500" />
              <h2 className="text-sm font-black uppercase tracking-tight">Design Track</h2>
            </div>
            <button
              onClick={addNewDesign}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Upload New Version"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Latest Design Visual Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group relative">
            <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
              <img
                src={product.designs[0].imageUrl}
                alt="Latest Design"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black shadow-lg border border-slate-100">
                  LATEST: {product.designs[0].version}
                </div>
                <StatusBadge status={product.designs[0].status} />
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3">
                <button
                  onClick={() => window.open(product.designs[0].imageUrl, '_blank')}
                  className="w-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Maximize2 size={14} /> VIEW HIGH-RES PDF
                </button>

                {product.designs[0].status !== 'Accepted' && product.designs[0].status !== 'Rejected' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAdvanceClick('design', product.designs[0].id, product.designs[0].status, `Design ${product.designs[0].version}`)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20 transition-all"
                    >
                      {product.designs[0].status === 'Draft' ? 'START REVIEW' : 'ACCEPT'}
                    </button>
                    <button
                      onClick={() => updateDesignStatus(product.designs[0].id, 'Rejected')}
                      className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-rose-900/20 transition-all"
                    >
                      REJECT
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setEditingImage({ id: product.designs[0].id, url: product.designs[0].imageUrl })}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Settings size={14} />
              </button>
            </div>

            <div className="p-5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes & Feedback</div>
              <p className="text-xs text-slate-600 leading-relaxed italic">"{product.designs[0].notes}"</p>
            </div>
          </div>

          {/* Version History List */}
          <div className="flex flex-col gap-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Version History</div>
            <div className="flex flex-col gap-2">
              {product.designs.slice(1).map(design => (
                <div key={design.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-slate-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100">
                      <img src={design.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-700">{design.version}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">{design.date}</div>
                    </div>
                  </div>
                  <StatusBadge status={design.status} />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Section: The Sample & Competitor Matrix */}
        <section className="col-span-9 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Beaker size={18} className="text-blue-500" />
              <h2 className="text-sm font-black uppercase tracking-tight">Sample & Competitor Matrix</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCompetitorsModalOpen(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Plus size={14} /> Manage Competitors
              </button>
              <button
                onClick={() => setIsMetricsModalOpen(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Settings size={14} /> Configure Metrics
              </button>
            </div>
          </div>

          {/* Sample Cards Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {product.samples.map(sample => {
              const failures = getFailedMetricsAgainstAll(sample);
              return (
                <div
                  key={sample.id}
                  className={clsx(
                    "bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all group",
                    sample.verdict === 'Approved' ? "border-emerald-200 ring-1 ring-emerald-500/10" :
                      sample.verdict === 'Rejected' ? "border-rose-200" : "border-slate-200"
                  )}
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <Beaker size={16} className="text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">{sample.batchId}</h3>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Submitted: {sample.date}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={sample.verdict} />
                      {sample.verdict === 'Pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAdvanceClick('sample', sample.id, sample.verdict, sample.batchId)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Approve Sample"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            onClick={() => openRejectPanel(sample)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Reject Sample"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Mini-table */}
                  <div className="p-0 flex-1 relative">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-50 text-[9px] uppercase text-slate-400 border-b border-slate-100 font-black tracking-widest">
                        <tr>
                          <th className="px-5 py-3">Metric</th>
                          <th className="px-5 py-3">Sample Value</th>
                          <th className="px-5 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {product.metricDefinitions.slice(0, 3).map(def => {
                          const sVal = sample.metrics[def.id] || 0;
                          // Compare against the first competitor for the "mini-table" view
                          const cVal = product.competitors[0].metrics[def.id] || 0;
                          const status = getMetricStatus(sVal, cVal, def.higherIsBetter);

                          return (
                            <tr key={def.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-5 py-3 font-bold text-slate-600">{def.name}</td>
                              <td className="px-5 py-3 font-mono font-bold text-slate-900">
                                {sVal}{def.unit}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className={clsx(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-black text-[8px] uppercase",
                                  status === 'good' ? "bg-emerald-50 text-emerald-600" :
                                    status === 'bad' ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-400"
                                )}>
                                  {status === 'good' ? 'WIN' : status === 'bad' ? 'LOSS' : 'PAR'}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    {/* Comparison Overlay Trigger */}
                    <button
                      onClick={() => setComparisonSample(sample)}
                      className="w-full py-3 bg-slate-50/80 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-t border-slate-100"
                    >
                      <BarChart3 size={14} /> Open Full Comparison Overlay
                    </button>
                  </div>

                  {/* Card Footer: Export Button */}
                  {sample.verdict === 'Rejected' && (
                    <div className="p-4 bg-rose-50/30 border-t border-rose-100 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-rose-700">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Failed {failures.length} Benchmarks</span>
                      </div>
                      <button
                        onClick={() => openRejectPanel(sample)}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-rose-900/10"
                      >
                        <Download size={14} /> EXPORT TO R&D
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* Comparison Overlay (Sample in Middle, Competitors on Sides) */}
      <AnimatePresence>
        {comparisonSample && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[60]"
              onClick={() => setComparisonSample(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="fixed inset-10 z-[70] flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8 px-4">
                <div className="flex flex-col">
                  <h2 className="text-3xl font-black text-white tracking-tight">Competitor Benchmarking View</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Direct Visual & Data Comparison</p>
                </div>
                <button
                  onClick={() => setComparisonSample(null)}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                >
                  <XCircle size={32} />
                </button>
              </div>

              <div className="flex-1 flex gap-6 mt-8 overflow-hidden">
                {/* Sample (Left Anchor) */}
                <div className="w-[420px] shrink-0 bg-white rounded-3xl shadow-2xl p-8 flex flex-col border-4 border-indigo-500 relative z-10">
                  <div className="absolute -top-4 -left-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                    Baseline Anchor
                  </div>
                  <div className="flex justify-between items-start mb-8 mt-2">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{comparisonSample.batchId}</h3>
                      <p className="text-slate-400 font-bold text-xs mt-1">Submitted: {comparisonSample.date}</p>
                    </div>
                    <StatusBadge status={comparisonSample.verdict} />
                  </div>

                  <div className="flex-1 flex flex-col gap-6">
                    {product.metricDefinitions.map(def => {
                      const sVal = comparisonSample.metrics[def.id] || 0;
                      return (
                        <div key={def.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{def.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{def.unit}</span>
                          </div>
                          <div className="text-3xl font-mono font-black text-indigo-600 tabular-nums">
                            {sVal}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Competitors (Right Challengers Track) */}
                <div className="flex-1 flex gap-6 overflow-x-auto pb-4 pr-10 snap-x snap-mandatory hide-scrollbar relative">
                  {/* Fade mask for scroll hint */}
                  <div className="fixed right-10 top-32 bottom-10 w-32 bg-gradient-to-l from-slate-900/90 to-transparent pointer-events-none z-20" />

                  {product.competitors.map((comp, idx) => (
                    <div key={comp.id} className="w-[340px] shrink-0 snap-start bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 flex flex-col hover:bg-slate-800 transition-colors">
                      <div className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">
                        Challenger #{idx + 1}
                      </div>
                      <h3 className="text-xl font-black text-white mb-8 truncate" title={comp.name}>{comp.name}</h3>

                      <div className="flex-1 flex flex-col gap-6">
                        {product.metricDefinitions.map(def => {
                          const sVal = comparisonSample.metrics[def.id] || 0;
                          const cVal = comp.metrics[def.id] || 0;
                          const isWin = getMetricStatus(sVal, cVal, def.higherIsBetter) === 'good';
                          const isLoss = getMetricStatus(sVal, cVal, def.higherIsBetter) === 'bad';
                          const diff = sVal - cVal;
                          const formattedDiff = diff > 0 ? `+${diff}` : diff;

                          return (
                            <div key={def.id} className="flex flex-col gap-2 border-b border-slate-700/50 pb-4 last:border-0 last:pb-0">
                              <div className="flex justify-between items-baseline">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{def.name}</span>
                                <span className="text-lg font-mono font-bold text-slate-300">{cVal}{def.unit}</span>
                              </div>

                              <div className="flex justify-end">
                                <div className={clsx(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                  isWin ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                    isLoss ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                                      "bg-slate-700 text-slate-300 border border-slate-600"
                                )}>
                                  <span>{formattedDiff}</span>
                                  <span>{isWin ? 'WIN' : isLoss ? 'LOSS' : 'PAR'}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Advance Status Modal */}
      <AnimatePresence>
        {advancingItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setAdvancingItem(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Advance Status</h2>
                <button onClick={() => setAdvancingItem(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-8 bg-white">
                <p className="text-slate-600 mb-8 flex items-center gap-3 text-sm font-medium">
                  Advancing <strong className="text-slate-900">{advancingItem.title}</strong> to <StatusBadge status={advancingItem.nextStatus} />
                </p>

                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Decision Note / Feedback</label>
                <textarea
                  value={advanceNote}
                  onChange={e => setAdvanceNote(e.target.value)}
                  className="w-full h-40 p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none text-sm font-medium transition-all"
                  placeholder="E.g., Approved for next stage after reviewing metrics..."
                />
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                <button onClick={() => setAdvancingItem(null)} className="px-6 py-3 border border-slate-200 bg-white text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all">
                  CANCEL
                </button>
                <button onClick={submitAdvance} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2">
                  CONFIRM & ADVANCE <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Image URL Modal */}
      <AnimatePresence>
        {editingImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setEditingImage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Design Image</h2>
                <button onClick={() => setEditingImage(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-8 bg-white">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Artwork Image URL</label>
                <input
                  value={editingImage.url}
                  onChange={e => setEditingImage({ ...editingImage, url: e.target.value })}
                  className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-medium transition-all"
                  placeholder="https://..."
                />

                {editingImage.url && (
                  <div className="mt-8 aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
                    <img src={editingImage.url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Live Preview</div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                <button onClick={() => setEditingImage(null)} className="px-6 py-3 border border-slate-200 bg-white text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all">
                  CANCEL
                </button>
                <button onClick={submitImageEdit} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20">
                  SAVE ARTWORK
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manage Competitors Modal */}
      <AnimatePresence>
        {isCompetitorsModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setIsCompetitorsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Manage Competitor Products</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Set benchmark values for comparison</p>
                </div>
                <button onClick={() => setIsCompetitorsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 flex flex-col gap-8 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.competitors.map(comp => (
                    <div key={comp.id} className="p-6 border border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Competitor Name</label>
                          <input
                            value={comp.name}
                            onChange={e => updateCompetitorName(comp.id, e.target.value)}
                            className="w-full border border-slate-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-bold"
                            placeholder="e.g., Nike Pegasus"
                          />
                        </div>
                        <button
                          onClick={() => removeCompetitor(comp.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all ml-2 mt-5"
                          title="Remove Competitor"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {product.metricDefinitions.map(def => (
                          <div key={def.id} className="flex flex-col gap-1">
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">{def.name} ({def.unit})</label>
                            <input
                              type="number"
                              value={comp.metrics[def.id] || 0}
                              onChange={e => updateCompetitorMetric(comp.id, def.id, Number(e.target.value))}
                              className="w-full border border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xs font-mono font-bold"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addCompetitor}
                    className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all font-black text-xs uppercase tracking-widest min-h-[200px]"
                  >
                    <Plus size={32} />
                    <span>Add New Competitor</span>
                  </button>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={() => setIsCompetitorsModalOpen(false)} className="px-10 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20">
                  DONE
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manage Metrics Modal */}
      <AnimatePresence>
        {isMetricsModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setIsMetricsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Configure Product Metrics</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Define laboratory benchmarks for {product.name}</p>
                </div>
                <button onClick={() => setIsMetricsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 flex flex-col gap-4 bg-white">
                {product.metricDefinitions.map(def => (
                  <div key={def.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 border border-slate-200 rounded-2xl bg-slate-50/50">
                    <div className="flex-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Metric Name</label>
                      <input
                        value={def.name}
                        onChange={e => updateMetricDef(def.id, 'name', e.target.value)}
                        className="w-full border border-slate-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-bold"
                        placeholder="e.g., Viscosity"
                      />
                    </div>
                    <div className="w-full sm:w-28">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Unit</label>
                      <input
                        value={def.unit}
                        onChange={e => updateMetricDef(def.id, 'unit', e.target.value)}
                        className="w-full border border-slate-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-mono font-bold"
                        placeholder="e.g., cP"
                      />
                    </div>
                    <div className="flex items-center gap-6 sm:mt-6">
                      <label className="flex items-center gap-3 text-xs font-black text-slate-600 uppercase tracking-wider cursor-pointer group">
                        <div className={clsx(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                          def.higherIsBetter ? "bg-indigo-600 border-indigo-600" : "border-slate-300 group-hover:border-indigo-400"
                        )}>
                          {def.higherIsBetter && <CheckCircle size={12} className="text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={def.higherIsBetter}
                          onChange={e => updateMetricDef(def.id, 'higherIsBetter', e.target.checked)}
                          className="hidden"
                        />
                        H.I.B.
                      </label>
                      <button
                        onClick={() => removeMetricDef(def.id)}
                        className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all ml-auto sm:ml-0"
                        title="Remove Metric"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addMetricDef}
                  className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all font-black text-xs uppercase tracking-widest"
                >
                  <Plus size={20} /> Add New Metric Definition
                </button>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={() => setIsMetricsModalOpen(false)} className="px-10 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20">
                  SAVE CONFIGURATION
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* R&D Feedback Slide-over */}
      <AnimatePresence>
        {rejectingSample && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80]"
              onClick={() => setRejectingSample(null)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-[90] flex flex-col border-l border-slate-200"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">R&D Feedback Report</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Batch ID: {rejectingSample.batchId}</p>
                </div>
                <button onClick={() => setRejectingSample(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                  <XCircle size={28} />
                </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto flex flex-col gap-8">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Benchmark Failure Analysis</h3>
                  <div className="flex flex-col gap-3">
                    {getFailedMetricsAgainstAll(rejectingSample).map((m, idx) => (
                      <div key={idx} className="flex flex-col gap-2 p-5 bg-rose-50 border border-rose-100 rounded-2xl">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-xs text-rose-900 uppercase tracking-tight">{m.def.name}</span>
                          <span className="text-[10px] font-bold text-rose-400 uppercase">vs {m.cName}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-rose-400 uppercase">Sample</span>
                            <span className="text-xl font-mono font-black text-rose-700">{m.sVal}{m.def.unit}</span>
                          </div>
                          <ArrowRight size={16} className="text-rose-300" />
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-rose-400 uppercase">Target</span>
                            <span className="text-xl font-mono font-black text-rose-700">{m.cVal}{m.def.unit}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {getFailedMetricsAgainstAll(rejectingSample).length === 0 && (
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 italic font-medium">
                        No metrics performed worse than the competitor benchmarks.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">PM Directives & Comments</label>
                  <textarea
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    className="w-full h-56 p-5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none resize-none text-sm font-medium transition-all"
                    placeholder="Provide detailed reformulation instructions..."
                  />
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
                <button onClick={() => setRejectingSample(null)} className="flex-1 px-6 py-4 border border-slate-200 bg-white text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                  CANCEL
                </button>
                <button onClick={submitRejection} className="flex-2 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20 flex items-center justify-center gap-3">
                  <Download size={18} /> GENERATE R&D REPORT
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
