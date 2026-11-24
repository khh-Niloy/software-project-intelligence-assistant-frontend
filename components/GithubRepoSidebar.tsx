"use client";

import React, { useState, useMemo } from "react";
import { GithubRepo, QAItem } from "../lib/types";
import {
  FolderGit2,
  RefreshCw,
  Search,
  ExternalLink,
  Lock,
  Globe,
  Star,
  GitBranch,
  AlertCircle,
  Database,
  Loader2,
  MessageSquare,
} from "lucide-react";

interface GithubRepoSidebarProps {
  repos: GithubRepo[];
  isLoading: boolean;
  selectedRepoName: string | null;
  onSelectRepo: (repo: GithubRepo) => void;
  onRefresh: () => void;
  isConnected: boolean;
  onConnectGithub: () => void;
  onIngestRepository: (repo: GithubRepo) => Promise<void>;
  history: QAItem[];
  selectedQnaId: string | null;
  onSelectQna: (qna: QAItem) => void;
  isLoadingHistory: boolean;
}

const getLanguageColor = (language: string | null): string => {
  if (!language) return "#94a3b8";
  const langLower = language.toLowerCase();
  switch (langLower) {
    case "typescript":
      return "#3178c6";
    case "javascript":
      return "#f1e05a";
    case "python":
      return "#3572a5";
    case "go":
      return "#00add8";
    case "rust":
      return "#dea584";
    case "java":
      return "#b07219";
    case "html":
      return "#e34c26";
    case "css":
      return "#563d7c";
    case "c++":
    case "cpp":
      return "#f34b7d";
    case "c":
      return "#555555";
    case "c#":
    case "csharp":
      return "#178600";
    default:
      return "#64748b";
  }
};

