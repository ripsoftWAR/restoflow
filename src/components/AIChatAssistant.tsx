import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Menggunakan framer-motion standar agar kompatibel
import { 
  Brain, 
  Send, 
  X, 
  Sparkles, 
  CornerDownLeft, 
  TrendingUp, 
  AlertTriangle, 
  PackageCheck, 
  Utensils, 
  RefreshCw,
  Paperclip
} from 'lucide-react';
import { Ingredient, RecipeWithDetails } from '../types';
import { apiFetch } from '../utils/api';

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
  const [dragged, setDragged] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showChat = embedded || isOpen;

  // Logika pembungkus luar (Overlay)
  const rootWrapperClassName = embedded
    ? 'flex flex-col h-full overflow-hidden bg-pp-bg'
    : 'fixed inset-0 bg-pp-text/40 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-6';

  // Logika container chat
  const contentWrapperClassName = embedded
    ? 'flex flex-col h-full w-full'
    : 'bg-pp-bg w-full h-full md:max-w-4xl md:h-[90vh] md:rounded-pp-xl shadow-pp-xl overflow-hidden flex flex-col relative border border-white';

  // [LOGIKA ASLI TETAP DIBAWAH INI - TIDAK DIUBAH]
  useEffect(() => {
    const tmp = [];
    const lowStockItems = ingredients.filter(i => i.stock <= i.min_stock);
    if (lowStockItems.length > 0) {
      const topLow = lowStockItems[0];
      tmp.push({
        label: `Restock: ${topLow.name}`,
        text: `Tolong tambahkan stock ${topLow.name} sebanyak ${topLow.base_unit === 'gram' ? '1 kg' : '20 pcs'}`,
        icon: AlertTriangle,
        color: 'text-pp-warning border-pp-warning-border bg-white'
      });
    } else {
      const candidate = ingredients[Math.floor(Math.random() * ingredients.length)] || { name: 'Cabai Merah', base_unit: 'gram' };
      tmp.push({
        label: `Re-stock ${candidate.name}`,
        text: `Tolong isi ulang stock ${candidate.name} sebanyak ${candidate.base_unit === 'gram' ? '500 gram' : '10 pcs'}`,
        icon: PackageCheck,
        color: 'text-pp-primary border-pp-primary-muted bg-white'
      });
    }
    tmp.push({
      label: `Buat Resep Baru`,
      text: `Buat resep Nasi Goreng Spesial menggunakan bahan Bawang Merah 30 gram dan Cabai Merah 25 gram`,
      icon: Utensils,
      color: 'text-pp-success border-pp-success-border bg-white'
    });
    tmp.push({
      label: `Analisis Kritis`,
      text: `Bahan baku apa saja yang stoknya di bawah batas minimum dan perlu diisi secepatnya? Bagikan rekomendasinya.`,
      icon: TrendingUp,
      color: 'text-pp-primary border-pp-primary-muted bg-white'
    });
    setTemplates(tmp);
  }, [ingredients, recipes]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);
    try {
      const response = await apiFetch('/api/gemini/chat', {
        method: 'POST',
        body: JSON.stringify({ message: textToSend, history: messages })
      });
      if (!response.ok) throw new Error('Gagal menghubungi asisten AI.');
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
      if (data.actions && data.actions.length > 0) {
        const hasRefresh = data.actions.some((act: any) => act.type === 'REFRESH_DATA');
        if (hasRefresh) await onRefreshData();
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ **Error**: ${err.message || 'Gagal berkomunikasi dengan server backend.'}` }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let content = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) parts.push(content.substring(lastIndex, match.index));
        parts.push(<strong key={match.index} className="font-bold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < content.length) parts.push(content.substring(lastIndex));
      const inlineContent = parts.length > 0 ? parts : content;

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <li key={idx} className="ml-4 list-disc mb-1">{inlineContent}</li>;
      }
      const numMatch = line.trim().match(/^(\d+)\.\s+/);
      if (numMatch) {
        return <div key={idx} className="flex gap-2 ml-1 mb-1.5"><span className="font-bold text-pp-primary">{numMatch[1]}.</span><span className="flex-1">{inlineContent}</span></div>;
      }
      return <p key={idx} className="mb-2 last:mb-0">{inlineContent}</p>;
    });
  };

  return (
    <>
      {/* 1. FLOATING AVATAR (Hanya muncul jika tidak mode embedded) */}
      <AnimatePresence>
        {!embedded && !isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            onDragStart={() => setDragged(true)}
            onDragEnd={() => setTimeout(() => setDragged(false), 200)}
            onClick={() => !dragged && setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-8 right-8 z-[60] cursor-grab active:cursor-grabbing"
          >
            <div className="relative w-16 h-16 bg-pp-primary rounded-full flex items-center justify-center shadow-pp-brand border-2 border-white">
              <div className="flex flex-col items-center">
                <div className="flex gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
                <div className="w-4 h-0.5 bg-white/60 rounded-full"></div>
              </div>
              <div className="absolute -top-1 -right-1 bg-pp-success w-4 h-4 rounded-full border-2 border-white"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CHAT INTERFACE */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={rootWrapperClassName}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={contentWrapperClassName}
            >
              {/* Tombol Tutup Minimalis (Hanya jika modal) */}
              {!embedded && (
                <button 
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 z-10 p-2 bg-pp-border/50 hover:bg-pp-border rounded-full transition-colors text-pp-text-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Chat Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-6 scroll-smooth">
                <div className="max-w-3xl mx-auto w-full space-y-6">
                  {messages.map((msg, idx) => {
                    const isAi = msg.role === 'assistant';
                    return (
                      <div key={idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'} group`}>
                        <div className={`max-w-[85%] md:max-w-[75%] ${isAi ? 'flex gap-3' : ''}`}>
                          {isAi && (
                            <div className="w-8 h-8 rounded-full bg-pp-primary-soft flex items-center justify-center shrink-0 mt-1">
                              <Brain className="w-4 h-4 text-pp-primary" />
                            </div>
                          )}
                          <div>
                            <div className={`px-4 py-3 shadow-sm text-[15px] leading-relaxed ${
                              isAi 
                                ? 'bg-pp-surface border border-pp-border-light text-pp-text-secondary rounded-pp-sm rounded-tl-none' 
                                : 'bg-pp-primary text-white rounded-pp-sm rounded-tr-none shadow-pp-brand'
                            }`}>
                              {isAi ? renderMessageContent(msg.text) : <p className="whitespace-pre-wrap">{msg.text}</p>}
                            </div>
                            <span className={`text-[10px] mt-1.5 block text-pp-text-muted font-medium ${!isAi && 'text-right'}`}>
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-pp-primary-soft flex items-center justify-center shrink-0">
                        <RefreshCw className="w-4 h-4 text-pp-primary animate-spin" />
                      </div>
                      <div className="bg-pp-surface border border-pp-border-light px-4 py-3 rounded-pp-sm rounded-tl-none shadow-pp-xs">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-pp-primary rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-pp-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-pp-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions & Input Area */}
              <div className="bg-pp-surface/80 backdrop-blur-md border-t border-pp-border-light">
                <div className="max-w-3xl mx-auto w-full px-4 pt-4 pb-6">
                  
                  {/* Chips/Templates - Minimalist Style */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
                    {templates.map((tmp, idx) => {
                      const Icon = tmp.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(tmp.text)}
                          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-2 hover:bg-pp-bg active:scale-95 ${tmp.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {tmp.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Input Pill */}
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
                    className="relative flex items-center bg-pp-border-light rounded-[28px] p-1.5 pr-2 focus-within:bg-pp-surface focus-within:ring-2 focus-within:ring-pp-primary-soft transition-all border border-transparent focus-within:border-pp-primary-muted"
                  >
                    <button type="button" className="p-2.5 text-pp-text-muted hover:text-pp-primary transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Tulis pesan ke asisten..."
                      className="flex-1 bg-transparent border-none focus:outline-none text-[15px] px-2 text-pp-text placeholder-pp-text-placeholder"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || loading}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        !inputValue.trim() || loading 
                          ? 'bg-pp-border-light text-pp-text-muted' 
                          : 'bg-pp-primary text-white shadow-pp-brand hover:bg-pp-primary-hover active:scale-90'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  
                  <div className="flex justify-center mt-3">
                    <div className="text-[10px] text-pp-text-muted uppercase tracking-widest font-bold opacity-40 flex items-center gap-2">
                      <div className="w-1 h-1 bg-pp-success rounded-full"></div>
                      RestoFlow AI System Active
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}