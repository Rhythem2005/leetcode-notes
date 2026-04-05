import axios from "axios";
import { BASE_URL } from "../config/api.js";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Error handling interceptor
api.interceptors.response.use(
  response => response,
  error => {
    console.error("[API Error]", error.message);
    if (error.response?.status === 401) {
      console.warn("Unauthorized - redirecting to login");
    }
    return Promise.reject(error);
  }
);

/**
 * Generate notes for a given LeetCode problem.
 * @param {{ problemNumber: string, code: string }} data
 */
export async function generateNotes(data) {
  const res = await api.post("/generate", data);
  return res.data;
}

/**
 * Download the notes file (pdf).
 * Triggers a browser file-save dialog.
 * @param {object} options { note_id?: string, folder_id?: string }
 */
export async function downloadFile(options = {}) {
  const res = await api.get("/download", {
    params: options,
    responseType: "blob",
  });

  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leetcode_notes.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Fetch all accumulated notes as text.
 */
export async function getAllNotes() {
  const res = await api.get("/all-notes");
  return res.data;
}

// --------------------------------------------------
// History & Bookmarks Endpoints
// --------------------------------------------------

/**
 * Fetch all saved notes history with optional tag filtering.
 * @param {string} tagFilter - Optional tag name to filter by
 */
export async function getHistory(tagFilter) {
  const res = await api.get("/api/history", {
    params: tagFilter ? { tag: tagFilter } : {}
  });
  return res.data;
}

/**
 * Save newly generated note to history.
 * @param {string} problem_number 
 * @param {string} generated_notes 
 */
export async function saveHistory(problem_number, generated_notes) {
  const res = await api.post("/api/history", { problem_number, generated_notes });
  return res.data;
}

/**
 * Delete a note from history.
 * @param {string} id 
 */
export async function deleteHistory(id) {
  const res = await api.delete(`/api/history/${id}`);
  return res.data.success;
}

/**
 * Toggle the bookmarked/starred status of a note.
 * @param {string} id 
 */
export async function toggleStar(id) {
  const res = await api.patch(`/api/history/${id}/star`);
  return res.data;
}

// --------------------------------------------------
// Folders Endpoints
// --------------------------------------------------

/**
 * Fetch all folders.
 */
export async function getFolders() {
  const res = await api.get("/api/history/folders");
  return res.data;
}

/**
 * Create a new folder.
 * @param {string} name 
 */
export async function createFolder(name) {
  const res = await api.post("/api/history/folders", { name });
  return res.data;
}

/**
 * Delete a folder.
 * @param {string} id 
 */
export async function deleteFolder(id) {
  const res = await api.delete(`/api/history/folders/${id}`);
  return res.data.success;
}

/**
 * Assign a note to a folder.
 * @param {string} noteId 
 * @param {string | null} folderId 
 */
export async function assignNoteToFolder(noteId, folderId) {
  const res = await api.patch(`/api/history/${noteId}/folder`, { folder_id: folderId });
  return res.data;
}

// --------------------------------------------------
// Tags Endpoints
// --------------------------------------------------

/**
 * Update tags for a note.
 * @param {string} noteId 
 * @param {string[]} tags 
 */
export async function updateTags(noteId, tags) {
  const res = await api.patch(`/api/history/${noteId}/tags`, { tags });
  return res.data;
}
