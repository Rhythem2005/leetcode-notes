import React, { useState, forwardRef } from "react";
import { Send, Hash, Code, Loader2 } from "lucide-react";


const InputBar = forwardRef(({ onSubmit, isLoading }, ref) => {
  const [problemNumber, setProblemNumber] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!problemNumber || !code || isLoading) return;
    onSubmit({ problemNumber, code });
    // Reset code only if needed, but usually keep problem number?
    // User requested "Clean state" for "New Chat", so we reset here on submit.
    setCode("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gradient-to-t from-[#0A0A0A] to-transparent w-full z-10">
      <form 
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto w-full relative glass rounded-2xl p-2 sm:p-3 shadow-2xl border border-white/10 group focus-within:border-yellow-500/30 focus-within:ring-2 focus-within:ring-yellow-500/10 transition-all"
      >
        <div className="flex flex-col gap-2">
          {/* Top Row: Problem ID */}
          <div className="flex items-center gap-2 px-3 pt-1">
             <Hash size={14} className="text-amber-400 opacity-70" />
             <input 
               ref={ref}
               type="text" 
               placeholder="LeetCode # (e.g. 42)"
               value={problemNumber}
               onChange={(e) => setProblemNumber(e.target.value)}
               className="bg-transparent border-none outline-none text-sm text-slate-100 placeholder:text-slate-500 w-full font-medium"
               disabled={isLoading}
             />
          </div>

          {/* Bottom Row: Code Area + Submit */}
          <div className="flex items-end gap-3 px-3 pb-1">
            <div className="flex-1 min-h-[44px] flex items-center">
              <textarea 
                placeholder="Paste your solution code here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="bg-transparent border-none outline-none text-sm text-slate-300 placeholder:text-slate-500 w-full font-mono resize-none max-h-32 focus:ring-0 leading-relaxed py-2"
                style={{ height: 'auto', minHeight: '32px' }}
                onInput={(e) => {
                  e.target.style.height = 'inherit';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading || !problemNumber || !code}
              className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                isLoading || !problemNumber || !code
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]"
              }`}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} className={problemNumber && code ? "translate-x-0.5 -translate-y-0.5" : ""} />
              )}
            </button>
          </div>
        </div>
      </form>
      <p className="text-center text-[10px] text-slate-600 mt-2 font-medium tracking-wide uppercase">
        Press <span className="bg-slate-800 px-1 rounded text-slate-400">Enter</span> to submit • <span className="bg-slate-800 px-1 rounded text-slate-400">Shift + Enter</span> for new line
      </p>
    </div>
  );
});

export default InputBar;
