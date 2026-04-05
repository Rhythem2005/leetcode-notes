import React, { useState } from "react";
import { Plus, MessageSquare, Star, Settings, Trash2, Download, ChevronLeft, ChevronRight, Folder, FolderPlus, FolderOpen, FileText, Search, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Sidebar({ 
  history, 
  folders,
  activeNoteId, 
  activeFolderId,
  onSelectNote, 
  onSelectFolder,
  onNewChat, 
  onDeleteNote,
  onCreateFolder,
  onDeleteFolder,
  onDownloadPDF,
  isCollapsed, 
  setIsCollapsed,
  activeView,
  onViewChange,
  onSearchChange = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter history based on activeFolderId
  let filteredHistory = history.filter(n => {
    if (activeFolderId === null) return true; // Show all
    if (activeFolderId === -1) return !n.folder_id; // Unorganized
    return n.folder_id === activeFolderId;
  });

  // Apply tag search filter (case-insensitive, partial match)
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim();
    filteredHistory = filteredHistory.filter(n => {
      // Check if any tag includes the search term
      return (n.tags || []).some(tag => tag.toLowerCase().includes(searchLower));
    });
  }

  // Filter starred notes (should also respect search)
  const starredNotes = filteredHistory.filter(n => n.is_starred);
  const recentNotes = filteredHistory.filter(n => !n.is_starred);

  const handleNewFolder = () => {
    const name = prompt("Enter folder name:");
    if (name && name.trim()) {
      onCreateFolder(name.trim());
    }
  };

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="h-screen bg-[#0A0A0A] border-r border-white/5 flex flex-col z-20 relative transition-all duration-300 ease-in-out"
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-[#1e293b] border border-white/10 rounded-full p-1 text-slate-400 hover:text-white z-30 shadow-xl"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* New Chat Button */}
      <div className="p-4 space-y-2">
        <button 
          onClick={() => { onNewChat(); onViewChange("chat"); }}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all group active:scale-95 ${
            activeView === "chat"
              ? "border border-amber-400/30 bg-amber-500/10 text-amber-400"
              : "border border-yellow-500/10 bg-white/5 text-white hover:bg-yellow-500/10"
          } ${isCollapsed ? "px-0" : "px-4"}`}
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300 group-hover:text-amber-400" />
          {!isCollapsed && <span className="font-medium">New Note</span>}
        </button>

        <button 
          onClick={() => onViewChange("resume")}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all group active:scale-95 ${
            activeView === "resume"
              ? "border border-amber-400/30 bg-amber-500/10 text-amber-400"
              : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
          } ${isCollapsed ? "px-0" : "px-4"}`}
        >
          <FileText size={18} className="group-hover:scale-110 transition-transform duration-300" />
          {!isCollapsed && <span className="font-medium">Resume</span>}
        </button>
      </div>

      {/* History & Folder Sections - Only show in chat view */}
      {activeView === "chat" && (
      <div className="flex-1 overflow-y-auto px-2 space-y-6 py-4 custom-scrollbar">
        {/* Topic Search Bar - Only show when not collapsed */}
        {!isCollapsed && (
          <div className="px-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by topic..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  onSearchChange(e.target.value);
                }}
                className="w-full pl-8 pr-8 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:border-amber-400/50 focus:outline-none focus:bg-slate-800 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    onSearchChange("");
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="mt-1 px-2 text-[10px] text-slate-500 font-medium">
                Showing results for: <span className="text-amber-400">{searchTerm}</span>
              </div>
            )}
          </div>
        )}
        {/* Folders Section */}
        {!isCollapsed && (
          <div className="space-y-2">
            <div className="px-4 flex items-center justify-between group">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Folders</h3>
              <button 
                onClick={handleNewFolder}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all text-slate-400 hover:text-amber-400"
              >
                <FolderPlus size={14} />
              </button>
            </div>
            
            <div className="space-y-1">
              {/* All Items (Default) */}
              <div 
                onClick={() => onSelectFolder(null)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${activeFolderId === null ? "bg-amber-500/10 text-amber-400 font-bold" : "text-slate-400 hover:bg-white/5"}`}
              >
                <FolderOpen size={16} />
                <span className="text-sm">All Notes</span>
              </div>

              {/* Unorganized */}
              <div 
                onClick={() => onSelectFolder(-1)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${activeFolderId === -1 ? "bg-amber-500/10 text-amber-400 font-bold" : "text-slate-400 hover:bg-white/5"}`}
              >
                <Folder size={16} />
                <span className="text-sm">Standalone</span>
              </div>

              {folders.map(folder => (
                <div 
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${activeFolderId === folder.id ? "bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20" : "text-slate-400 hover:bg-white/5"}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Folder size={16} className={activeFolderId === folder.id ? "text-amber-500" : ""} />
                    <span className="text-sm truncate">{folder.name}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Starred section */}
        {starredNotes.length > 0 && (
          <div>
            {!isCollapsed && <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Starred</h3>}
            <div className="space-y-1">
              {starredNotes.map((note) => (
                <SidebarItem 
                  key={note.id}
                  note={note}
                  isActive={activeNoteId === note.id}
                  onClick={() => onSelectNote(note.id)}
                  onDelete={() => onDeleteNote(note.id)}
                  isCollapsed={isCollapsed}
                  icon={<Star size={16} className="text-amber-500 fill-amber-500/20" />}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent section */}
        <div>
          {!isCollapsed && <h3 className="px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">History</h3>}
          <div className="space-y-1">
            {recentNotes.length > 0 ? (
              recentNotes.map((note) => (
                <SidebarItem 
                  key={note.id}
                  note={note}
                  isActive={activeNoteId === note.id}
                  onClick={() => onSelectNote(note.id)}
                  onDelete={() => onDeleteNote(note.id)}
                  isCollapsed={isCollapsed}
                  icon={<MessageSquare size={16} />}
                />
              ))
            ) : (
              searchTerm && !isCollapsed && (
                <div className="px-4 py-3 text-xs text-slate-500 text-center">
                  No notes found for this topic
                </div>
              )
            )}
          </div>
        </div>
      </div>
      )}

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <div 
          onClick={onDownloadPDF}
          className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-yellow-500/10 cursor-pointer text-slate-400 hover:text-amber-400 transition-all active:scale-95 border border-transparent hover:border-yellow-500/20 shadow-lg hover:shadow-yellow-500/5 ${isCollapsed ? "justify-center" : ""}`}
        >
          <Download size={18} />
          {!isCollapsed && <span className="text-sm font-medium">Download PDF</span>}
        </div>
        <div className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer text-slate-400 hover:text-white transition-colors ${isCollapsed ? "justify-center" : ""}`}>
          <Settings size={18} />
          {!isCollapsed && <span className="text-sm">Settings</span>}
        </div>
      </div>
    </motion.div>
  );
}

function SidebarItem({ note, isActive, onClick, onDelete, isCollapsed, icon }) {
  return (
    <div 
      className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
        isActive 
          ? "bg-yellow-600/10 text-amber-400 border border-yellow-500/20" 
          : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
      } ${isCollapsed ? "justify-center" : ""}`}
      onClick={onClick}
    >
      <div className="shrink-0">{icon}</div>
      {!isCollapsed && (
        <>
          <span className="text-sm font-medium truncate flex-1">
            Problem #{note.problem_number}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
          Problem #{note.problem_number}
        </div>
      )}
    </div>
  );
}
