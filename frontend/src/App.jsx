import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./components/Sidebar";
import ChatContainer from "./components/ChatContainer";
import InputBar from "./components/InputBar";
import ResumeBuilder from "./pages/ResumeBuilder";
import { 
  generateNotes, getHistory, deleteHistory, toggleStar, downloadFile,
  getFolders, createFolder, deleteFolder, assignNoteToFolder 
} from "./services/api";
import DownloadModal from "./components/DownloadModal";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
  const [history, setHistory] = useState([]);
  const [folders, setFolders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [activeFolderId, setActiveFolderId] = useState(null); // null = "All Items", -1 = "Unorganized"
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [activeView, setActiveView] = useState("chat"); // "chat" or "resume"
  const [searchTerm, setSearchTerm] = useState(""); // Topic search term
  const inputRef = useRef(null);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch initial history & folders
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [hist, flds] = await Promise.all([getHistory(), getFolders()]);
        setHistory(hist || []);
        setFolders(flds || []);
      } catch (err) {
        console.error("Failed to fetch initial data", err);
        toast.error("Failed to load your workspace.");
      }
    };
    fetchInitial();
  }, []);

  // Handle Note Selection (Loads previous chat)
  const handleSelectNote = useCallback((id) => {
    const note = history.find((n) => n.id === id);
    if (note) {
      setActiveNoteId(id);
      // In this specific app, each history item is treated as a single "chat session"
      // displaying the problem description (user) and the generated notes (AI).
      setMessages([{
        id: note.id,
        problem_number: note.problem_number,
        generated_notes: note.generated_notes,
        is_starred: note.is_starred,
        tags: note.tags || [],
        code: "Solution loaded from history." // Note: Backend usually saves text, not original code?
                                             // Looking at backend/routes/notes.py, it doesn't save the code.
                                             // I'll show a placeholder for historic code.
      }]);
    }
  }, [history]);

  // Handle New Chat
  const handleNewChat = () => {
    setActiveNoteId(null);
    setMessages([]);
  };

  // Simulated Streaming Effect
  const streamNotes = async (fullText, messageId) => {
    const words = fullText.split(" ");
    let currentText = "";
    
    // Create an interval to simulate streaming
    for (let i = 0; i < words.length; i++) {
       currentText += (i === 0 ? "" : " ") + words[i];
       
       // Update the messages state for the AI response
       setMessages(prev => prev.map(msg => 
         msg.id === messageId ? { ...msg, generated_notes: currentText } : msg
       ));
       
       // Fast "stream" speed
       await new Promise(resolve => setTimeout(resolve, 15)); 
    }
  };

  const handleGenerate = async (data) => {
    setIsLoading(true);
    
    // Add user message to UI immediately
    const userMsgId = Date.now().toString();
    const newUserMsg = {
      id: userMsgId,
      problem_number: data.problemNumber,
      code: data.code,
      is_user: true
    };
    
    // Add temp AI message for streaming
    const aiMsgId = userMsgId + "_ai";
    const newAiMsg = {
      id: aiMsgId,
      problem_number: data.problemNumber,
      generated_notes: "", // Will be filled by stream
      is_starred: false,
      is_ai: true
    };

    setMessages([newUserMsg, newAiMsg]);

    try {
      const res = await generateNotes(data);
      
      // Update history
      const savedItem = {
        id: res.id,
        problem_number: res.problemNumber,
        generated_notes: res.notes,
        tags: res.tags || [],
        timestamp: Date.now() / 1000,
        is_starred: false
      };
      setHistory((prev) => [savedItem, ...prev]);
      setActiveNoteId(res.id);

      // Start streaming the real response
      await streamNotes(res.notes, aiMsgId);
      
      // Update message with tags
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, tags: res.tags || [] } : m));
      
      toast.success("Notes generated successfully!");
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to generate notes.";
      toast.error(msg);
      // Remove the empty AI message if failed
      setMessages(prev => prev.filter(m => m.id !== aiMsgId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStar = async (id) => {
    try {
      const updated = await toggleStar(id);
      setHistory((prev) => prev.map((n) => (n.id === id ? updated : n)));
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_starred: updated.is_starred } : m)));
      toast.success(updated.is_starred ? "Marked as Starred" : "Removed from Starred");
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await deleteHistory(id);
      setHistory((prev) => prev.filter((n) => n.id !== id));
      if (activeNoteId === id) {
        setMessages([]);
        setActiveNoteId(null);
      }
      toast.success("Note deleted successfully.");
    } catch (err) {
      toast.error("Failed to delete note.");
    }
  };

  const handleCreateFolder = async (name) => {
    try {
      const folder = await createFolder(name);
      setFolders(prev => [...prev, folder]);
      toast.success(`Folder "${name}" created.`);
    } catch (err) {
      toast.error("Failed to create folder.");
    }
  };

  const handleDeleteFolder = async (id) => {
    try {
      await deleteFolder(id);
      setFolders(prev => prev.filter(f => f.id !== id));
      // Re-assign notes in UI to standalone
      setHistory(prev => prev.map(n => n.folder_id === id ? { ...n, folder_id: null } : n));
      if (activeFolderId === id) setActiveFolderId(null);
      toast.success("Folder removed.");
    } catch (err) {
      toast.error("Failed to delete folder.");
    }
  };

  const handleMoveNote = async (noteId, folderId) => {
    try {
      const updated = await assignNoteToFolder(noteId, folderId);
      setHistory(prev => prev.map(n => n.id === noteId ? updated : n));
      toast.success(folderId ? "Moved to folder" : "Unorganized");
    } catch (err) {
      toast.error("Failed to move note.");
    }
  };

  const handleTagsChange = (noteId, tags) => {
    setHistory(prev => prev.map(n => n.id === noteId ? { ...n, tags } : n));
    setMessages(prev => prev.map(m => m.id === noteId ? { ...m, tags } : m));
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    // Clear active note when searching
    if (term) {
      setActiveNoteId(null);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloadModalOpen(true);
  };

  const onConfirmDownload = async (type) => {
    try {
      let options = {};
      if (type === "single" && activeNoteId) {
        options = { note_id: activeNoteId };
      } else if (type === "folder" && activeFolderId) {
        options = { folder_id: activeFolderId };
      }
      // If "history" or no specific selection, empty options = full history
      await downloadFile(options);
      toast.success("Export successful!");
      setIsDownloadModalOpen(false);
    } catch (err) {
      toast.error("Download failed.");
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden text-slate-100 font-sans selection:bg-yellow-500/30">
      <Toaster position="top-center" richColors theme="dark" />
      
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[50%] h-[50%] bg-amber-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-yellow-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Sidebar */}
      <Sidebar 
        history={history}
        folders={folders}
        activeNoteId={activeNoteId}
        activeFolderId={activeFolderId}
        onSelectNote={handleSelectNote}
        onSelectFolder={setActiveFolderId}
        onNewChat={handleNewChat}
        onDeleteNote={handleDeleteNote}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        onDownloadPDF={handleDownloadPDF}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeView={activeView}
        onViewChange={setActiveView}
        onSearchChange={handleSearchChange}
      />

      {/* Main Content */}
      {activeView === "chat" ? (
        <main className="flex-1 flex flex-col relative z-10 transition-all duration-300">
          {/* Header - Simplified breadcrumb / status */}
          <header className="h-14 border-b border-white/5 flex items-center px-6 gap-4 bg-[#0A0A0A]/50 backdrop-blur-md">
             <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
               {activeNoteId ? "Note Details" : "Assistant"}
             </div>
             {activeNoteId && (
               <div className="flex items-center gap-2">
                 <span className="w-1 h-1 bg-amber-500 rounded-full" />
                 <span className="text-sm font-semibold text-slate-300">LeetCode #{history.find(n => n.id === activeNoteId)?.problem_number}</span>
               </div>
             )}
          </header>

          {/* Chat Area */}
          <ChatContainer 
            messages={messages} 
            isLoading={isLoading} 
            folders={folders}
            onToggleStar={handleToggleStar}
            onMoveNote={handleMoveNote}
            onTagsChange={handleTagsChange}
          />

          {/* Input Area */}
          <InputBar 
            ref={inputRef}
            onSubmit={handleGenerate} 
            isLoading={isLoading} 
          />
        </main>
      ) : (
        <ResumeBuilder />
      )}

      {/* Download Modal */}
      <AnimatePresence>
        {isDownloadModalOpen && (
          <DownloadModal 
            isOpen={isDownloadModalOpen}
            onClose={() => setIsDownloadModalOpen(false)}
            onConfirm={onConfirmDownload}
            activeNote={activeNoteId ? history.find(n => n.id === activeNoteId) : null}
            activeFolder={activeFolderId ? folders.find(f => f.id === activeFolderId) : null}
          />
        )}
      </AnimatePresence>
    </div>
  );
}