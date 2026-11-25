"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DocumentItem, QAItem, GithubUser, GithubRepo } from "../lib/types";
import {
  fetchDocuments,
  uploadDocument,
  searchDocument,
  searchRepository,
  fetchQnas,
  fetchRepositoryQnas,
  fetchGithubStatus,
  disconnectGithub,
  getGithubLoginUrl,
  fetchGithubRepositories,
  ingestGithubRepository,
} from "../lib/api";
import { LeftSidebar, NavItemKey } from "../components/LeftSidebar";
import { RightSidebar, RightSidebarTab } from "../components/RightSidebar";
import { ChatSection } from "../components/ChatSection";
import {
  GithubWorkspace,
  GithubWorkspaceTab,
} from "../components/GithubWorkspace";
import { GithubRepoSidebar } from "../components/GithubRepoSidebar";
import { RequirementTraceabilityView } from "../components/RequirementTraceabilityView";
import { AlertCircle, CheckCircle, Layers, Menu } from "lucide-react";

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavItemKey>("doc-query");
  const [rightTab, setRightTab] = useState<RightSidebarTab>("documents");

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [history, setHistory] = useState<QAItem[]>([]);
  const [selectedQAId, setSelectedQAId] = useState<string | null>(null);
  const [isNewChat, setIsNewChat] = useState<boolean>(true);

  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingQA, setIsLoadingQA] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [mobileView, setMobileView] = useState<"nav" | "main" | "right">(
    "main",
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [githubUser, setGithubUser] = useState<GithubUser | null>(null);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [githubQA, setGithubQA] = useState<QAItem | null>(null);
  const [githubHistory, setGithubHistory] = useState<QAItem[]>([]);
  const [selectedGithubQnaId, setSelectedGithubQnaId] = useState<string | null>(
    null,
  );
  const [isLoadingGithubHistory, setIsLoadingGithubHistory] = useState(false);
  const [githubWorkspaceTab, setGithubWorkspaceTab] =
    useState<GithubWorkspaceTab>("query");
  const [isNewGithubChat, setIsNewGithubChat] = useState(true);
  const [isLoadingGithubQA, setIsLoadingGithubQA] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showDocLeftSidebar, setShowDocLeftSidebar] = useState(true);
  const [showDocRightSidebar, setShowDocRightSidebar] = useState(true);

  const isLeftOpen =
    activeNav === "doc-query" ? showDocLeftSidebar : showLeftSidebar;
  const isRightOpen =
    activeNav === "doc-query" ? showDocRightSidebar : showRightSidebar;

  const handleToggleLeftSidebar = () => {
    if (activeNav === "doc-query") {
      setShowDocLeftSidebar((prev) => !prev);
    } else {
      setShowLeftSidebar((prev) => !prev);
    }
  };

  const handleToggleRightSidebar = () => {
    if (activeNav === "doc-query") {
      setShowDocRightSidebar((prev) => !prev);
    } else {
      setShowRightSidebar((prev) => !prev);
    }
  };

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  const loadGithubRepos = useCallback(async () => {
    setIsLoadingRepos(true);
    try {
      const repos = await fetchGithubRepositories();
      setGithubRepos(repos);
      if (repos.length > 0) {
        setSelectedRepo((prev) =>
          prev
            ? (repos.find((repo) => repo.name === prev.name) ?? repos[0])
            : repos[0],
        );
      } else {
        setSelectedRepo(null);
      }
    } catch (err) {
      console.error("Failed to load GitHub repositories:", err);
    } finally {
      setIsLoadingRepos(false);
    }
  }, []);

  const loadGithubHistory = useCallback(async () => {
    setIsLoadingGithubHistory(true);
    try {
      setGithubHistory(await fetchRepositoryQnas());
    } catch (err) {
      console.warn("Failed to load repository chat history:", err);
    } finally {
      setIsLoadingGithubHistory(false);
    }
  }, []);

  //test

  const loadGithubStatus = useCallback(async () => {
    try {
      const status = await fetchGithubStatus();
      setGithubUser(status.connected ? status.user : null);
      if (status.connected) {
        loadGithubRepos();
      } else {
        setGithubRepos([]);
        setSelectedRepo(null);
      }
    } catch (err) {
      console.warn("Failed to fetch GitHub status:", err);
    }
  }, [loadGithubRepos]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadGithubHistory();
    });
  }, [loadGithubHistory]);

  // Handle GitHub OAuth redirect parameters in URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ghStatus = params.get("github");
    if (ghStatus === "connected") {
      const user = params.get("user");
      window.history.replaceState({}, "", window.location.pathname);
      queueMicrotask(() => {
        showToast(
          `GitHub account linked successfully! ${user ? `@${user}` : ""}`,
          "success",
        );
        void loadGithubStatus();
      });
    } else if (ghStatus === "error") {
      const message = params.get("message") || "GitHub connection failed";
      window.history.replaceState({}, "", window.location.pathname);
      queueMicrotask(() => {
        showToast(message, "error");
      });
    }
  }, [showToast, loadGithubStatus]);

  const handleConnectGithub = () => {
    setIsGithubLoading(true);
    window.location.href = getGithubLoginUrl();
  };

  const handleDisconnectGithub = async () => {
    setIsGithubLoading(true);
    try {
      await disconnectGithub();
      setGithubUser(null);
      setGithubRepos([]);
      setSelectedRepo(null);
      setGithubQA(null);
      setSelectedGithubQnaId(null);
      setGithubWorkspaceTab("query");
      setIsNewGithubChat(true);
      showToast("GitHub account disconnected", "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to disconnect GitHub",
        "error",
      );
    } finally {
      setIsGithubLoading(false);
    }
  };

  // Load Documents from Backend
  const loadDocuments = useCallback(
    async (quiet = false) => {
      if (!quiet) setIsRefreshing(true);
      try {
        const docs = await fetchDocuments();
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDocumentId((prev) => {
            if (prev && docs.some((d) => d._id === prev)) return prev;
            return docs[0]._id;
          });
        }
      } catch (err: unknown) {
        console.error("Failed to load documents:", err);
        if (!quiet) {
          const msg =
            err instanceof Error
              ? err.message
              : "Cannot connect to backend server on port 5000";
          showToast(msg, "error");
        }
      } finally {
        if (!quiet) setIsRefreshing(false);
      }
    },
    [showToast],
  );

  // Initial load
  useEffect(() => {
    let active = true;
    Promise.all([fetchDocuments(), fetchQnas(), fetchGithubStatus()])
      .then(([docs, qnas, ghStatus]) => {
        if (active) {
          setDocuments(docs);
          setHistory(qnas);
          if (ghStatus?.connected) {
            setGithubUser(ghStatus.user);
            void loadGithubRepos();
          }
          if (docs.length > 0) {
            setSelectedDocumentId((prev) => prev ?? docs[0]._id);
          }
        }
      })
      .catch((err: unknown) => {
        if (active) {
          console.error("Initial load failed:", err);
        }
      })
      .finally(() => {
        if (active) {
          setIsInitialLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loadGithubRepos]);

  // Auto-poll if any document is currently pending or processing
  const hasProcessingDocs = useMemo(() => {
    return documents.some(
      (d) => d.status === "pending" || d.status === "processing",
    );
  }, [documents]);

  useEffect(() => {
    if (!hasProcessingDocs) return;

    const interval = setInterval(() => {
      loadDocuments(true);
    }, 2500);

    return () => clearInterval(interval);
  }, [hasProcessingDocs, loadDocuments]);

  // Handle Upload
  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const res = await uploadDocument(file);
      showToast(
        `Uploaded "${file.name}" successfully! Indexed with vector embeddings.`,
        "success",
      );
      // Reload documents and auto-select uploaded doc
      await loadDocuments(true);
      const newDocId = res.document?._id || res.document?.id;
      if (newDocId) {
        setSelectedDocumentId(newDocId);
      }
      return res;
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      const msg = err instanceof Error ? err.message : "Upload failed";
      showToast(msg, "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Ask Question
  const handleAskQuestion = async (question: string) => {
    if (!selectedDocumentId) {
      showToast("Please select a document first", "error");
      return;
    }

    setIsLoadingQA(true);
    try {
      const response = await searchDocument(question, selectedDocumentId);

      const savedQA: QAItem = response.qna || {
        id: `qa-${Date.now()}`,
        documentId: selectedDocumentId,
        documentName:
          documents.find((d) => d._id === selectedDocumentId)?.filename ||
          "Document",
        question,
        answer: response.res?.answer || "No response generated.",
        insufficientContext: response.res?.insufficientContext || false,
        rawChunks: response.rawChunks || [],
        timings: response.timings,
        createdAt: new Date().toISOString(),
      };

      setHistory((prev) => [savedQA, ...prev]);
      setSelectedQAId(savedQA._id || savedQA.id || null);
      setIsNewChat(false);
    } catch (err: unknown) {
      console.error("Search failed:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to query document";
      showToast(msg, "error");
    } finally {
      setIsLoadingQA(false);
    }
  };

  const handleNewChat = () => {
    setSelectedQAId(null);
    setIsNewChat(true);
  };

  const handleAskGithubQuestion = async (question: string) => {
    if (!selectedRepo) {
      showToast("Please select a repository first", "error");
      return;
    }
    if (!selectedRepo.isIngested) {
      showToast("Please ingest the selected repository first, then try again.", "error");
      return;
    }

    setIsLoadingGithubQA(true);
    try {
      const response = await searchRepository(question, selectedRepo.name);
      const savedQA: QAItem = response.qna || {
        id: `github-qa-${Date.now()}`,
        repoName: selectedRepo.name,
        documentName: selectedRepo.full_name,
        question,
        answer: response.res?.answer || "No response generated.",
        insufficientContext: response.res?.insufficientContext || false,
        rawChunks: response.rawChunks || [],
        timings: response.timings,
        createdAt: new Date().toISOString(),
      };
      setGithubQA(savedQA);
      const savedId = savedQA._id || savedQA.id || null;
      setSelectedGithubQnaId(savedId);
      setGithubHistory((prev) => [
        savedQA,
        ...prev.filter((item) => (item._id || item.id) !== savedId),
      ]);
      setIsNewGithubChat(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to query repository";
      showToast(message, "error");
    } finally {
      setIsLoadingGithubQA(false);
    }
  };

  const handleNewGithubQuestion = () => {
    setGithubQA(null);
    setSelectedGithubQnaId(null);
    setIsNewGithubChat(true);
  };

  const handleSelectGithubQna = (qna: QAItem) => {
    setGithubQA(qna);
    setSelectedGithubQnaId(qna._id || qna.id || null);
    setIsNewGithubChat(false);
    setGithubWorkspaceTab("query");
    if (qna.repoName) {
      const matchingRepo = githubRepos.find(
        (repo) => repo.name === qna.repoName,
      );
      setSelectedRepo(matchingRepo ?? null);
    }
    setMobileView("main");
  };

  const handleIngestGithubRepository = async (repo: GithubRepo) => {
    try {
      const result = await ingestGithubRepository(repo.name);
      await loadGithubRepos();
      showToast(
        `Indexed ${repo.full_name}: ${result.totalFiles} files and ${result.totalChunks} code chunks.`,
        "success",
      );
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : `Failed to ingest ${repo.full_name}`,
        "error",
      );
    }
  };

  const selectedDocument = useMemo(() => {
    if (!selectedDocumentId) return documents[0] || null;
    return documents.find((d) => d._id === selectedDocumentId) || null;
  }, [documents, selectedDocumentId]);

  const currentQA = useMemo(() => {
    if (!selectedQAId) return null;
    return history.find((h) => (h._id || h.id) === selectedQAId) || null;
  }, [history, selectedQAId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#eef2f9] bg-[radial-gradient(ellipse_85%_75%_at_10%_15%,rgba(215,230,255,0.9),transparent_65%),radial-gradient(ellipse_75%_70%_at_90%_22%,rgba(255,238,225,0.85),transparent_60%),radial-gradient(ellipse_80%_65%_at_50%_92%,rgba(235,241,252,0.95),transparent_70%)] text-[#0d0d0d] font-sans selection:bg-neutral-200 selection:text-black p-3 sm:p-4 md:p-4 lg:p-6 gap-3 sm:gap-4 md:gap-4 lg:gap-5 items-center justify-center relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 bg-white/95 border-[#e5e7eb] text-[#0d0d0d]">
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* 1. LEFT SIDEBAR SLOT: Preserves space so center never jumps; empty when closed */}
      <div className="hidden md:flex h-full max-h-[92vh] shrink-0 w-64 lg:w-72 items-center justify-center">
        <div
          className={`w-full h-full transition-all duration-300 ${isLeftOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none invisible"
            }`}
        >
          <LeftSidebar
            activeNav={activeNav}
            onSelectNav={(key) => {
              setActiveNav(key);
              setMobileView("main");
              if (
                (key === "github-query" || key === "traceability") &&
                githubRepos.length === 0
              ) {
                void loadGithubRepos();
              }
            }}
            user={githubUser}
          />
        </div>
      </div>

      {/* Mobile Drawer for Left Sidebar */}
      {mobileView === "nav" && (
        <div className="md:hidden fixed inset-y-0 left-0 p-3 flex shadow-xl z-30">
          <LeftSidebar
            activeNav={activeNav}
            onSelectNav={(key) => {
              setActiveNav(key);
              setMobileView("main");
              if (
                (key === "github-query" || key === "traceability") &&
                githubRepos.length === 0
              ) {
                void loadGithubRepos();
              }
            }}
            user={githubUser}
          />
        </div>
      )}

      {/* Mobile Backdrop for Left Sidebar */}
      {mobileView === "nav" && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setMobileView("main")}
        />
      )}

      {/* 2. CENTER MAIN WORKSPACE TABLET */}
      <div
        className={`flex-1 flex flex-col h-full max-h-[92vh] min-w-0 ${activeNav === "traceability" ? "max-w-7xl" : "max-w-5xl xl:max-w-6xl"
          } relative transition-all duration-300`}
      >
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-3 py-2.5 border-b border-[#e5e7eb] bg-white rounded-t-2xl">
          <button
            onClick={() => setMobileView("nav")}
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
            <span>
              {activeNav === "doc-query"
                ? "Project Documentation Query"
                : activeNav === "github-query"
                  ? "Github related query (Developers)"
                  : "Project Requirement Traceability"}
            </span>
          </div>
          {activeNav !== "traceability" ? (
            <button
              onClick={() =>
                setMobileView(mobileView === "right" ? "main" : "right")
              }
              className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs flex items-center gap-1"
            >
              <Layers className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-7" />
          )}
        </div>

        {/* Dynamic Center Page Content */}
        {activeNav === "doc-query" ? (
          <div className="flex-1 flex flex-col h-full min-w-0 bg-white/85 backdrop-blur-2xl rounded-[28px] md:rounded-[34px] border border-white/90 shadow-[0_25px_70px_rgba(115,130,165,0.12)] overflow-hidden">
            <ChatSection
              selectedDocument={selectedDocument}
              history={history}
              currentQA={currentQA}
              isNewChat={isNewChat}
              onAskQuestion={handleAskQuestion}
              onNewQuestion={handleNewChat}
              isLoading={isLoadingQA}
              isInitialLoading={isInitialLoading}
              leftSidebarOpen={showDocLeftSidebar}
              onToggleLeftSidebar={handleToggleLeftSidebar}
              rightSidebarOpen={showDocRightSidebar}
              onToggleRightSidebar={handleToggleRightSidebar}
            />
          </div>
        ) : activeNav === "github-query" ? (
          <GithubWorkspace
            githubUser={githubUser}
            isGithubLoading={isGithubLoading}
            onConnectGithub={handleConnectGithub}
            onDisconnectGithub={handleDisconnectGithub}
            selectedRepo={selectedRepo}
            reposCount={githubRepos.length}
            currentQA={githubQA}
            isNewChat={isNewGithubChat}
            isLoadingQA={isLoadingGithubQA}
            onAskQuestion={handleAskGithubQuestion}
            onNewQuestion={handleNewGithubQuestion}
            onIngestRepository={handleIngestGithubRepository}
            activeTab={githubWorkspaceTab}
            onChangeTab={setGithubWorkspaceTab}
            repos={githubRepos}
            onSelectRepo={(repo) => {
              setSelectedRepo(repo);
              setGithubQA(null);
              setSelectedGithubQnaId(null);
              setIsNewGithubChat(true);
              setMobileView("main");
            }}
            history={githubHistory}
            selectedQnaId={selectedGithubQnaId}
            onSelectQna={handleSelectGithubQna}
            leftSidebarOpen={showLeftSidebar}
            onToggleLeftSidebar={handleToggleLeftSidebar}
            rightSidebarOpen={showRightSidebar}
            onToggleRightSidebar={handleToggleRightSidebar}
          />
        ) : (
          <RequirementTraceabilityView
            documents={documents}
            repos={githubRepos}
            onUploadDocument={handleUploadFile}
            onRefreshRepos={loadGithubRepos}
            onIngestRepository={handleIngestGithubRepository}
            onToggleLeftSidebar={handleToggleLeftSidebar}
            leftSidebarOpen={isLeftOpen}
          />
        )}
      </div>

      {/* 3. RIGHT SIDEBAR SLOT: Preserves space so center never jumps; empty when closed */}
      {activeNav !== "traceability" && (
        <div className="hidden md:flex h-full max-h-[92vh] shrink-0 w-80 lg:w-84 items-center justify-center">
          <div
            className={`w-full h-full transition-all duration-300 ${isRightOpen
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 pointer-events-none invisible"
              }`}
          >
            {activeNav === "doc-query" ? (
              <RightSidebar
                activeTab={rightTab}
                onChangeTab={setRightTab}
                documents={documents}
                selectedDocumentId={selectedDocumentId}
                onSelectDocument={(id) => {
                  setSelectedDocumentId(id);
                  setSelectedQAId(null);
                  setIsNewChat(true);
                  setMobileView("main");
                }}
                onUploadFile={handleUploadFile}
                isUploading={isUploading}
                isLoadingDocs={isInitialLoading || isRefreshing}
                history={history}
                selectedQAId={selectedQAId}
                onSelectQA={(qa) => {
                  setSelectedQAId(qa._id || qa.id || null);
                  setIsNewChat(false);
                  if (qa.documentId) {
                    setSelectedDocumentId(qa.documentId);
                  }
                  setActiveNav("doc-query");
                  setMobileView("main");
                }}
                isLoadingHistory={isInitialLoading || isRefreshing}
              />
            ) : (
              <GithubRepoSidebar
                repos={githubRepos}
                isLoading={isLoadingRepos}
                selectedRepoName={selectedRepo?.name ?? null}
                onSelectRepo={(repo) => {
                  setSelectedRepo(repo);
                  setGithubQA(null);
                  setSelectedGithubQnaId(null);
                  setIsNewGithubChat(true);
                  setMobileView("main");
                }}
                onRefresh={loadGithubRepos}
                isConnected={!!githubUser}
                onConnectGithub={handleConnectGithub}
                onIngestRepository={handleIngestGithubRepository}
                history={githubHistory}
                selectedQnaId={selectedGithubQnaId}
                onSelectQna={handleSelectGithubQna}
                isLoadingHistory={isLoadingGithubHistory}
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer for Right Sidebar */}
      {mobileView === "right" && activeNav !== "traceability" && (
        <div className="md:hidden fixed inset-y-0 right-0 p-3 flex shadow-xl z-30">
          {activeNav === "doc-query" ? (
            <RightSidebar
              activeTab={rightTab}
              onChangeTab={setRightTab}
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={(id) => {
                setSelectedDocumentId(id);
                setSelectedQAId(null);
                setIsNewChat(true);
                setMobileView("main");
              }}
              onUploadFile={handleUploadFile}
              isUploading={isUploading}
              isLoadingDocs={isInitialLoading || isRefreshing}
              history={history}
              selectedQAId={selectedQAId}
              onSelectQA={(qa) => {
                setSelectedQAId(qa._id || qa.id || null);
                setIsNewChat(false);
                if (qa.documentId) {
                  setSelectedDocumentId(qa.documentId);
                }
                setActiveNav("doc-query");
                setMobileView("main");
              }}
              isLoadingHistory={isInitialLoading || isRefreshing}
            />
          ) : (
            <GithubRepoSidebar
              repos={githubRepos}
              isLoading={isLoadingRepos}
              selectedRepoName={selectedRepo?.name ?? null}
              onSelectRepo={(repo) => {
                setSelectedRepo(repo);
                setGithubQA(null);
                setSelectedGithubQnaId(null);
                setIsNewGithubChat(true);
                setMobileView("main");
              }}
              onRefresh={loadGithubRepos}
              isConnected={!!githubUser}
              onConnectGithub={handleConnectGithub}
              onIngestRepository={handleIngestGithubRepository}
              history={githubHistory}
              selectedQnaId={selectedGithubQnaId}
              onSelectQna={handleSelectGithubQna}
              isLoadingHistory={isLoadingGithubHistory}
            />
          )}
        </div>
      )}

      {/* Mobile Backdrop for Right Sidebar */}
      {mobileView === "right" && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setMobileView("main")}
        />
      )}
    </div>
  );
}
