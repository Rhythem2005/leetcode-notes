import React, { useState } from "react";
import { X, Plus } from "lucide-react";

export default function TagComponent({ tags = [], onTagsChange, editable = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.toLowerCase().trim())) {
      const newTags = [...tags, inputValue.toLowerCase().trim()];
      onTagsChange(newTags);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tag) => {
    const newTags = tags.filter((t) => t !== tag);
    onTagsChange(newTags);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddTag();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 text-amber-400 rounded-full text-xs font-medium border border-amber-500/20 hover:border-amber-500/40 transition-all"
          >
            <span>[{tag}]</span>
            {editable && (
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-0.5 hover:text-amber-300 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {editable && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-amber-400 transition-colors hover:bg-white/5 rounded-full"
          >
            <Plus size={12} />
            Add tag
          </button>
        )}
      </div>

      {editable && isEditing && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., dp, graph, array"
            className="flex-1 px-2 py-1 bg-[#1e293b] border border-white/10 rounded text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleAddTag}
            disabled={!inputValue.trim()}
            className="px-3 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 rounded text-sm font-medium transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setInputValue("");
            }}
            className="px-2 py-1 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
