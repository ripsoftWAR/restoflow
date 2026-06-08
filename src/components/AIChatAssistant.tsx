import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  CornerDownLeft, 
  TrendingUp, 
  AlertTriangle, 
  PlusCircle, 
  PackageCheck, 
  Utensils, 
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { Ingredient, RecipeWithDetails } from '../types';

interface AIChatAssistantProps {
  ingredients: Ingredient[];
  recipes: RecipeWithDetails[];
  onRefreshData: () => Promise<void>;
  embedded?: boolean;
  onClose?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function AIChatAssistant({ ingredients, recipes, onRefreshData, embedded = false, onClose }: AIChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Halo! Saya **AI Koki & Asisten RestoFlow**. Saya terintegrasi penuh dengan database PostgreSQL restoran Anda.\n\nSaya bisa membantu Anda:\n1. 📈 **Mengisi sediaan** (misal: *"Tolong tambah stock Wortel sebanyak 2 kg"*)\n2. 🍳 **Membuat Resep Baru** (misal: *"Buat resep Jus Wortel Segar dengan bahan Wortel 200 gram dan Gula 15 gram"*)\n3. 📊 **Analisis Operasional** (misal: *"Bahan apa saja yang kritis?"* atau *"Beri rekomendasi menu penutup baru"*)\n\nSilakan pilih template proaktif di bawah atau ketik perintah Anda!'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<{ label: string; text: string; icon: any; color: string }[]>([]);
  
  // Floating position state (for custom dragging offset fallback if screen sizes are weird)
  const [dragged, setDragged] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const showChat = embedded || isOpen;
  const rootWrapperClassName = embedded
    ? 'flex flex-col h-full overflow-hidden'
    : 'fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-4 lg:p-6';
  const contentWrapperClassName = embedded
    ? 'bg-white w-full h-full rounded-3xl border border-slate-200 overflow-hidden flex flex-col'
    : 'bg-white w-full h-full md:max-w-4xl md:h-[85vh] md:rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col relative';

  // Set proactive templates dynamically based on current DB state!
  useEffect(() => {
    const tmp = [];
    
    // 1. Critical stock alert template
    const lowStockItems = ingredients.filter(i => i.stock <= i.min_stock);
    if (lowStockItems.length > 0) {
      const topLow = lowStockItems[0];
      tmp.push({
        label: `🚨 Restock: ${topLow.name} menipis!`,
        text: `Tolong tambahkan stock ${topLow.name} sebanyak ${topLow.base_unit === 'gram' ? '1 kg' : '20 pcs'}`,
        icon: AlertTriangle,
        color: 'text-amber-500 bg-amber-50 border-amber-200'
      });
    } else {
      // General restock proposal
      const candidate = ingredients[Math.floor(Math.random() * ingredients.length)] || { name: 'Cabai Merah', base_unit: 'gram' };
      tmp.push({
        label: `📦 Re-stock ${candidate.name}`,
        text: `Tolong isi ulang stock ${candidate.name} sebanyak ${candidate.base_unit === 'gram' ? '500 gram' : '10 pcs'}`,
        icon: PackageCheck,
        color: 'text-blue-500 bg-blue-50 border-blue-200'
      });
    }

    // 2. Recipe proposal template
    tmp.push({
      label: `🍛 Buat Resep Baru`,
      text: `Buat resep Nasi Goreng Spesial menggunakan bahan Bawang Merah 30 gram dan Cabai Merah 25 gram`,
      icon: Utensils,
      color: 'text-emerald-500 bg-emerald-50 border-emerald-200'
    });

    // 3. Operational Analysis template
    tmp.push({
      label: `📊 Analisis Bahan Kritis`,
      text: `Bahan baku apa saja yang stoknya di bawah batas minimum dan perlu diisi secepatnya? Bagikan rekomendasinya.`,
      icon: TrendingUp,
      color: 'text-purple-500 bg-purple-50 border-purple-200'
    });

    // 4. Creative dessert request
    tmp.push({
      label: `🍹 Rekomendasi Menu Baru`,
      text: `Saya ingin membuat menu minuman segar baru menggunakan stok Susu atau Gila. Apa rekomendasi resepnya?`,
      icon: Sparkles,
      color: 'text-pink-500 bg-pink-50 border-pink-200'
    });

    setTemplates(tmp);
  }, [ingredients, recipes]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  const rawApiBaseUrl = ((import.meta as any).env.VITE_API_URL || '').replace(/\/$/, '');
  const normalizeApiBaseUrl = (url: string) => {
    if (!url) return '';
    if (/^https?:\/\//.test(url)) return url.replace(/\/$/, '');
    return `https://${url.replace(/\/$/, '')}`;
  };
  const apiBaseUrl = normalizeApiBaseUrl(rawApiBaseUrl);
  const resolveApiUrl = (url: string) => url.startsWith('http') ? url : (apiBaseUrl ? `${apiBaseUrl}${url}` : url);

  const handleSendMessage = async (textToSend: string) => {
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('restoflow_session_id') : null;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch(resolveApiUrl('/api/gemini/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi asisten AI.');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
      
      // If AI executed action (like restock or recipe creation), refresh the global dashboard!
      if (data.actions && data.actions.length > 0) {
        const hasRefresh = data.actions.some((act: any) => act.type === 'REFRESH_DATA');
        if (hasRefresh) {
          await onRefreshData();
        }
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', text: `⚠️ **Error**: ${err.message || 'Gagal berkomunikasi dengan server backend.'}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format simplified bold/bullets/numbered lists markdown
  const renderMessageContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let content = line;
      
      // Formatting Bold (**text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={match.index} className="font-bold text-slate-900 border-b border-blue-100 bg-blue-50/50 px-1 rounded-sm">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const inlineContent = parts.length > 0 ? parts : content;

      // Unordered lists (- or *)
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const cleanText = line.replace(/^[\*\-]\s+/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-slate-700 leading-relaxed mb-1">
            {cleanText.includes('**') ? inlineContent : cleanText}
          </li>
        );
      }

      // Ordered lists (1. , 2. )
      const numMatch = line.trim().match(/^(\d+)\.\s+/);
      if (numMatch) {
        const cleanText = line.replace(/^\d+\.\s+/, '');
        return (
          <div key={idx} className="flex gap-2.5 ml-1 text-sm text-slate-700 leading-relaxed mb-1.5 items-start">
            <span className="font-mono text-[11px] bg-slate-100 text-slate-500 w-4 h-4 rounded-full flex items-center justify-center font-bold mt-0.5 shrink-0">
              {numMatch[1]}
            </span>
            <span className="flex-1">
              {line.includes('**') ? inlineContent : cleanText}
            </span>
          </div>
        );
      }

      // Normal lines
      return (
        <p key={idx} className="text-sm text-slate-700 leading-relaxed min-h-[1rem] mb-2">
          {inlineContent}
        </p>
      );
    });
  };

  return (
    <>
      {/* 1. MINIMIZED DRAGGABLE AVATAR HEAD ("bentuk wajah kecil namun bisa dimove keselruh arah") */}
      <AnimatePresence>
        {!embedded && !isOpen && (
          <motion.div
            id="ai-avatar-floating"
            role="button"
            drag
            dragMomentum={false}
            dragElastic={0.1}
            onDragStart={() => setDragged(true)}
            onDragEnd={() => setTimeout(() => setDragged(false), 200)}
            onClick={() => {
              if (!dragged) setIsOpen(true);
            }}
            initial={{ scale: 0, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{ touchAction: 'none' }}
            className="fixed bottom-24 right-6 sm:bottom-8 sm:right-8 z-50 cursor-grab active:cursor-grabbing select-none"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Ambient Pulsing Glow Rings */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-md opacity-70 animate-pulse"></div>
            
            <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-white rounded-full flex items-center justify-center text-white shadow-xl">
              {/* Smiling Facial Avatar Face structure inside the ball */}
              <div className="flex flex-col items-center justify-center gap-1">
                {/* Eyes blinking */}
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                </div>
                {/* Smiley mouth */}
                <svg className="w-4 h-1 text-white" fill="none" viewBox="0 0 16 4">
                  <path d="M1 1C5 3 11 3 15 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Little proactive indicators count badge */}
              <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white animate-bounce-subtle">
                AI
              </div>
            </div>
            
            {/* Pop-up bubble text helper */}
            <div className="absolute top-1/2 -left-36 -translate-y-1/2 bg-slate-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-[10px] font-semibold tracking-wide pointer-events-none opacity-0 group-hover:opacity-100 sm:block hidden shadow-md transition-opacity duration-300">
              Tanya RestoFlow AI 🍲
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FULL INTEGRATED MODE ACTIVE OVERLAY ("jika dibuka langsung mode chat ai bukan chat floating") */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            id="ai-active-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={rootWrapperClassName}
          >
            <motion.div
              initial={{ scale: embedded ? 1 : 0.95, y: embedded ? 0 : 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: embedded ? 0.95 : 0.95, y: embedded ? 0 : 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={contentWrapperClassName}
            >
              {/* Header block with elegant display styling */}
              <div className="p-5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-between shadow-md shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-blue-200 border border-white/20">
                    <Bot className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-sans font-bold text-base tracking-tight flex items-center gap-1.5">
                      RestoFlow AI Copilot 
                      <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-mono uppercase tracking-widest leading-none">
                        Live DB Access
                      </span>
                    </h2>
                    <p className="text-xs text-blue-100 opacity-85 mt-0.5">Asisten koki cerdas pelacak inventori & formulas resep</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (embedded && onClose) onClose();
                    else setIsOpen(false);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Tutup AI Chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Speech Screen Panel */}
              <div 
                ref={scrollRef}
                className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50"
              >
                {messages.map((msg, index) => {
                  const isAi = msg.role === 'assistant';
                  return (
                    <div 
                      key={index} 
                      className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                    >
                      {/* Speaker Badge Avatar */}
                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold font-mono shadow-sm ${
                        isAi ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isAi ? <Bot className="w-4 h-4" /> : 'ME'}
                      </div>

                      {/* Bubble message box */}
                      <div className={`p-4 rounded-2xl text-slate-800 shadow-sm leading-relaxed border ${
                        isAi 
                          ? 'bg-white rounded-tl-none border-slate-100 text-slate-800' 
                          : 'bg-blue-50/80 rounded-tr-none border-blue-100/90 text-blue-950'
                      }`}>
                        {isAi ? (
                          <div className="space-y-1">
                            {renderMessageContent(msg.text)}
                          </div>
                        ) : (
                          <p className="text-sm font-semibold">{msg.text}</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Submitting Loading indicator with JetBrains font */}
                {loading && (
                  <div className="flex gap-3 mr-auto items-center">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-slate-100 text-slate-400 p-3.5 rounded-2xl rounded-tl-none border border-slate-200/60 font-mono text-xs flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      <span>AI sedang memperoses database SQLite...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Suggestions Prompt Templates Panel */}
              <div className="border-t border-slate-150 px-6 py-4 bg-white space-y-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Instruksi Proaktif AI Ter-update:
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    Berdasarkan sisa sediaan gudang real-time
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {templates.map((tmp, idx) => {
                    const Icon = tmp.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(tmp.text)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] hover:-translate-y-0.5 active:translate-y-0 ${tmp.color}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tmp.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Input control bar */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="p-4 bg-slate-50 border-t border-slate-200/80 flex gap-3 h-20 items-center justify-between shrink-0"
              >
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Tanya stock master, resep, atau restock (misal: 'tambah stock Cabai Merah 2 kg')..."
                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 shadow-inner font-sans"
                    disabled={loading}
                    autoFocus
                  />
                  
                  {/* Absolute hint corner key badge */}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded-md flex items-center gap-1 pointer-events-none md:flex hidden font-mono">
                    <CornerDownLeft className="w-2.5 h-2.5" />
                    ENTER
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading}
                  className={`h-11 px-5 rounded-xl text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-1.5 transition-all select-none ${
                    !inputValue.trim() || loading
                      ? 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95 cursor-pointer hover:shadow-lg hover:shadow-blue-200'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
