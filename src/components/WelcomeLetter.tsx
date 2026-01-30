'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const WelcomeLetter = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [letterType, setLetterType] = useState<'generic' | 'vid' | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkVisibility();
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkVisibility = async () => {
    // 1. Check Generic Letter Status (localStorage)
    const hasSeenGeneric = localStorage.getItem('has_seen_welcome_letter');

    // 2. Check User Status for VID Letter
    const { data: { user } } = await supabase.auth.getUser();
    let showVidLetter = false;

    if (user) {
        // Fetch profile to check username
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();

        if (profile?.username === 'VID') {
            const hasSeenVid = localStorage.getItem('has_seen_vid_letter');
            if (!hasSeenVid) {
                showVidLetter = true;
            }
        }
    }

    // Decision Logic: VID Letter takes precedence if eligible
    if (showVidLetter) {
        setLetterType('vid');
        setTimeout(() => setIsVisible(true), 500);
    } else if (!hasSeenGeneric) {
        setLetterType('generic');
        setTimeout(() => setIsVisible(true), 500);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (letterType === 'vid') {
        localStorage.setItem('has_seen_vid_letter', 'true');
    } else {
        localStorage.setItem('has_seen_welcome_letter', 'true');
    }
  };

  if (!isMounted || !letterType) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-md overflow-y-auto"
        >
          {/* Noise Texture */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.05] z-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
          />

          <div className="relative z-10 w-full max-w-2xl p-8 md:p-12 my-auto">
            <div className="space-y-12 font-serif text-[#e5e5e5]" style={{ fontFamily: '"Songti SC", "Noto Serif SC", "SimSun", "Times New Roman", serif' }}>
              
              {/* Dynamic Content Based on Letter Type */}
              {letterType === 'vid' ? (
                  <>
                    <motion.h1 
                        initial={{ filter: 'blur(10px)', opacity: 0 }}
                        animate={{ filter: 'blur(0px)', opacity: 1 }}
                        transition={{ duration: 2, delay: 0.5 }}
                        className="text-2xl md:text-3xl tracking-widest font-medium"
                    >
                        致 VID
                    </motion.h1>

                    <div className="space-y-6 text-base md:text-lg leading-loose font-light text-justify text-[#cccccc]">
                        <Paragraph delay={1.5}>朋友，你好。</Paragraph>
                        <Paragraph delay={2.5}>哪怕我们未曾谋面，但此刻，我觉得我认识你很久了。感谢你，成为了第一个走进这间“暗房”、并将胶卷交付于此的摄影人。</Paragraph>
                        <Paragraph delay={4.5}>透过那些影像，我看见了你娴熟的技巧，更看见了你对这个世界细致入微的洞察。你拥有一双在这个喧嚣时代里，依然愿意捕捉“美”的眼睛。</Paragraph>
                        <Paragraph delay={6.5}>你的用心，我都收到了。为了回应这份珍贵的信任，我承诺：我会亲自凝视你的每一幅作品，并在下面留下我最诚挚的解读与思考。</Paragraph>
                        <Paragraph delay={8.5}>谢谢你让这间暗房不再孤独，也谢谢你对每一张照片的珍视。</Paragraph>
                    </div>
                  </>
              ) : (
                  <>
                    <motion.h1 
                        initial={{ filter: 'blur(10px)', opacity: 0 }}
                        animate={{ filter: 'blur(0px)', opacity: 1 }}
                        transition={{ duration: 2, delay: 0.5 }}
                        className="text-2xl md:text-3xl tracking-widest font-medium"
                    >
                        致 每一位摄影人
                    </motion.h1>

                    <div className="space-y-6 text-base md:text-lg leading-loose font-light text-justify text-[#cccccc]">
                        <Paragraph delay={1.5}>Latent。</Paragraph>
                        <Paragraph delay={2.5}>在中文里，我们或许可以戏谑地读作 <strong className="font-bold text-white">“勒疼”</strong>。每一个摄影师都懂这种痛——那是相机肩带在脖颈和手腕上留下的红印，是我们为了捕捉那个瞬间，肉体所必须承受的重量。</Paragraph>
                        <Paragraph delay={4.5}>但在物理的痛感之外，Latent 更是一个关于时间的词。</Paragraph>
                        <Paragraph delay={6.0}>在胶片时代，按下快门后的底片，在未浸入显影液之前，那上面的影像被称为 <strong className="font-bold text-white">“潜影（Latent Image）”</strong>。它存在，但不可见。它处于一种蓄势待发的静默中，等待着光与药水的唤醒。</Paragraph>
                        <Paragraph delay={8.0}>我建立这个空间的初衷只有一个：把原本属于摄影的尊重，还给摄影。</Paragraph>
                        <Paragraph delay={9.5}>在这个流量为王的时代，我们的心血往往在指尖的快速滑动中，沦为廉价的快餐。0.5 秒的浏览，配不上你为了那张照片跋涉的千里路途。</Paragraph>
                        <Paragraph delay={11.0}>这是一种对抗，也是一种回归。</Paragraph>
                        <Paragraph delay={12.0}>
                            在这里，没有瀑布流，没有瞬时点赞。所有的照片默认都是模糊的“潜影”。你必须停下来，
                            <strong className="text-white font-medium mx-1">{isMobile ? "指尖长按" : "长按鼠标"}</strong>，
                            如同在暗房里
                            <strong className="text-white font-medium mx-1">{isMobile ? "用体温显影" : "摇晃显影罐一样"}</strong>，
                            耐心地注视着它慢慢变得清晰。
                        </Paragraph>
                        <Paragraph delay={14.0}>凝视，是这个时代的稀缺品。</Paragraph>
                        <Paragraph delay={15.0}>我希望这里能成为你的数字暗房。目前 V1 版本已经上线，我们引入了 AI 视觉分析作为辅助，但我更期待未来的你——无论是初学者还是大师——能在这里留下真实的评价。</Paragraph>
                        <Paragraph delay={17.0}>让我们忍受肉体的“勒疼”，去追求精神上的“显影”。</Paragraph>
                        <Paragraph delay={18.5}>欢迎回家。</Paragraph>
                    </div>
                  </>
              )}

              {/* Signature */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 2, delay: letterType === 'vid' ? 10 : 20 }}
                className="flex justify-end pt-8"
              >
                <div className="text-right">
                  <p className="font-handwriting text-xl italic opacity-80" style={{ fontFamily: '"Caveat", "Brush Script MT", "Comic Sans MS", cursive' }}>
                    Latent Space 主理人
                  </p>
                </div>
              </motion.div>

              {/* Action Button */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: letterType === 'vid' ? 11 : 21 }} 
                className="flex justify-center pt-12 pb-8"
              >
                <button
                  onClick={handleClose}
                  className="group relative px-8 py-3 overflow-hidden rounded-sm bg-transparent border border-white/20 hover:border-white/60 transition-colors duration-500"
                >
                  <div className="absolute inset-0 w-0 bg-white transition-all duration-[250ms] ease-out group-hover:w-full opacity-10" />
                  <span className="relative flex items-center gap-3 text-sm md:text-base tracking-[0.2em] uppercase text-white font-serif">
                    进入暗房
                    <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                  </span>
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Paragraph = ({ children, delay }: { children: React.ReactNode, delay: number }) => (
  <motion.p
    initial={{ filter: 'blur(8px)', opacity: 0, y: 10 }}
    animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
    transition={{ duration: 2, delay: delay, ease: "easeOut" }}
  >
    {children}
  </motion.p>
);

export default WelcomeLetter;
