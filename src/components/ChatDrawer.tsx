import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { ChatMessage } from '../types';
import { sounds } from '../lib/audio';
import { t, Language } from '../data/translations';

interface ChatDrawerProps {
  messages: ChatMessage[];
  currentPlayerId: string | null;
  lang?: Language | string;
  onSendMessage: (text: string) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ messages, currentPlayerId, lang = 'ar', onSendMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isRtl = lang === 'ar';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sounds.click();
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          sounds.click();
        }}
        id="toggle-chat-btn"
        className="fixed bottom-4 left-4 z-40 bg-[#ff5f1f] hover:bg-[#e64a00] text-white p-3 sm:px-4 sm:py-3 rounded-full sm:rounded-2xl shadow-[0_0_20px_rgba(255,95,31,0.4)] flex items-center gap-2 border border-[#ff5f1f] transition-all cursor-pointer active:scale-95"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="hidden sm:inline font-bold text-xs">{t('chatButtonText', lang)}</span>
        {messages.length > 0 && (
          <span className="bg-[#00ff88] text-black font-mono font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>

      {/* Slide-out Chat Modal / Drawer */}
      {isOpen && (
        <div className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
          <div className="bg-[#16162d] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-md h-[80vh] sm:h-[500px] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Chat Header */}
            <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#ff5f1f]" />
                <h3 className="font-bold text-sm text-[#e0e0f0]">{t('chatLogHeader', lang)}</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8888b0] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-[#8888b0] py-10">
                  {t('noMessagesYet', lang)}
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentPlayerId;
                  const isSys = msg.type === 'system';

                  if (isSys) {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="inline-block px-3 py-1 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-full text-[10px] font-semibold text-[#00ff88]">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                    >
                      <span className="text-[10px] text-[#8888b0] mb-0.5 px-1">
                        {msg.senderName}
                      </span>
                      <div
                        className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed ${
                          isMe
                            ? 'bg-[#ff5f1f] text-white rounded-tr-none shadow-[0_0_10px_rgba(255,95,31,0.3)]'
                            : 'bg-white/5 text-[#e0e0f0] border border-white/10 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSubmit} className="p-3 bg-black/40 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chatInputPlaceholder', lang)}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-[#e0e0f0] focus:outline-none focus:border-[#ff5f1f] placeholder-[#8888b0]"
              />
              <button
                type="submit"
                id="send-chat-msg-btn"
                className="p-2.5 bg-[#ff5f1f] hover:bg-[#e64a00] text-white rounded-xl transition-colors cursor-pointer shadow-[0_0_10px_rgba(255,95,31,0.4)]"
              >
                <Send className="w-4 h-4 transform rotate-180" />
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
};
