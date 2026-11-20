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
    <aside className="w-full h-full bg-[#fbfbfb] border-l border-[#e5e7eb] flex flex-col font-sans select-none overflow-hidden">
      {/* Top Header */}
      <div className="h-14 px-4 border-b border-[#e5e7eb] flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xs font-bold text-[#0d0d0d] tracking-tight truncate">
              Repositories
            </h2>
            {isConnected && (
              <span className="px-1.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 text-[10px] font-mono font-medium shrink-0">
                {repos.length}
              </span>
            )}
          </div>
        </div>

        {/* Refresh button */}
        {isConnected && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh repositories"
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>

      {isConnected && (
        <div className="p-2.5 border-b border-[#e5e7eb] bg-white shrink-0">
          <div className="grid grid-cols-2 p-1 bg-[#f0f0f0] rounded-xl text-xs font-medium gap-1">
            <button
              type="button"
              onClick={() => setActiveSidebarTab("repos")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${activeSidebarTab === "repos" ? "bg-white text-[#0d0d0d] font-semibold shadow-2xs" : "text-[#666] hover:text-[#0d0d0d]"}`}
            >
              <FolderGit2 className="w-3.5 h-3.5" /> Repositories
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full border">
                {repos.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSidebarTab("chats")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${activeSidebarTab === "chats" ? "bg-white text-[#0d0d0d] font-semibold shadow-2xs" : "text-[#666] hover:text-[#0d0d0d]"}`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Previous Chats
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full border">
                {history.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Search Input Bar (when connected and has repos) */}
      {isConnected && activeSidebarTab === "repos" && repos.length > 0 && (
        <div className="p-3 border-b border-[#e5e7eb] bg-white shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isConnected && activeSidebarTab === "chats" ? (
          isLoadingHistory ? (
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
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${isSelected ? "bg-blue-50 border-blue-300" : "bg-white border-[#e5e7eb] hover:border-neutral-300"}`}
                >
                  <p className="text-xs font-semibold text-neutral-800 line-clamp-2">
                    {qna.question}
                  </p>
                  <p className="text-[10px] text-blue-700 mt-1 truncate">
                    {qna.repoName || qna.documentName || "Repository"}
                  </p>
                  {qna.createdAt && (
                    <p className="text-[10px] text-neutral-400 mt-1">
                      {new Date(qna.createdAt).toLocaleString()}
                    </p>
                  )}
                </button>
              );
            })
          )
        ) : (
          <>
            {/* State 1: Not connected */}
            {!isConnected ? (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 mb-3">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-neutral-800">
                  GitHub Not Connected
                </p>
                <p className="text-[11px] text-neutral-500 mt-1 mb-4 leading-relaxed max-w-[14rem]">
                  Connect your GitHub account to inspect your public and private
                  repositories.
                </p>
                <button
                  type="button"
                  onClick={onConnectGithub}
                  className="px-3.5 py-2 rounded-xl bg-[#0d0d0d] hover:bg-neutral-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Connect GitHub</span>
                </button>
              </div>
            ) : isLoading && repos.length === 0 ? (
              /* State 2: Loading skeletons */
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-neutral-200 bg-white animate-pulse space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-3.5 bg-neutral-200 rounded w-2/3" />
                      <div className="h-3.5 bg-neutral-200 rounded w-10" />
                    </div>
                    <div className="h-2.5 bg-neutral-100 rounded w-full" />
                    <div className="flex gap-2">
                      <div className="h-2.5 bg-neutral-100 rounded w-12" />
                      <div className="h-2.5 bg-neutral-100 rounded w-12" />
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
                    className={`group relative p-3 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? "bg-blue-50/50 border-blue-400 shadow-2xs ring-1 ring-blue-400/40"
                        : "bg-white border-[#e5e7eb] hover:border-neutral-300 hover:shadow-2xs"
                    }`}
                  >
                    {/* Repo header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-[#0d0d0d] group-hover:text-blue-600 transition-colors truncate">
                            {repo.name}
                          </span>
                        </div>
                      </div>

                      {/* Privacy badge & External Link */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                            repo.private
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-neutral-50 text-neutral-600 border-neutral-200"
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
                          className="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Repo Description */}
                    {repo.description && (
                      <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-tight">
                        {repo.description}
                      </p>
                    )}

                    {/* Repo Metadata Footer */}
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-neutral-500 font-medium pt-1.5 border-t border-neutral-100">
                      <div className="flex items-center gap-2.5 truncate">
                        {/* Language dot */}
                        {repo.language && (
                          <span className="flex items-center gap-1 truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
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
                        <span className="flex items-center gap-0.5 font-mono text-neutral-400">
                          <GitBranch className="w-2.5 h-2.5" />
                          <span>{repo.default_branch || "main"}</span>
                        </span>
                      </div>

                      {/* Stars count */}
                      {repo.stargazers_count > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-600 font-mono">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{repo.stargazers_count}</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex justify-end">
                      {repo.isIngested ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-medium">
                          <Database className="w-3 h-3" /> Ingested
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleIngest(repo);
                          }}
                          disabled={ingestingRepoName !== null}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-60 text-[10px] font-medium transition-colors cursor-pointer disabled:cursor-wait"
                        >
                          {ingestingRepoName === repo.name ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Database className="w-3 h-3" />
                          )}
                          {ingestingRepoName === repo.name
                            ? "Ingesting…"
                            : "Ingest"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Bottom Footer Info */}
      {isConnected && activeSidebarTab === "repos" && repos.length > 0 && (
        <div className="p-2.5 px-4 border-t border-[#e5e7eb] bg-white text-[10px] text-neutral-400 flex items-center justify-between shrink-0 font-mono">
          <span>{filteredRepos.length} displayed</span>
          <span>Updated realtime</span>
        </div>
      )}
    </aside>
  );
};
