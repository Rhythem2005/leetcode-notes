import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import { Sparkles, Terminal } from "lucide-react";

export default function ChatContainer({ messages, isLoading, folders, onToggleStar, onMoveNote, onTagsChange }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md space-y-6"
        >
          <div className="w-16 h-16 bg-yellow-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-500/20 relative group overflow-hidden">
             <div className="absolute inset-0 bg-yellow-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
             <Terminal size={32} className="text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-yellow-200 to-amber-400 bg-clip-text text-transparent">
            LeetCode Notes Assistant
          </h1>
          <p className="text-slate-400 leading-relaxed text-sm">
            Enter a LeetCode problem number and your solution code below. 
            I'll generate an optimized breakdown, explain the core patterns, and point out potential improvements.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            <FeatureCard icon={<Sparkles size={14} />} title="Optimized" text="O(n) solutions" />
            <FeatureCard icon={<Terminal size={14} />} title="Pattern" text="Identify concepts" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 md:px-12 py-8 space-y-6 custom-scrollbar scroll-smooth"
    >
      <div className="max-w-4xl mx-auto w-full">
        {messages.map((msg, idx) => (
          <React.Fragment key={msg.id || idx}>
             {/* User Message */}
             <MessageBubble 
               message={{ ...msg, is_user: true }} 
               isAI={false} 
             />
             
             {/* AI Message */}
             {msg.generated_notes && (
                <MessageBubble 
                  message={msg} 
                  isAI={true} 
                  folders={folders}
                  onToggleStar={() => onToggleStar(msg.id)}
                  onMoveNote={(folderId) => onMoveNote(msg.id, folderId)}
                  onTagsChange={onTagsChange}
                  isStarred={msg.is_starred}
                />
             )}
          </React.Fragment>
        ))}

        {/* Loading Spinner / Skeleton */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 mb-8"
          >
            <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white animate-pulse" />
            </div>
            <div className="flex flex-col gap-3 w-full">
               <div className="h-24 w-full glass rounded-2xl shimmer border border-white/5" />
               <div className="h-40 w-3/4 glass rounded-2xl shimmer border border-white/5" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="p-4 rounded-xl glass border border-amber-500/10 text-left group hover:bg-yellow-500/5 transition-colors">
      <div className="text-amber-400 mb-1 flex items-center gap-2 group-hover:scale-105 transition-transform origin-left">
        {icon} <span className="font-bold text-xs uppercase tracking-tighter opacity-80">{title}</span>
      </div>
      <p className="text-xs text-slate-500 font-medium">{text}</p>
    </div>
  );
}
