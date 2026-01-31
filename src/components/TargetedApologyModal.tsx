'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface TargetedApologyModalProps {
  currentUser?: { username: string };
}

const APOLOGY_MESSAGES: Record<string, { storageKey: string; content: React.ReactNode }> = {
  'dao': {
    storageKey: 'latent_apology_seen_dao',
    content: (
      <>
        <p className="mb-4">DAO，你好。</p>
        <p className="mb-4">我是 Latent 的主理人。</p>
        <p className="mb-4">
          给你写这封信，是因为后台日志显示，你此前尝试在 Latent 暗房中进行“显影”（上传作品）时，由于我们的系统故障，导致你的影像未能成功留存。
        </p>
        <p className="mb-4">
          这是一个非常遗憾的技术失误。对于一个强调“凝视”与“珍视”的平台来说，丢失用户交付的信任是不可接受的。为此，我向你诚挚道歉。
        </p>
        <p className="mb-4">
          为了确保你未来的作品数据完整，我已经手动清理了之前那次失败上传留下的错误数据碎片。现在的暗房已经重新校准，恢复了洁净与秩序。
        </p>
        <p className="mb-4">
          如果你还愿意给 Latent 一次机会，我非常期待能再次看到你的作品。我相信，一个愿意以 “DAO” 为名的人，一定拥有独特的视角和对新事物的耐心。
        </p>
        <p className="mb-4">
          感谢你对这个不完美系统的包容。期待你的归来。
        </p>
        <p className="mt-8 text-right">
          祝好，<br />
          <span className="font-serif italic text-lg">Latent Space 主理人</span>
        </p>
      </>
    )
  },
  '牛逼哄哄': {
    storageKey: 'latent_apology_seen_nbhh',
    content: (
      <>
        <p className="mb-4">你好，牛逼哄哄的朋友。</p>
        <p className="mb-4">我是 Latent 的主理人。</p>
        <p className="mb-4">
          此时此刻我非常惭愧。后台显示你之前光临了我们的暗房，并尝试上传作品。但非常不凑巧，我们的系统在那个时刻“掉链子”了，没能承载住你上传的影像。
        </p>
        <p className="mb-4">
          就像显影液配比出了错，把一张可能惊艳的底片给毁了。实在抱歉，这是我的责任。
        </p>
        <p className="mb-4">
          为了不影响你下次的体验，我已经亲自把那些因故障产生的错误数据清理干净了。现在的系统已经准备好，随时等待再次迎接你的作品。
        </p>
        <p className="mb-4">
          说实话，看到你的 ID，我原本非常期待能看到与之匹配的、“牛逼哄哄”的摄影大作。这次的失误让我错失了第一时间欣赏的机会，希望你不要介意，能再回来试一次。
        </p>
        <p className="mb-4">
          感谢你对 Latent 的耐心，期待被你的作品震撼。
        </p>
        <p className="mt-8 text-right">
          祝好，<br />
          <span className="font-serif italic text-lg">Latent Space 主理人</span>
        </p>
      </>
    )
  },
  '大灰鹿': {
    storageKey: 'latent_welcome_back_dhl',
    content: (
      <>
        <h4 className="font-serif text-xl mb-6">致 大灰鹿：久别重逢</h4>
        <p className="mb-4">你好，大灰鹿。</p>
        <p className="mb-4">
          非常高兴能再次在 Latent 的暗房里见到你。
        </p>
        <p className="mb-4">
          这一路走来，感谢你对我们最长情的耐心与包容。你的存在，让我们确信坚持做这件事是有意义的。
        </p>
        <p className="mb-4">
          暗房已经打扫干净，随时准备迎接你的新影像。我们非常期待看到你眼中的世界，同时也渴望听到你最真实的声音——无论是对产品的吐槽还是建议，请随时告诉我们。
        </p>
        <p className="mb-4">
          欢迎回家，期待你的大作。
        </p>
        <p className="mt-8 text-right">
          祝好，<br />
          <span className="font-serif italic text-lg">Latent Space 主理人</span>
        </p>
      </>
    )
  },
  'LANPKOUGDE': {
    storageKey: 'latent_welcome_back_lan',
    content: (
      <>
        <h4 className="font-serif text-xl mb-6">很高兴再次见到你，LANPKOUGDE</h4>
        <p className="mb-4">嗨，朋友。</p>
        <p className="mb-4">
          看到你再次登录，是我们今天最开心的事。
        </p>
        <p className="mb-4">
          感谢你在 Latent 成长过程中给予的耐心，这份信任对我们弥足珍贵。
        </p>
        <p className="mb-4">
          现在的版本或许还不够完美，但我们正在努力让它变得更好。希望你能多发些作品，让这个空间流动起来；也希望你能多提建议，帮助我们将这个数字暗房打造得更顺手。
        </p>
        <p className="mb-4">
          这里的灯为你亮着，期待你的每一次‘显影’。
        </p>
        <p className="mt-8 text-right">
          祝好，<br />
          <span className="font-serif italic text-lg">Latent Space 主理人</span>
        </p>
      </>
    )
  }
};

export default function TargetedApologyModal({ currentUser }: TargetedApologyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<{ storageKey: string; content: React.ReactNode } | null>(null);

  useEffect(() => {
    if (!currentUser?.username) return;

    // Normalize username for matching (case-insensitive)
    const normalizedUsername = currentUser.username.trim().toLowerCase();
    
    // Find matching key in APOLOGY_MESSAGES
    const targetKey = Object.keys(APOLOGY_MESSAGES).find(
      key => key.toLowerCase() === normalizedUsername
    );

    if (targetKey) {
      const config = APOLOGY_MESSAGES[targetKey];
      const hasSeen = localStorage.getItem(config.storageKey);

      if (!hasSeen) {
        setMessage(config);
        // Add a small delay for better UX upon page load
        const timer = setTimeout(() => setIsOpen(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser]);

  const handleClose = () => {
    if (message) {
      localStorage.setItem(message.storageKey, 'true');
      setIsOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && message && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 shadow-2xl overflow-hidden rounded-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Letter Texture */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
              }}
            />

            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-1 h-4 bg-white/20" />
                <h3 className="font-serif text-lg tracking-widest uppercase text-white/90">
                  A Letter from Latent
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                <X size={20} strokeWidth={1} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 md:p-10 font-sans text-sm md:text-base leading-loose text-gray-300 tracking-wide">
              {message.content}
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-center">
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-white text-black text-xs font-bold tracking-[0.2em] uppercase hover:bg-gray-200 transition-colors"
              >
                Received
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
