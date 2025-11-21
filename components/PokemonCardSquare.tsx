import React, { useRef, useState } from 'react';
import { CreatureData } from '../types';
import StatRadar from './StatRadar';
import TypeBadge from './TypeBadge';
import { TYPE_COLORS } from '../constants';
import { Dna, Loader2, Crown, Download, Share2, Sparkles, Activity, Ruler, Weight } from 'lucide-react';

interface PokemonCardProps {
  data: CreatureData;
  imageUrl: string | null;
  onEvolve?: () => void;
  onUltimateEvolve?: () => void;
  onPreview?: (name: string) => void;
  onGeneratePreEvolution?: (name: string) => void;
  availableForms?: string[];
  fullEvolutionChain?: string[]; 
  isBusy?: boolean;
}

const PokemonCardSquare: React.FC<PokemonCardProps> = ({ 
  data, 
  imageUrl, 
  onEvolve, 
  onUltimateEvolve,
  fullEvolutionChain = [],
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  const hasValidData = data && data.stats && data.types;
  const mainType = hasValidData && (data.types || []).length > 0 ? data.types[0] : 'Normal';
  const themeColor = TYPE_COLORS[mainType] || '#6366f1';

  const evolutionChainSafe = data?.evolutionChain || [];
  const displayChain = (fullEvolutionChain.length > 0 && fullEvolutionChain.includes(data.name))
      ? fullEvolutionChain 
      : evolutionChainSafe;
  const currentStageIndex = displayChain.indexOf(data.name);
  
  const canStandardEvolve = currentStageIndex !== -1 && currentStageIndex < 2;
  const canUltimateEvolve = currentStageIndex === 2;

  const handleSaveCard = async () => {
    if (!cardRef.current) return;
    setIsSaving(true);
    try {
      // @ts-ignore
      const html2canvas = window.html2canvas;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Phantom_Square_${data.name}.png`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error('Save failed', err);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareCard = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);
    try {
      // @ts-ignore
      const html2canvas = window.html2canvas;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) return;
        if (navigator.share) {
            try {
                const file = new File([blob], `Phantom_${data.name}.png`, { type: 'image/png' });
                await navigator.share({
                    title: `AI 幻兽：${data.name}`,
                    files: [file],
                });
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 3000);
            } catch (err) { console.debug(err); }
        } else {
             const url = URL.createObjectURL(blob);
             window.open(url, '_blank');
        }
        setIsSharing(false);
      }, 'image/png');
    } catch (err) { setIsSharing(false); }
  };

  if (!data) return null;

  return (
    <div className="w-full max-w-[600px] mx-auto animate-fade-in-up">
        {/* Square Container - Full Art Style */}
        <div 
            ref={cardRef}
            className="aspect-square bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden relative group select-none"
        >
            {/* Background Image - Fills 100% */}
            {imageUrl ? (
                <img 
                    src={imageUrl} 
                    alt={data.name} 
                    className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-[2s] group-hover:scale-110"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-0">
                    <Loader2 className="animate-spin text-slate-500" size={48} />
                </div>
            )}

            {/* Overlay Gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 z-10 pointer-events-none"></div>

            {/* Content Layer */}
            <div className="absolute inset-0 z-20 flex flex-col justify-between p-6">
                
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="text-white drop-shadow-lg">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {data.name}
                            {currentStageIndex === 2 && <Crown size={28} className="text-amber-400 fill-amber-400/50 animate-pulse" />}
                        </h1>
                        <div className="flex items-center gap-2 font-serif italic opacity-90">
                            <span className="text-lg text-slate-200">{data.englishName}</span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                            <span className="text-xs text-slate-300 uppercase tracking-wider">{data.species}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-1 shadow-lg">
                             {data.types.map(t => <TypeBadge key={t} type={t} />)}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-white/80 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                            <span className="flex items-center gap-1"><Ruler size={10} /> {data.height}</span>
                            <span className="flex items-center gap-1"><Weight size={10} /> {data.weight}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Info Panel (Glassmorphism) */}
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/40 flex gap-4 items-center">
                    {/* Radar - Compact */}
                    <div className="w-20 h-20 shrink-0 relative">
                        <StatRadar stats={data.stats} className="w-full h-full" compact={true} />
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0 border-l border-slate-200 pl-4">
                         <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-1.5">
                                <Sparkles size={14} className="text-indigo-600" />
                                <span className="font-bold text-sm text-slate-800">{data.trait.name}</span>
                             </div>
                             <span className="text-[10px] font-mono text-slate-400">#{data.id.slice(2, 6).toUpperCase()}</span>
                         </div>
                         <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-1">
                             {data.trait.description}
                         </p>
                         <p className="text-[10px] text-slate-400 italic line-clamp-1">
                             "{data.archiveLog}"
                         </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-between gap-3 px-2 sm:px-0">
            <div className="flex gap-2 w-full sm:w-auto">
                 <button onClick={handleSaveCard} className="flex-1 sm:flex-none py-3 px-4 bg-white rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm flex items-center justify-center gap-2 text-sm font-bold transition-colors">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    <span className="hidden sm:inline">保存</span>
                 </button>
                 <button onClick={handleShareCard} className={`flex-1 sm:flex-none py-3 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm transition-colors flex items-center justify-center gap-2 text-sm font-bold ${shareSuccess ? 'text-green-600 bg-green-50 border-green-200' : 'text-slate-600 hover:text-slate-900'}`}>
                    {isSharing ? <Loader2 size={18} className="animate-spin" /> : shareSuccess ? <Sparkles size={18} /> : <Share2 size={18} />}
                 </button>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
                {canStandardEvolve && onEvolve && (
                   <button 
                      onClick={() => { onEvolve(); }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
                   >
                      <Dna size={16} /> 进化
                   </button>
                )}
                {canUltimateEvolve && onUltimateEvolve && (
                   <button 
                      onClick={() => { onUltimateEvolve(); }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                   >
                      <Crown size={16} /> 觉醒
                   </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default PokemonCardSquare;