
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Dice5, Wand2, Palette, Type, Library, Grid, LayoutGrid, Settings, X, RectangleVertical, Square } from 'lucide-react';
import { generatePokemonData, generatePokemonImage, optimizePrompt, generateEvolutionData, generateRandomPrompt, generatePreEvolutionData } from './services/geminiService';
import { CreatureData, GenerationStatus, SavedCreature } from './types';
import PokemonCard from './components/PokemonCard';
import PokemonCardSquare from './components/PokemonCardSquare';
import PokemonList from './components/PokemonList';
import { ART_STYLES } from './constants';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('fantasy_concept');
  const [cardTemplate, setCardTemplate] = useState<'classic' | 'square'>('classic');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [currentPokemon, setCurrentPokemon] = useState<CreatureData | null>(null);
  const [pokemonImage, setPokemonImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [view, setView] = useState<'create' | 'gallery'>('create');

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // History Management
  const [history, setHistory] = useState<SavedCreature[]>(() => {
    try {
      const saved = localStorage.getItem('creatureHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('creatureHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (showSettings) {
      setApiKeyInput(localStorage.getItem('custom_gemini_api_key') || '');
    }
  }, [showSettings]);

  const handleSaveKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('custom_gemini_api_key', apiKeyInput.trim());
    } else {
      localStorage.removeItem('custom_gemini_api_key');
    }
    setShowSettings(false);
  };

  const addToHistory = (data: CreatureData, img: string | null) => {
    const newRecord: SavedCreature = {
      id: data.id,
      data,
      imageUrl: img,
      timestamp: Date.now()
    };
    setHistory(prev => [newRecord, ...prev]);
  };

  const handleOptimize = async () => {
    if (!prompt) return;
    setIsOptimizing(true);
    try {
      const optimized = await optimizePrompt(prompt);
      setPrompt(optimized);
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;

    setStatus(GenerationStatus.GENERATING_DATA);
    setError(null);
    setCurrentPokemon(null);
    setPokemonImage(null);

    try {
      // 1. Generate Data
      const data = await generatePokemonData(prompt, customName || undefined);
      setCurrentPokemon(data);

      // 2. Generate Image
      setStatus(GenerationStatus.GENERATING_IMAGE);
      const imageUrl = await generatePokemonImage(prompt, data, selectedStyle);
      setPokemonImage(imageUrl);
      
      setStatus(GenerationStatus.COMPLETE);
      addToHistory(data, imageUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "生成失败，请重试");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleRandom = async () => {
    setIsRandomizing(true);
    try {
      // Try to get AI generated prompt
      const randomPrompt = await generateRandomPrompt();
      setPrompt(randomPrompt);
    } catch (e) {
      console.error("AI Random failed, falling back to local", e);
      // Fallback to local random prompts
      const prompts = [
        "一只以星云为食的宇宙鲸鱼，带有水晶鳍",
        "赛博朋克风格的机械九尾狐，霓虹灯管",
        "森林深处的守护者，由树根和苔藓构成的巨像",
        "在火山熔岩中游动的火蛇，鳞片如黑曜石",
        "掌握时间魔法的古老猫头鹰，金色齿轮装饰",
      ];
      setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
    } finally {
      setIsRandomizing(false);
    }
  };

  const handleEvolve = async () => {
    if (!currentPokemon) return;
    
    const previousData = currentPokemon;
    setStatus(GenerationStatus.GENERATING_DATA);
    setError(null);

    try {
      // 1. Generate Evolution Data (Standard)
      const evolvedData = await generateEvolutionData(previousData, false);
      setCurrentPokemon(evolvedData);

      // 2. Generate Image
      setStatus(GenerationStatus.GENERATING_IMAGE);
      const description = `Ascended form of ${previousData.name}. ${evolvedData.species}. ${evolvedData.archiveLog}`;
      const imageUrl = await generatePokemonImage(description, evolvedData, selectedStyle);
      setPokemonImage(imageUrl);

      setStatus(GenerationStatus.COMPLETE);
      addToHistory(evolvedData, imageUrl);
    } catch (err: any) {
      console.error(err);
      setError("幻化失败: " + err.message);
      setStatus(GenerationStatus.ERROR);
      // Revert to previous if failed
      setCurrentPokemon(previousData);
    }
  };

  const handleUltimateEvolve = async () => {
    if (!currentPokemon) return;
    
    const previousData = currentPokemon;
    setStatus(GenerationStatus.GENERATING_DATA);
    setError(null);

    try {
      // 1. Generate Ultimate Evolution Data
      const evolvedData = await generateEvolutionData(previousData, true);
      setCurrentPokemon(evolvedData);

      // 2. Generate Image
      setStatus(GenerationStatus.GENERATING_IMAGE);
      const description = `Awakened Ultimate God-like form of ${previousData.name}. Overwhelming presence. ${evolvedData.species}. ${evolvedData.archiveLog}`;
      const imageUrl = await generatePokemonImage(description, evolvedData, selectedStyle);
      setPokemonImage(imageUrl);

      setStatus(GenerationStatus.COMPLETE);
      addToHistory(evolvedData, imageUrl);
    } catch (err: any) {
      console.error(err);
      setError("觉醒失败: " + err.message);
      setStatus(GenerationStatus.ERROR);
      setCurrentPokemon(previousData);
    }
  };

  const handleGeneratePreEvolution = async (targetName: string) => {
    if (!currentPokemon) return;
    
    const currentData = currentPokemon;
    setStatus(GenerationStatus.GENERATING_DATA);
    setError(null);

    try {
      // 1. Generate Pre-Evolution Data
      const newData = await generatePreEvolutionData(currentData, targetName);
      setCurrentPokemon(newData);

      // 2. Generate Image
      setStatus(GenerationStatus.GENERATING_IMAGE);
      const description = `Younger/Initial form of ${currentData.name}, named ${targetName}. ${newData.species}. ${newData.archiveLog}`;
      const imageUrl = await generatePokemonImage(description, newData, selectedStyle);
      setPokemonImage(imageUrl);

      setStatus(GenerationStatus.COMPLETE);
      addToHistory(newData, imageUrl);
    } catch (err: any) {
      console.error(err);
      setError("生成前置形态失败: " + err.message);
      setStatus(GenerationStatus.ERROR);
      setCurrentPokemon(currentData);
    }
  };

  const handlePreview = (name: string) => {
    const record = history.find(item => item.data.name === name);
    if (record) {
      setCurrentPokemon(record.data);
      setPokemonImage(record.imageUrl);
      setView('create');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这份档案吗？')) {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  // Get all available forms (names) from history
  const availableForms = history.map(h => h.data.name);

  // Helper to get the longest evolution chain found in history that contains the current pokemon
  const getFullEvolutionChain = () => {
    if (!currentPokemon) return [];

    const relevantChains = history
      .map(h => h.data.evolutionChain || [])
      .filter(chain => chain && Array.isArray(chain) && chain.includes(currentPokemon.name));
    
    if (currentPokemon.evolutionChain) {
        relevantChains.push(currentPokemon.evolutionChain);
    }

    relevantChains.sort((a, b) => b.length - a.length);
    
    return relevantChains[0] || [];
  };
  
  const fullEvolutionChain = getFullEvolutionChain();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100">
      
      {/* Minimalist Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setView('create')}>
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-md group-hover:rotate-12 transition-transform">
              <Grid size={18} />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900">
              AI <span className="text-slate-400 font-normal">Phantom Lab</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setView('create')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'create' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Wand2 size={14} /> <span className="hidden sm:inline">创造</span>
              </button>
              <button 
                onClick={() => setView('gallery')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'gallery' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Library size={14} /> <span className="hidden sm:inline">博物志</span>
                {history.length > 0 && <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 rounded-full">{history.length}</span>}
              </button>
            </nav>
            <button 
              onClick={() => setShowSettings(true)} 
              className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100"
              title="设置"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {view === 'create' ? (
          <>
            {/* Input Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-2 mb-8 transition-all focus-within:shadow-lg focus-within:border-indigo-300">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="描述你想象中的奇幻生物... (例如：深海中的发光海妖，用水晶歌唱)"
                  className="w-full h-28 p-4 bg-transparent text-lg resize-none focus:outline-none text-slate-700 placeholder:text-slate-300"
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button
                    onClick={handleRandom}
                    disabled={isRandomizing}
                    className={`p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors ${isRandomizing ? 'animate-spin text-indigo-500' : ''}`}
                    title="AI 随机灵感"
                  >
                    <Dice5 size={20} />
                  </button>
                  <button
                    onClick={handleOptimize}
                    disabled={isOptimizing || !prompt}
                    className={`p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors ${isOptimizing ? 'animate-spin' : ''}`}
                    title="AI 优化提示词"
                  >
                    {isOptimizing ? <Loader2 size={20} /> : <Wand2 size={20} />}
                  </button>
                </div>
              </div>

              {/* Settings Bar */}
              <div className="bg-slate-50 rounded-2xl p-3 flex flex-wrap gap-4 items-center border-t border-slate-100">
                 {/* Name Input */}
                 <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 focus-within:border-indigo-400 transition-colors flex-1 min-w-[160px]">
                    <Type size={16} className="text-slate-400" />
                    <input 
                      type="text" 
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="名称 (可选)" 
                      className="bg-transparent text-sm outline-none w-full font-medium text-slate-700 placeholder:text-slate-300"
                    />
                 </div>

                 {/* Style Selector */}
                 <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 flex-1 min-w-[160px] relative group">
                    <Palette size={16} className="text-slate-400" />
                    <select 
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="bg-transparent text-sm outline-none w-full font-medium text-slate-700 appearance-none cursor-pointer"
                    >
                      {ART_STYLES.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                 </div>

                 {/* Template Switcher */}
                 <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                    <button 
                        onClick={() => setCardTemplate('classic')}
                        className={`p-2 rounded-lg transition-colors ${cardTemplate === 'classic' ? 'bg-slate-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="经典卡片"
                    >
                        <RectangleVertical size={18} />
                    </button>
                    <button 
                        onClick={() => setCardTemplate('square')}
                        className={`p-2 rounded-lg transition-colors ${cardTemplate === 'square' ? 'bg-slate-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="方形卡片"
                    >
                        <Square size={18} />
                    </button>
                 </div>

                 {/* Generate Button */}
                 <button
                    onClick={handleGenerate}
                    disabled={status === GenerationStatus.GENERATING_DATA || status === GenerationStatus.GENERATING_IMAGE || !prompt}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto flex justify-center items-center gap-2"
                  >
                    {status === GenerationStatus.GENERATING_DATA || status === GenerationStatus.GENERATING_IMAGE ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>{status === GenerationStatus.GENERATING_DATA ? '构思中...' : '绘制中...'}</span>
                      </>
                    ) : (
                      <>
                        <LayoutGrid size={16} />
                        <span>创造幻兽</span>
                      </>
                    )}
                  </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 flex items-center gap-3 border border-red-100 animate-fade-in-up">
                <AlertCircle size={20} />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Main Result Card */}
            {(currentPokemon || status !== GenerationStatus.IDLE) && (
              <div className="animate-fade-in-up">
                 {(status === GenerationStatus.GENERATING_DATA || status === GenerationStatus.GENERATING_IMAGE) && !currentPokemon ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] shadow-lg border border-slate-100">
                        <div className="relative w-32 h-32 mb-8">
                           <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                           <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                           <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 bg-indigo-50 rounded-full animate-pulse flex items-center justify-center text-indigo-500">
                                 <LayoutGrid size={32} className="animate-bounce" />
                              </div>
                           </div>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2 animate-pulse">
                           {status === GenerationStatus.GENERATING_DATA ? '正在构筑灵魂...' : '正在绘制形态...'}
                        </h2>
                        <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">
                           AI Neural Network Processing
                        </p>
                    </div>
                 ) : (
                    currentPokemon && (
                        cardTemplate === 'square' ? (
                            <PokemonCardSquare 
                                data={currentPokemon}
                                imageUrl={pokemonImage}
                                onEvolve={handleEvolve}
                                onUltimateEvolve={handleUltimateEvolve}
                                onPreview={handlePreview}
                                onGeneratePreEvolution={handleGeneratePreEvolution}
                                availableForms={availableForms}
                                fullEvolutionChain={fullEvolutionChain}
                                isBusy={status === GenerationStatus.GENERATING_DATA || status === GenerationStatus.GENERATING_IMAGE}
                            />
                        ) : (
                            <PokemonCard
                                data={currentPokemon}
                                imageUrl={pokemonImage}
                                onEvolve={handleEvolve}
                                onUltimateEvolve={handleUltimateEvolve}
                                onPreview={handlePreview}
                                onGeneratePreEvolution={handleGeneratePreEvolution}
                                availableForms={availableForms}
                                fullEvolutionChain={fullEvolutionChain}
                                isBusy={status === GenerationStatus.GENERATING_DATA || status === GenerationStatus.GENERATING_IMAGE}
                            />
                        )
                    )
                 )}
              </div>
            )}
          </>
        ) : (
          <PokemonList 
            items={history} 
            onSelect={(item) => handlePreview(item.data.name)} 
            onDelete={handleDeleteHistory}
          />
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-scale-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">设置 API Key</h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                  默认使用系统内置 Key。如果您想使用自己的 Gemini API Key，请在此输入。
                  <br/><span className="text-xs text-indigo-500 mt-1 inline-block">Key 仅存储在您的本地浏览器中，不会上传到服务器。</span>
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gemini API Key</label>
                  <input 
                    type="password" 
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-mono text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                 <button 
                   onClick={() => {
                     setApiKeyInput('');
                     localStorage.removeItem('custom_gemini_api_key');
                     setShowSettings(false);
                   }}
                   className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
                 >
                   清除 / 重置
                 </button>
                 <button 
                   onClick={handleSaveKey}
                   className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5"
                 >
                   保存设置
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
