import React from "react";
import { motion } from "framer-motion";
import { FileText, Folder, Library, X, Download } from "lucide-react";

export default function DownloadModal({ isOpen, onClose, onConfirm, activeNote, activeFolder }) {
  if (!isOpen) return null;

  const options = [
    {
      id: "single",
      title: "Single Note",
      description: activeNote ? `Problem #${activeNote.problem_number}` : "No note selected",
      icon: <FileText className="text-amber-400" />,
      disabled: !activeNote,
    },
    {
      id: "folder",
      title: "Current Folder",
      description: activeFolder ? `Topic: ${activeFolder.name}` : "No folder selected",
      icon: <Folder className="text-amber-500" />,
      disabled: !activeFolder,
    },
    {
      id: "history",
      title: "Entire History",
      description: "All notes in your workspace",
      icon: <Library className="text-yellow-500" />,
      disabled: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Export Options</h2>
            <p className="text-sm text-slate-500">How would you like to download your notes?</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              disabled={option.disabled}
              onClick={() => onConfirm(option.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                option.disabled 
                  ? "opacity-50 grayscale cursor-not-allowed border-white/5 bg-transparent" 
                  : "border-white/5 bg-white/5 hover:bg-yellow-500/10 hover:border-yellow-500/20 active:scale-[0.98]"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-black/40 border border-white/10 shadow-inner group-hover:scale-110 transition-transform`}>
                {option.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold transition-colors ${option.disabled ? "text-slate-500" : "text-white group-hover:text-amber-400"}`}>
                  {option.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{option.description}</p>
              </div>
              {!option.disabled && (
                <Download size={18} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            All exports are generated in high-quality PDF format
          </p>
        </div>
      </motion.div>
    </div>
  );
}
