'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MailOpen } from 'lucide-react';

interface Comment {
    id: string;
    message: string;
    created_at: string;
    profiles: {
        username: string;
    };
    exhibitions: {
        title: string;
    };
}

interface ResonanceLetterProps {
    username: string;
    comments: Comment[];
    onClose: () => void;
}

export default function ResonanceLetter({ username, comments, onClose }: ResonanceLetterProps) {
    // Limit to latest 3 for detail view
    const displayComments = comments.slice(0, 3);
    const remainingCount = comments.length - 3;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* The Letter */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-2xl bg-[#080808] border border-white/10 p-8 md:p-12 shadow-2xl overflow-hidden"
                style={{
                    boxShadow: '0 0 50px -10px rgba(255, 255, 255, 0.05)'
                }}
            >
                {/* Paper Texture Overlay */}
                <div 
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col gap-8">
                    
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-white/5 rounded-full border border-white/10">
                                <MailOpen className="text-white/80" size={24} strokeWidth={1} />
                            </div>
                        </div>
                        <h2 className="font-serif text-3xl md:text-4xl text-white tracking-wider uppercase">
                            暗房回响
                        </h2>
                        <p className="font-sans text-[10px] text-white/40 tracking-[0.3em] uppercase">
                            ECHOES FROM THE DARKROOM
                        </p>
                    </div>

                    {/* Greeting */}
                    <div className="font-serif text-gray-300 text-lg leading-relaxed border-t border-white/10 pt-8">
                        <p className="mb-6">
                            你好，<span className="text-white">{username}</span>。
                        </p>
                        <p className="text-white/60">
                            在你离开的这段时间，你的作品产生了一些新的共鸣。
                        </p>
                    </div>

                    {/* Body: Comments List */}
                    <div className="space-y-6 pl-4 md:pl-8 border-l border-white/10 my-4">
                        {displayComments.map((comment) => (
                            <div key={comment.id} className="space-y-2 group">
                                <div className="flex items-baseline gap-3 text-[10px] font-sans text-white/30 uppercase tracking-widest">
                                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                    <span className="w-8 h-px bg-white/10 group-hover:bg-white/30 transition-colors" />
                                </div>
                                <div className="font-serif text-gray-400 leading-relaxed">
                                    朋友 <span className="text-white border-b border-white/20 pb-0.5">{comment.profiles?.username || 'Visitor'}</span> 在你的展览 
                                    <span className="italic text-white/80 mx-1">《{comment.exhibitions?.title}》</span> 
                                    中写道：
                                </div>
                                <blockquote className="text-lg text-white/90 italic font-serif pl-4 border-l-2 border-white/20 py-1">
                                    “{comment.message}”
                                </blockquote>
                            </div>
                        ))}
                        
                        {remainingCount > 0 && (
                            <p className="text-sm text-white/40 italic mt-4 font-serif">
                                ...此外，还有 {remainingCount} 位朋友留下了印记。请进入暗房查看详情。
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-white/10 pt-8 flex flex-col items-center gap-8">
                        <div className="text-center space-y-2">
                            <p className="font-serif text-gray-400 italic">
                                非常感谢你的付出。因为你的作品，今天又温暖了一个人。
                            </p>
                            <p className="font-sans text-[10px] text-white/30 tracking-[0.2em] uppercase mt-4">
                                —— Latent Space 主理人
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="group relative px-8 py-3 bg-white text-black font-sans text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors overflow-hidden"
                        >
                            <span className="relative z-10">收下这份温暖</span>
                            <div className="absolute inset-0 bg-cyan-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                        </button>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
