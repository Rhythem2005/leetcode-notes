import { useState } from "react";
import { Copy, Download, AlertCircle, Loader } from "lucide-react";
import { toast } from "sonner";
import { BASE_URL } from "../config/api.js";

export default function ResumeBuilder() {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [latex, setLatex] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("input");

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description");
      return;
    }

    setIsLoading(true);
    setError("");
    setLatex("");
    setPdfUrl("");

    try {
      const response = await fetch(`${BASE_URL}/api/resume/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      // Debug logging
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers.get("content-type"));

      // Get response text first
      const responseText = await response.text();
      console.log("Response text length:", responseText.length);
      
      if (!responseText || responseText.length === 0) {
        setError("Backend returned empty response");
        toast.error("Backend returned empty response");
        return;
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        console.error("Response text preview:", responseText.substring(0, 200));
        setError(`Invalid response from server: ${parseErr.message}`);
        toast.error("Server returned invalid JSON");
        return;
      }

      if (!response.ok) {
        setError(data.error || "Failed to generate resume");

        // If 422 (compilation error), show both error and LaTeX
        if (response.status === 422 && data.latex) {
          setLatex(data.latex);
        }

        toast.error(data.error || `Error: ${response.status}`);
        return;
      }

      // Validate response contains required fields
      if (!data.latex || !data.pdfUrl) {
        console.error("Invalid response structure:", data);
        setError("Invalid response structure from server");
        toast.error("Invalid response from server");
        return;
      }

      setLatex(data.latex);
      setPdfUrl(`${BASE_URL}${data.pdfUrl}`);
      setActiveTab("output");
      toast.success("Resume generated successfully!");
    } catch (err) {
      const errorMsg = err.message || "Network error";
      console.error("Fetch error:", err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLatex = () => {
    navigator.clipboard
      .writeText(latex)
      .then(() => toast.success("LaTeX copied to clipboard!"))
      .catch(() => toast.error("Failed to copy"));
  };

  return (
    <div className="w-full h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-6 bg-gradient-to-r from-amber-500/5 to-transparent">
        <h1 className="text-3xl font-bold text-amber-400">Resume Builder</h1>
        <p className="text-slate-400 text-sm mt-1">
          Paste a job description and Gemini will optimize your resume
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab("input")}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === "input"
                  ? "text-amber-400 border-b-2 border-amber-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Input
            </button>
            {latex && (
              <>
                <button
                  onClick={() => setActiveTab("latex")}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === "latex"
                      ? "text-amber-400 border-b-2 border-amber-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  LaTeX
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === "preview"
                      ? "text-amber-400 border-b-2 border-amber-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  PDF Preview
                </button>
              </>
            )}
          </div>

          {/* Input Tab */}
          {activeTab === "input" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Paste Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here. Include requirements, skills, responsibilities, etc."
                  className="w-full h-96 bg-[#1e293b] border border-white/10 rounded-lg p-4 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none resize-none"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading || !jobDescription.trim()}
                className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isLoading || !jobDescription.trim()
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 active:scale-95"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Resume"
                )}
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-400">Error</h4>
                <p className="text-red-300/80 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* LaTeX Tab */}
          {activeTab === "latex" && latex && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">LaTeX Code</h3>
                <button
                  onClick={handleCopyLatex}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors"
                >
                  <Copy size={16} />
                  Copy
                </button>
              </div>

              <div className="bg-[#1e293b] border border-white/10 rounded-lg overflow-hidden">
                <pre className="p-4 overflow-x-auto text-sm text-slate-300 font-mono max-h-96">
                  <code>{latex}</code>
                </pre>
              </div>
            </div>
          )}

          {/* PDF Preview Tab */}
          {activeTab === "preview" && pdfUrl && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">PDF Preview</h3>
                <a
                  href={pdfUrl}
                  download
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors font-medium"
                >
                  <Download size={16} />
                  Download PDF
                </a>
              </div>

              <div className="bg-[#1e293b] border border-white/10 rounded-lg overflow-hidden">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[600px] border-none"
                  title="Resume PDF Preview"
                />
              </div>

              <p className="text-slate-400 text-sm">
                Note: If the PDF doesn't load in preview, click "Download PDF" to view it locally.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
