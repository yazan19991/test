import React from 'react';
import { X, HelpCircle, UserX, MessageSquare, Vote, CheckCircle2 } from 'lucide-react';
import { sounds } from '../lib/audio';
import { t, Language } from '../data/translations';

interface RulesModalProps {
  isOpen: boolean;
  lang?: Language | string;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, lang = 'ar', onClose }) => {
  if (!isOpen) return null;

  const isRtl = lang === 'ar';

  const handleClose = () => {
    sounds.click();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`bg-[#16162d] border border-white/10 rounded-3xl max-w-lg w-full p-6 text-[#e0e0f0] shadow-2xl relative max-h-[90vh] overflow-y-auto ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
        <button
          onClick={handleClose}
          id="close-rules-btn"
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#8888b0] hover:text-white transition-colors cursor-pointer`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#ff5f1f] rounded-2xl border border-[#ff5f1f] text-white shadow-[0_0_15px_rgba(255,95,31,0.4)]">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#e0e0f0]">{t('rulesTitle', lang)}</h2>
            <p className="text-xs text-[#8888b0]">{t('rulesSubtitle', lang)}</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-[#8888b0] leading-relaxed">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
            <div className="p-2 bg-[#ff5f1f]/20 text-[#ff5f1f] rounded-xl shrink-0 mt-0.5">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#ff5f1f] mb-1">{t('rule1Title', lang)}</h3>
              <p>{t('rule1Desc', lang)}</p>
            </div>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-blue-300 mb-1">{t('rule2Title', lang)}</h3>
              <p>{t('rule2Desc', lang)}</p>
            </div>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
            <div className="p-2 bg-[#ff5f1f]/20 text-[#ff5f1f] rounded-xl shrink-0 mt-0.5">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#ff5f1f] mb-1">{t('rule3Title', lang)}</h3>
              <p>{t('rule3Desc', lang)}</p>
            </div>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
            <div className="p-2 bg-[#00ff88]/20 text-[#00ff88] rounded-xl shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#00ff88] mb-1">{t('rule4Title', lang)}</h3>
              <p>{t('rule4Desc', lang)}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          id="rules-understood-btn"
          className="w-full mt-6 py-3 bg-gradient-to-r from-[#ff5f1f] to-[#e64a00] hover:brightness-110 text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(255,95,31,0.4)] transition-all cursor-pointer"
        >
          {t('gotItBtn', lang)}
        </button>
      </div>
    </div>
  );
};