export const GithubRepoSidebar: React.FC<GithubRepoSidebarProps> = ({
  repos,
  isLoading,
  selectedRepoName,
  onSelectRepo,
  onRefresh,
  isConnected,
  onConnectGithub,
  onIngestRepository,
  history,
  selectedQnaId,
  onSelectQna,
  isLoadingHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [ingestingRepoName, setIngestingRepoName] = useState<string | null>(
    null,
  );
  const [activeSidebarTab, setActiveSidebarTab] = useState<"repos" | "chats">(
    "repos",
  );

  const handleIngest = async (repo: GithubRepo) => {
    setIngestingRepoName(repo.name);
    try {
      await onIngestRepository(repo);
    } finally {
      setIngestingRepoName(null);
    }
  };

  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return repos;
    const q = searchQuery.toLowerCase();
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.full_name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.language && r.language.toLowerCase().includes(q)),
    );
  }, [repos, searchQuery]);

  return (
    <aside className="w-full h-full bg-white/80 backdrop-blur-2xl rounded-[28px] md:rounded-[32px] border border-white/90 shadow-[0_20px_50px_rgba(115,130,165,0.09)] flex flex-col font-sans select-none overflow-hidden bg-[radial-gradient(ellipse_at_top_right,rgba(255,238,226,0.45),transparent_70%)]">
      {/* Top Header */}
      <div className="h-14 px-4 border-b border-slate-100/70 flex items-center justify-between bg-white/40 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-800 shadow-2xs shrink-0">
            <FolderGit2 className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xs font-bold text-slate-900 tracking-tight truncate">
              Repositories
            </h2>
            {isConnected && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600 text-[10px] font-mono font-medium shrink-0">
                {repos.length}
              </span>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">
          {isConnected && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh repositories"
              className="p-1.5 rounded-lg border border-slate-200/80 bg-white/60 text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="p-2.5 border-b border-slate-100/70 bg-white/35 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-slate-100/70 rounded-xl text-xs font-medium gap-1">
            <button
              type="button"
              onClick={() => setActiveSidebarTab("repos")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${activeSidebarTab === "repos" ? "bg-white text-slate-900 font-semibold shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
            >
              <FolderGit2 className="w-3.5 h-3.5" /> Repositories
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full border border-slate-200/80">
                {repos.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSidebarTab("chats")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${activeSidebarTab === "chats" ? "bg-white text-slate-900 font-semibold shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Previous Chats
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full border border-slate-200/80">
                {history.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Search Input Bar (when connected and has repos) */}
      {isConnected && activeSidebarTab === "repos" && repos.length > 0 && (
        <div className="p-3 border-b border-slate-100/70 bg-white/35 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/80 border border-slate-200/80 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/30 transition-all text-slate-800 shadow-2xs"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {isConnected && activeSidebarTab === "chats" ? (
          <div key="chats" className="space-y-1.5 animate-fade-in">
            {isLoadingHistory ? (
              <div className="p-3 text-center text-xs text-neutral-500">
                Loading previous chats…
              </div>
            ) : history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center text-neutral-500">
                <MessageSquare className="w-8 h-8 mb-2 stroke-1 text-neutral-400" />
                <p className="text-xs font-medium">No repository chats yet</p>
                <p className="text-[11px] mt-1">
                  Questions about repositories will appear here.
                </p>
              </div>
            ) : (
              history.map((qna) => {
                const qnaId = qna._id || qna.id || "";
                const isSelected = qnaId === selectedQnaId;
                return (
                  <button
                    key={qnaId}
                    type="button"
                    onClick={() => onSelectQna(qna)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${isSelected ? "bg-white border-blue-400/80 shadow-[0_4px_16px_rgba(59,130,246,0.12)] ring-1 ring-blue-400/20" : "bg-white/70 hover:bg-white border-slate-100/90 hover:border-slate-200 shadow-[0_2px_8px_rgba(120,135,170,0.04)]"}`}
                  >
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {qna.question}
                    </p>
                    <p className="text-[10px] text-blue-600 font-medium mt-0.5 truncate">
                      {qna.repoName || qna.documentName || "Repository"}
                    </p>
                    {qna.createdAt && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(qna.createdAt).toLocaleString()}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div key="repos" className="space-y-1.5 animate-fade-in">
            {/* State 1: Not connected */}
            {!isConnected ? (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-600 mb-3">
                  <FolderGit2 className="w-6 h-6 text-slate-700" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  GitHub Not Connected
                </p>
                <p className="text-[11px] text-slate-500 mt-1 mb-4 leading-relaxed max-w-[14rem]">
                  Connect your GitHub account to inspect your public and private
                  repositories.
                </p>
                <button
                  type="button"
                  onClick={onConnectGithub}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_18px_rgba(37,99,235,0.32)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Connect GitHub</span>
                </button>
              </div>
            ) : isLoading && repos.length === 0 ? (
              /* State 2: Loading skeletons */
              <div className="space-y-1.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl border border-slate-100 bg-white/70 animate-pulse space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 rounded w-10" />
                    </div>
                    <div className="h-2 bg-slate-100 rounded w-full" />
                    <div className="flex justify-between items-center pt-0.5">
                      <div className="h-2 bg-slate-100 rounded w-16" />
                      <div className="h-3.5 bg-slate-100 rounded w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRepos.length === 0 ? (
              /* State 3: Empty search or no repos */
              <div className="h-full flex flex-col items-center justify-center p-4 text-center text-neutral-400">
                <AlertCircle className="w-8 h-8 mb-2 stroke-1" />
                <p className="text-xs font-medium text-neutral-600">
                  {searchQuery
                    ? "No matching repositories"
                    : "No repositories found"}
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {searchQuery
                    ? "Try another search term"
                    : "Your GitHub account has no repos"}
                </p>
              </div>
            ) : (
              /* State 4: Repository List */
              filteredRepos.map((repo) => {
                const isSelected = selectedRepoName === repo.name;
                return (
                  <div
                    key={repo.full_name}
                    onClick={() => onSelectRepo(repo)}
                    className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? "bg-white border-blue-400/80 shadow-[0_4px_18px_rgba(59,130,246,0.12)] ring-1 ring-blue-400/20"
                        : "bg-white/75 hover:bg-white border-slate-100/90 hover:border-slate-200 shadow-[0_2px_8px_rgba(120,135,170,0.04)] hover:shadow-[0_4px_14px_rgba(120,135,170,0.07)]"
                    }`}
                  >
                    {/* Repo header */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate block">
                          {repo.name}
                        </span>
                      </div>

                      {/* Privacy badge & External Link */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                            repo.private
                              ? "bg-amber-50 text-amber-700 border-amber-200/80"
                              : "bg-white/80 text-slate-500 border-slate-200/70"
                          }`}
                        >
                          {repo.private ? (
                            <Lock className="w-2.5 h-2.5" />
                          ) : (
                            <Globe className="w-2.5 h-2.5" />
                          )}
                          <span>{repo.private ? "Private" : "Public"}</span>
                        </span>

                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open on GitHub"
                          className="p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Repo Description */}
                    {repo.description && (
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 leading-snug">
                        {repo.description}
                      </p>
                    )}

                    {/* Repo Metadata & Ingest Action Row */}
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100/80 flex items-center justify-between gap-2 text-[10px] text-slate-500 font-medium">
                      <div className="flex items-center gap-2 truncate min-w-0">
                        {/* Language dot */}
                        {repo.language && (
                          <span className="flex items-center gap-1 truncate font-medium text-slate-700">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: getLanguageColor(
                                  repo.language,
                                ),
                              }}
                            />
                            <span className="truncate">{repo.language}</span>
                          </span>
                        )}

                        {/* Default branch */}
                        <span className="flex items-center gap-0.5 font-mono text-slate-400 shrink-0">
                          <GitBranch className="w-2.5 h-2.5" />
                          <span>{repo.default_branch || "main"}</span>
                        </span>

                        {/* Stars count */}
                        {repo.stargazers_count > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-600 font-mono shrink-0">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>{repo.stargazers_count}</span>
                          </span>
                        )}
                      </div>

                      {/* Ingest Action Button / Ingested status */}
                      <div className="shrink-0">
                        {repo.isIngested ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-medium">
                            <Database className="w-2.5 h-2.5" /> Ingested
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleIngest(repo);
                            }}
                            disabled={ingestingRepoName !== null}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60 text-[9px] font-semibold shadow-2xs transition-all cursor-pointer disabled:cursor-wait"
                          >
                            {ingestingRepoName === repo.name ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              <Database className="w-2.5 h-2.5" />
                            )}
                            {ingestingRepoName === repo.name
                              ? "Ingesting…"
                              : "Ingest"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      {isConnected && activeSidebarTab === "repos" && repos.length > 0 && (
        <div className="p-2 px-3.5 border-t border-slate-100/70 bg-white/40 text-[10px] text-slate-400 flex items-center justify-between shrink-0 font-mono">
          <span>{filteredRepos.length} displayed</span>
          <span>Updated realtime</span>
        </div>
      )}
    </aside>
  );
};
