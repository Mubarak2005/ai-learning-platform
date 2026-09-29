import { useEffect, useRef, useState } from "react";
import { UploadCloud, FileText, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import { EmptyState } from "../../components/ui/States";
import { fetchMaterials, generateQuestions, uploadMaterial } from "../../services/trainerService";
import { ApiError } from "../../services/api";

export default function TrainerUpload() {
  const [materials, setMaterials] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const load = () => {
    fetchMaterials()
      .then(setMaterials)
      .catch(() => setMaterials([]));
  };

  useEffect(load, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const material = await uploadMaterial(file);
      setMaterials((prev) => [material, ...prev]);
    } catch (err) {
      setError(err instanceof ApiError || err.message ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async (materialId) => {
    setGeneratingId(materialId);
    setError(null);
    try {
      const assessment = await generateQuestions(materialId, 8);
      navigate(`/trainer/questions?assessment=${assessment.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not generate questions from this material.");
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div>
      <Header
        title="Upload Content"
        description="Upload PDF, PPTX or DOCX training material. The platform extracts text, chunks it, and can generate draft MCQs for your review."
      />

      <label className="flex flex-col items-center justify-center gap-3 bg-white rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-ink-200)] p-10 mb-8 cursor-pointer hover:border-[var(--color-brand-500)] transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-blue-soft)] flex items-center justify-center">
          <UploadCloud size={26} className="text-[var(--color-accent-blue)]" />
        </div>
        <p className="font-semibold text-[14px] text-[var(--color-ink-900)]">
          {uploading ? "Uploading and processing…" : "Click to upload a file"}
        </p>
        <p className="text-[12px] text-[var(--color-ink-500)]">PDF, PPTX or DOCX — up to 25MB</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx,.docx"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>

      {error && (
        <p className="text-[13px] text-[var(--color-accent-pink)] bg-[var(--color-accent-pink-soft)] rounded-xl px-3.5 py-2.5 mb-6">
          {error}
        </p>
      )}

      <h2 className="text-[16px] font-bold text-[var(--color-ink-900)] mb-4">Your Materials</h2>
      {materials.length === 0 ? (
        <EmptyState icon={FileText} title="No materials uploaded yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {materials.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-[var(--color-ink-500)]" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[13.5px] text-[var(--color-ink-900)] truncate">{m.file_name}</p>
                  <p className="text-[12px] text-[var(--color-ink-500)] flex items-center gap-1 mt-0.5">
                    {m.processed ? (
                      <>
                        <CheckCircle2 size={12} className="text-[var(--color-accent-teal)]" /> Processed
                      </>
                    ) : (
                      "Processing…"
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleGenerate(m.id)}
                disabled={!m.processed || generatingId === m.id}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-600)] text-white text-[12.5px] font-semibold hover:bg-[var(--color-brand-700)] disabled:opacity-50"
              >
                {generatingId === m.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Generate Questions
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
