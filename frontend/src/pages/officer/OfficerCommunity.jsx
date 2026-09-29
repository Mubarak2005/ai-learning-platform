import { useEffect, useState } from "react";
import { Users2, Send, Loader2 } from "lucide-react";
import Header from "../../components/layout/Header";
import { EmptyState, ErrorState, CardSkeleton } from "../../components/ui/States";
import { createCommunityPost, fetchCommunityPosts } from "../../services/onboardingService";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../services/api";

const ROLE_LABEL = {
  statistical_officer: "Statistical Officer",
  trainer: "Trainer",
  admin: "Administrator",
};

export default function OfficerCommunity() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [posting, setPosting] = useState(false);

  const load = () => {
    setLoading(true);
    fetchCommunityPosts()
      .then(setPosts)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load community posts"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      const post = await createCommunityPost(content.trim(), topic.trim() || null);
      setPosts((prev) => [post, ...prev]);
      setContent("");
      setTopic("");
    } catch {
      // leave input as-is on failure
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <Header title="Community" description="Discussions and peer learning with fellow officials." />

      <form onSubmit={handlePost} className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-5 mb-6">
        <div className="flex items-start gap-3">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, var(--color-brand-600), var(--color-accent-blue))" }}
          >
            {user?.initials || "?"}
          </span>
          <div className="flex-1">
            <textarea
              className="w-full text-[13.5px] border border-[var(--color-ink-200)] rounded-xl p-3 min-h-[70px] outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/30"
              placeholder="Ask a question or share something with fellow officials..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex items-center justify-between mt-2">
              <input
                className="text-[12.5px] border border-[var(--color-ink-200)] rounded-lg px-2.5 py-1.5 outline-none w-48"
                placeholder="Topic (optional)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <button
                type="submit"
                disabled={posting || !content.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-600)] text-white text-[12.5px] font-semibold disabled:opacity-50"
              >
                {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Post
              </button>
            </div>
          </div>
        </div>
      </form>

      {loading && (
        <div className="flex flex-col gap-3">
          <CardSkeleton /> <CardSkeleton />
        </div>
      )}

      {!loading && error && <ErrorState description={error} onRetry={load} />}

      {!loading && !error && posts.length === 0 && (
        <EmptyState icon={Users2} title="No posts yet" description="Be the first to start a discussion." />
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <div key={p.id} className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--color-brand-600), var(--color-accent-blue))" }}
                >
                  {p.author_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--color-ink-900)]">{p.author_name}</p>
                  <p className="text-[11px] text-[var(--color-ink-400)]">
                    {ROLE_LABEL[p.author_role] || p.author_role} · {new Date(p.created_at).toLocaleString()}
                  </p>
                </div>
                {p.topic && (
                  <span className="ml-auto text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-accent-blue-soft)] text-[var(--color-accent-blue)]">
                    {p.topic}
                  </span>
                )}
              </div>
              <p className="text-[13.5px] text-[var(--color-ink-700)] leading-relaxed">{p.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
