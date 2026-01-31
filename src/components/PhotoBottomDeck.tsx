import React from 'react';
import { Scan, MessageSquare, ChevronDown, ChevronUp, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoBottomDeckProps {
  onAnalyze: (e: React.MouseEvent) => void;
  // New Interaction Mode Handlers
  onModeChange: (mode: 'none' | 'view' | 'add') => void;
  
  onNext: () => void;
  isAnalyzing: boolean;
  // Replaced boolean isInspecting with mode
  interactionMode: 'none' | 'view' | 'add';
  
  isLast: boolean;
  commentCount?: number;
  showAI?: boolean;
  showComments?: boolean;
  
  // User Actions for Own Comment
  hasUserComment?: boolean;
  onDeleteComment?: () => void;
  onEditComment?: () => void;
}

export default function PhotoBottomDeck({
  onAnalyze,
  onModeChange,
  onNext,
  isAnalyzing,
  interactionMode,
  isLast,
  commentCount = 0,
  showAI = true,
  showComments = true,
  hasUserComment = false,
  onDeleteComment,
  onEditComment,
}: PhotoBottomDeckProps) {
  const isViewMode = interactionMode === 'view';
  const isAddMode = interactionMode === 'add';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      {/* Layer 1: Tool Row */}
      <div 
        className="absolute bottom-[calc(4rem+16px)] left-0 right-0 px-6 flex justify-between items-end pointer-events-auto pb-safe"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: AI Gaze */}
        {showAI && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAnalyze}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-full backdrop-blur-md border shadow-lg transition-all
              ${isAnalyzing 
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200' 
                : 'bg-black/20 border-white/10 text-white/90 hover:bg-black/40'
              }
            `}
          >
            <Scan size={20} strokeWidth={1.5} className={isAnalyzing ? 'animate-pulse' : ''} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-sans pt-0.5">
              {isAnalyzing ? '分析中' : 'AI凝视'}
            </span>
          </motion.button>
        )}

        {/* Right: Comments Control Group */}
        {showComments && (
          <div className="flex items-center gap-3 relative">
              {/* Hint Bubble (Only when Adding and NO user comment) */}
              <AnimatePresence>
                  {isAddMode && !hasUserComment && (
                      <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          className="absolute bottom-full right-0 mb-4 whitespace-nowrap pointer-events-none z-50"
                      >
                          <div className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-lg border border-white/20 shadow-2xl relative">
                              <span className="text-[11px] text-white font-serif tracking-widest">
                                  点击图片空白处评论
                              </span>
                              {/* Arrow */}
                              <div className="absolute -bottom-1.5 right-12 w-3 h-3 bg-black/80 border-r border-b border-white/20 rotate-45" />
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>

              {/* Edit/Delete Actions (Only visible when Inspecting AND User has a comment) */}
              {/* NOTE: In Vibe Coding Refactor, we might want to move this or keep it associated with View Mode? 
                  User said "Read/Write Separation". 
                  Let's keep these accessible in VIEW mode or BOTH? 
                  Usually you edit/delete while viewing your own comment.
              */}
              <AnimatePresence>
                  {isViewMode && hasUserComment && (
                      <motion.div 
                          initial={{ opacity: 0, x: 20, scale: 0.8 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 20, scale: 0.8 }}
                          className="flex items-center gap-2 mr-1"
                      >
                          <button 
                              onClick={onEditComment}
                              className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-colors active:scale-95"
                              title="编辑评论"
                          >
                              <Edit2 size={16} />
                          </button>
                          <button 
                              onClick={onDeleteComment}
                              className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-red-400/80 hover:bg-red-500/20 hover:text-red-400 transition-colors active:scale-95"
                              title="删除评论"
                          >
                              <Trash2 size={16} />
                          </button>
                      </motion.div>
                  )}
              </AnimatePresence>

              {/* Control Group Container */}
              <div className="flex items-center bg-black/20 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-lg">
                  
                  {/* View Button (Eye) - Only show if there are comments */}
                  {commentCount > 0 && (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onModeChange(isViewMode ? 'none' : 'view')}
                        className={`
                          relative flex items-center gap-2 px-4 h-12 rounded-full transition-all
                          ${isViewMode
                            ? 'bg-white text-black shadow-md'
                            : 'text-white/70 hover:bg-white/10'
                          }
                        `}
                      >
                        <div className="relative">
                          <MessageSquare size={20} strokeWidth={1.5} fill={isViewMode ? "currentColor" : "none"} />
                          {/* Badge with Count */}
                          {!isViewMode && (
                            <span className="absolute -top-2 -right-2 flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full bg-red-500 text-[9px] text-white font-bold shadow-sm">
                              {commentCount > 99 ? '99+' : commentCount}
                            </span>
                          )}
                        </div>
                        <span className="text-[12px] font-sans font-bold tracking-widest uppercase">
                            查看
                        </span>
                      </motion.button>

                      {/* Divider - Only show if Add Button is also visible */}
                      {!hasUserComment && <div className="w-px h-6 bg-white/10 mx-1" />}
                    </>
                  )}

                  {/* Add Button (Plus/Pen) - Only show if user has NO comment */}
                  {!hasUserComment && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            onModeChange(isAddMode ? 'none' : 'add');
                        }}
                        className={`
                        relative flex items-center gap-2 px-4 h-12 rounded-full transition-all
                        ${isAddMode
                            ? 'bg-white text-black shadow-md'
                            : 'text-white/70 hover:bg-white/10'
                        }
                        `}
                    >
                        <span className="text-[12px] font-sans font-bold tracking-widest uppercase">
                            留言
                        </span>
                        <div className="relative">
                            <div className={`absolute inset-0 bg-current rounded-full opacity-20 scale-0 transition-transform ${isAddMode ? 'scale-150' : ''}`} />
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </div>
                    </motion.button>
                  )}
              </div>
          </div>
        )}
      </div>

      {/* Layer 2: Navigation Anchor */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto pb-safe"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          animate={{ y: [0, 3, 0] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="p-4 text-white/50 hover:text-white transition-colors active:scale-95 active:text-white"
        >
          {isLast ? (
            <div className="flex flex-col items-center gap-1">
              <ChevronUp size={24} strokeWidth={1} />
              <span className="text-[9px] uppercase tracking-widest opacity-50">Top</span>
            </div>
          ) : (
            <ChevronDown size={28} strokeWidth={1} />
          )}
        </motion.button>
      </div>
    </div>
  );
}
