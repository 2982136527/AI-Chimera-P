
import React, { useRef, useState, useEffect } from 'react';
import { CreatureData } from '../types';
import StatRadar from './StatRadar';
import TypeBadge from './TypeBadge';
import { TYPE_COLORS } from '../constants';
import { Dna, Loader2, Crown, Hexagon, Swords, Download, Share2, Sparkles, ChevronRight, DnaOff } from 'lucide-react';

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

const PokemonCard: React.FC<PokemonCardProps> = ({ 
  data, 
  imageUrl, 
  onEvolve, 
  onUltimateEvolve, 
  onPreview,
  onGeneratePreEvolution,
  availableForms = [], 
  fullEvolutionChain = [],
  isBusy 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // Animation states
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [evolutionType, setEvolutionType] = useState<'normal' | 'ultimate'>('normal');

  // Safe check for data integrity to prevent crashes
  const hasValidData = data && data.stats && data.types;
  
  // Determine primary color based on the first type
  const mainType = hasValidData && (data.types || []).length > 0 ? data.types[0] : 'Normal';
  const themeColor = TYPE_COLORS[mainType] || '#6366f1';

  const evolutionChainSafe = data?.evolutionChain || [];
  // Use full evolution chain if available and valid, otherwise fallback to data's chain
  const displayChain = (fullEvolutionChain.length > 0 && fullEvolutionChain.includes(data.name))
      ? fullEvolutionChain 
      : evolutionChainSafe;

  const currentStageIndex = displayChain.indexOf(data.name);
  
  const canStandardEvolve = currentStageIndex !== -1 && currentStageIndex < 2;
  const canUltimateEvolve = currentStageIndex === 2;

  useEffect(() => {
    if (isBusy) {
       setIsAnimatingOut(true);
    } else {
       const timer = setTimeout(() => setIsAnimatingOut(false), 300);
       return () => clearTimeout(timer);
    }
  }, [isBusy]);

  const handleEvolveClick = () => {
    if (onEvolve) {
        setEvolutionType('normal');
        setIsAnimatingOut(true);
        setTimeout(() => {
            onEvolve();
        }, 600);
    }
  };

  const handleUltimateClick = () => {
    if (onUltimateEvolve) {
        setEvolutionType('ultimate');
        setIsAnimatingOut(true);
        setTimeout(() => {
            onUltimateEvolve();
        }, 600);
    }
  };

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
      
      // Simple mobile detection
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

      if (isMobile) {
          const link = document.createElement('a');
          link.download = `Phantom_${data.name}_${data.id.slice(0, 8)}.png`;
          link.href = imgData;
          link.click();
      } else {
          const link = document.createElement('a');
          link.download = `Phantom_${data.name}_${data.id.slice(0, 8)}.png`;
          link.href = imgData;
          link.click();
      }
    } catch (err) {
      console.error('Save failed', err);
      alert('保存图片失败，请重试');
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
                    title: `查看我的 AI 幻兽：${data.name}`,
                    text: `我在 AI 幻兽工坊发现了一只神奇的生物：${data.name}！\n${data.archiveLog.slice(0, 60)}...`,
                    files: [file],
                });
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 3000);
            } catch (err) {
                console.debug('Share cancelled or failed', err);
            }
        } else {
             // Desktop fallback - just open image
             const url = URL.createObjectURL(blob);
             window.open(url, '_blank');
        }
        setIsSharing(false);
      }, 'image/png');
    } catch (err) {
      console.error('Share generation failed', err);
      setIsSharing(false);
    }
  };

  if (!data) return null;

  return (
    <div className={`w-full max-w-3xl mx-auto transition-all duration-500 ${isAnimatingOut ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
      
      {/* The Card Itself - This is what gets captured */}
      <div 
        ref={cardRef}
        className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden relative"
      >
         {/* Background Ambience */}
         <div 
           className="absolute top-0 left-0 right-0 h-80 opacity-10 pointer-events-none"
           style={{ 
             background: `radial-gradient(circle at 50% 0%, ${themeColor}, transparent 70%)` 
           }}
         />

         {/* Header */}
         <div className="relative p-6 sm:p-8 pb-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                 <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-2">
                   {data.name}
                   {currentStageIndex === 2 && <Crown size={24} className="text-amber-500 fill-amber-200" />}
                 </h1>
                 <div className="flex items-center gap-3 text-slate-400 font-serif italic">
                    <span className="text-lg">{data.englishName}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-sm font-sans uppercase tracking-wider">{data.species}</span>
                 </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className="flex gap-1.5">
                    {data.types.map(t => <TypeBadge key={t} type={t} />)}
                 </div>
                 <div className="text-[10px] font-mono text-slate-300">
                    #{data.id.slice(2, 8).toUpperCase()}
                 </div>
              </div>
            </div>

            {/* Image Container */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-white/60 to-slate-50/60 border border-slate-100 shadow-inner mb-8 group">
               {imageUrl ? (
                 <img 
                   src={imageUrl} 
                   alt={data.name}
                   className="w-full h-full object-cover drop-shadow-2xl transform transition-transform duration-700 group-hover:scale-105"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Loader2 className="animate-spin" size={48} />
                 </div>
               )}
               
               {/* Stats Overlay (Height/Weight) */}
               <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-md rounded-xl p-3 flex justify-between text-xs font-bold text-slate-600 border border-white/50 shadow-sm">
                  <div className="flex flex-col items-center flex-1 border-r border-slate-200">
                     <span className="text-[10px] text-slate-400 uppercase">Height</span>
                     {data.height}
                  </div>
                  <div className="flex flex-col items-center flex-1">
                     <span className="text-[10px] text-slate-400 uppercase">Weight</span>
                     {data.weight}
                  </div>
               </div>
            </div>

            {/* Layout Grid for Stats & Details */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                
                {/* Left: Radar Chart */}
                <div className="md:col-span-2 bg-slate-50 rounded-2xl border border-slate-100 p-4 relative flex flex-col">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <Hexagon size={12} /> 核心数值
                   </div>
                   <div className="flex-1 flex items-center justify-center -ml-2">
                      <StatRadar stats={data.stats} />
                   </div>
                </div>

                {/* Right: Traits & Skills */}
                <div className="md:col-span-3 space-y-4">
                    {/* Trait */}
                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                       <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={14} className="text-indigo-500" />
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">天赋特质</span>
                       </div>
                       <h3 className="font-bold text-slate-800 text-sm mb-1">{data.trait.name}</h3>
                       <p className="text-xs text-slate-600 leading-relaxed">{data.trait.description}</p>
                    </div>

                    {/* Skills */}
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                       <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                          <Swords size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">技能组</span>
                       </div>
                       <div className="divide-y divide-slate-50">
                          {data.skills.slice(0, 3).map((skill, idx) => (
                             <div key={idx} className="p-3 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                   <span className="font-bold text-xs text-slate-700">{skill.name}</span>
                                   <span className="text-[10px] px-1.5 rounded bg-slate-100 text-slate-500">{skill.type}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed">{skill.description}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                </div>
            </div>

            {/* Lore */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: themeColor }}></div>
               <p className="text-sm text-slate-600 italic leading-7 relative z-10">
                 <span className="text-2xl text-slate-300 absolute -top-2 -left-1 font-serif">"</span>
                 {data.archiveLog}
                 <span className="text-2xl text-slate-300 absolute -bottom-4 ml-1 font-serif">"</span>
               </p>
            </div>

            {/* Evolution Chain */}
            {displayChain.length > 0 && (
               <div className="flex items-center justify-between gap-2 bg-white rounded-xl p-3 border border-slate-100 shadow-sm overflow-x-auto">
                  {displayChain.map((name, idx) => {
                     const isCurrent = name === data.name;
                     const isUnlocked = availableForms.includes(name) || isCurrent;
                     
                     return (
                        <React.Fragment key={idx}>
                           <div 
                              onClick={() => isUnlocked && onPreview && onPreview(name)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                                 isCurrent 
                                    ? 'bg-slate-900 text-white shadow-md' 
                                    : isUnlocked
                                      ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer'
                                      : 'bg-transparent text-slate-300 cursor-not-allowed border border-dashed border-slate-200'
                              }`}
                           >
                              <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-green-400' : isUnlocked ? 'bg-slate-400' : 'bg-slate-200'}`}></div>
                              <span className="text-xs font-bold">{name}</span>
                           </div>
                           {idx < displayChain.length - 1 && (
                              <ChevronRight size={12} className="text-slate-300 shrink-0" />
                           )}
                        </React.Fragment>
                     );
                  })}
                  
                  {/* Add Pre-evolution button if this is the first form and we don't have a full chain yet */}
                  {currentStageIndex === 0 && !displayChain.length && onGeneratePreEvolution && (
                     <>
                        <div className="text-slate-300 rotate-180"><ChevronRight size={12} /></div>
                        <button 
                          onClick={() => onGeneratePreEvolution('幼年' + data.name)}
                          className="px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-400 text-xs hover:bg-slate-50 hover:text-slate-600 transition-colors whitespace-nowrap"
                        >
                           + 幼年体
                        </button>
                     </>
                  )}
               </div>
            )}
         </div>

         {/* Card Footer Branding */}
         <div className="bg-slate-50 border-t border-slate-100 p-3 flex justify-between items-center">
             <div className="flex items-center gap-1.5 text-slate-400">
                <Dna size={12} />
                <span className="text-[10px] font-mono uppercase tracking-widest">Phantom Lab Genetic Sequence</span>
             </div>
             <div className="text-[10px] text-slate-300 font-mono">
                GenAI Model 2.5
             </div>
         </div>
      </div>

      {/* Control Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
         <div className="flex gap-2 w-full sm:w-auto">
            <button 
               onClick={handleSaveCard}
               disabled={isSaving}
               className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
               {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
               保存卡片
            </button>
            <button 
               onClick={handleShareCard}
               disabled={isSharing}
               className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold transition-all shadow-sm ${shareSuccess ? 'text-green-600 border-green-200 bg-green-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
               {isSharing ? <Loader2 size={16} className="animate-spin" /> : shareSuccess ? <Sparkles size={16} /> : <Share2 size={16} />}
               {shareSuccess ? '已调用分享' : '分享'}
            </button>
         </div>

         <div className="flex gap-2 w-full sm:w-auto">
            {canStandardEvolve && onEvolve && (
               <button 
                  onClick={handleEvolveClick}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border-2 border-slate-900 text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-900 hover:text-white transition-all shadow-md hover:shadow-lg group"
               >
                  <Dna size={16} className="group-hover:animate-spin-slow" />
                  幻化进化
               </button>
            )}
            
            {canUltimateEvolve && onUltimateEvolve && (
               <button 
                  onClick={handleUltimateClick}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-bold hover:shadow-orange-200 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md group"
               >
                  <Crown size={16} className="group-hover:animate-pulse" />
                  究极觉醒
               </button>
            )}
         </div>
      </div>
    </div>
  );
};

export default PokemonCard;
