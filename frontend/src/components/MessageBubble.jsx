import React, { useState } from "react";
import { User, Sparkles, Copy, Check, Star, Folder, ChevronDown, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import { motion } from "framer-motion";
import TagComponent from "./TagComponent";
import { updateTags as updateNoteTagsAPI } from "../services/api";

export default function MessageBubble({ message, isAI, folders = [], onToggleStar, onMoveNote, isStarred, onTagsChange }) {
  const [copied, setCopied] = useState(false);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tags, setTags] = useState(message.tags || []);
  const [isSavingTags, setIsSavingTags] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTagsChange = async (newTags) => {
    setTags(newTags);
    if (isAI && message.id) {
      setIsSavingTags(true);
      try {
        await updateNoteTagsAPI(message.id, newTags);
        if (onTagsChange) {
          onTagsChange(message.id, newTags);
        }
        toast.success("Tags updated!");
      } catch (err) {
        console.error("Failed to update tags:", err);
        toast.error("Failed to update tags");
        setTags(message.tags || []);
      } finally {
        setIsSavingTags(false);
        setIsEditingTags(false);
      }
    }
  };

  const sections = isAI ? parseSections(message.generated_notes) : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex w-full mb-8 ${isAI ? "justify-start" : "justify-end"}`}
    >
      <div className={`flex max-w-[85%] sm:max-w-[75%] gap-4 ${isAI ? "flex-row" : "flex-row-reverse"}`}>
        {/* Avatar */}
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isAI ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-300 shadow-sm border border-white/10"}`}>
          {isAI ? <Sparkles size={16} /> : <User size={16} />}
        </div>

        {/* Content Container */}
        <div className="flex flex-col gap-2">
          {!isAI ? (
            /* User Message Bubble */
            <div className={`px-5 py-3 rounded-2xl bg-slate-800 border border-white/5 text-slate-200 shadow-xl overflow-hidden`}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 border-b border-white/5 pb-1">
                Problem #{message.problem_number}
              </div>
              <SyntaxHighlighter 
                language="python" 
                style={vscDarkPlus}
                customStyle={{ background: 'transparent', padding: '0.5rem 0', fontSize: '13px' }}
              >
                {message.code || "No code provided."}
              </SyntaxHighlighter>
            </div>
          ) : (
            /* AI Message Sections */
            <div className="flex flex-col gap-4">
              {sections.map((section, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass p-6 rounded-2xl shadow-2xl relative group overflow-hidden border border-amber-500/10"
                >
                  {/* Glass highlight */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-600 opacity-30" />
                  
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest">{section.title}</h3>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Folder Selection (Only once per message, shown in first section) */}
                      {idx === 0 && (
                        <div className="relative">
                          <button 
                            onClick={() => setIsFolderMenuOpen(!isFolderMenuOpen)}
                            className={`p-1.5 rounded-md hover:bg-white/10 transition-all flex items-center gap-1 ${message.folder_id ? "text-amber-400" : "text-slate-400"}`}
                            title="Move to folder"
                          >
                            <Folder size={14} />
                            <ChevronDown size={10} />
                          </button>
                          
                          {isFolderMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 p-1 py-2 space-y-1">
                              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 mb-1">Move to Folder</div>
                              <button 
                                onClick={() => { onMoveNote(null); setIsFolderMenuOpen(false); }}
                                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${!message.folder_id ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}
                              >
                                Standalone
                              </button>
                              {folders.map(f => (
                                <button 
                                  key={f.id}
                                  onClick={() => { onMoveNote(f.id); setIsFolderMenuOpen(false); }}
                                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${message.folder_id === f.id ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}
                                >
                                  {f.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button 
                        onClick={() => onToggleStar(message.id)}
                        className={`p-1.5 rounded-md hover:bg-white/10 transition-all ${isStarred ? "text-amber-500" : "text-slate-400"}`}
                        title={isStarred ? "Unstar" : "Star"}
                      >
                        <Star size={14} fill={isStarred ? "currentColor" : "none"} />
                      </button>

                      {/* Tags Button */}
                      {idx === 0 && (
                        <button 
                          onClick={() => setIsEditingTags(!isEditingTags)}
                          className={`p-1.5 rounded-md hover:bg-white/10 transition-all ${tags.length > 0 ? "text-amber-400" : "text-slate-400"}`}
                          title={isEditingTags ? "Done editing tags" : "Edit tags"}
                          disabled={isSavingTags}
                        >
                          <Tag size={14} />
                        </button>
                      )}

                      <button 
                        onClick={() => handleCopy(section.content)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                        title="Copy section"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Tags Display (show in first section) */}
                  {idx === 0 && (tags.length > 0 || isEditingTags) && (
                    <div className="mb-4 pb-3 border-b border-amber-500/10">
                      <TagComponent 
                        tags={tags} 
                        onTagsChange={handleTagsChange}
                        editable={isEditingTags}
                      />
                    </div>
                  )}

                  <div className="prose prose-invert prose-sm text-slate-300 leading-relaxed font-normal">
                    <ReactMarkdown 
                      components={{
                        code({inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              children={String(children).replace(/\n$/, '')}
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', background: '#0a0e1b', padding: '1rem' }}
                              {...props}
                            />
                          ) : (
                            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 border border-white/5 font-mono text-xs" {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Parses the generated notes into sections based on headers.
 */
function parseSections(text) {
  if (!text) return [];

  // Look for sections like ### SECTION NAME or **SECTION NAME**
  text.split(/###|\*\*([^*]+)\*\*/g).filter(Boolean);
  
  // If no sections found, treat whole text as one section
  if (text.indexOf('###') === -1 && text.indexOf('**') === -1) {
    return [{ title: "Analysis", content: text }];
  }

  const parsed = [];
  const lines = text.split('\n');
  let currentSection = null;

  for (const line of lines) {
    const headerMatch = line.match(/^(?:###\s*|\*\*)([^*]+)(?:\*\*|:)?$/);
    if (headerMatch) {
      if (currentSection) parsed.push(currentSection);
      currentSection = { title: headerMatch[1].trim(), content: "" };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    } else if (line.trim()) {
      // First line if not a header
      currentSection = { title: "Introduction", content: line + '\n' };
    }
  }
  if (currentSection) parsed.push(currentSection);

  // Fallback cleanup
  return parsed.map(s => ({
    title: s.title.replace(/[#:]/g, '').trim(),
    content: s.content.trim()
  })).filter(s => s.content.length > 5);
}
