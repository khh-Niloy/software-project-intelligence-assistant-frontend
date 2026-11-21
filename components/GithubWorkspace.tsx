'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { GithubRepo, GithubUser, QAItem } from '../lib/types';
import { GithubRepoTree } from './GithubRepoTree';
import {
  FolderGit2,
  FolderTree,
  ExternalLink,
  LogOut,
  Database,
  Loader2,
  Sparkles,
  Brain,
  Paperclip,
  Send,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Search,
  Clock,
  LayoutGrid,
  PanelLeftOpen,
  PanelLeftClose,
  PanelRightOpen,
  PanelRightClose,
  Zap,
  AlertTriangle,
  Plus,
  GitBranch,
} from 'lucide-react';

export type GithubWorkspaceTab = 'query' | 'tree';

interface GithubWorkspaceProps {
  githubUser: GithubUser | null;
  isGithubLoading: boolean;
  onConnectGithub: () => void;
  onDisconnectGithub: () => void;
  selectedRepo: GithubRepo | null;
  reposCount: number;
  currentQA: QAItem | null;
  isNewChat: boolean;
  isLoadingQA: boolean;
  activeTab: GithubWorkspaceTab;
  onChangeTab: (tab: GithubWorkspaceTab) => void;
  onAskQuestion: (question: string) => Promise<void>;
  onNewQuestion: () => void;
  onIngestRepository: (repo: GithubRepo) => Promise<void>;
  repos?: GithubRepo[];
  onSelectRepo?: (repo: GithubRepo) => void;
  history?: QAItem[];
  selectedQnaId?: string | null;
  onSelectQna?: (qna: QAItem) => void;
  leftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  rightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
}

// Custom friendly SVG Robot Mascot matching the Dribbble design
export const RobotMascot: React.FC<{ size?: number; className?: string }> = ({
  size = 135,
  className = '',
}) => (
  <svg
    width={size}
    height={(size * 130) / 160}
    viewBox="0 0 160 130"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${className}`}
  >
    <defs>
      {/* 3D Pearl White Ceramic Gradient */}
      <linearGradient id="dbbWhite" x1="80" y1="8" x2="80" y2="130" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="55%" stopColor="#f8fafc" />
        <stop offset="85%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>

      {/* Head Highlight */}
      <linearGradient id="dbbHeadGrad" x1="80" y1="12" x2="80" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="70%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>

      {/* Visor Screen Deep Black Gradient */}
      <linearGradient id="dbbVisor" x1="80" y1="22" x2="80" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0b0f19" />
        <stop offset="60%" stopColor="#111827" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>

      {/* Visor Glass Diagonal Sheen */}
      <linearGradient id="dbbGlassReflect" x1="48" y1="24" x2="112" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
        <stop offset="40%" stopColor="#ffffff" stopOpacity="0.10" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>

      {/* Metallic Dark Joints */}
      <linearGradient id="dbbMetal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>

      {/* Hand Shading */}
      <linearGradient id="dbbHand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>

      {/* Cyan Eye Glow */}
      <filter id="dbbCyanGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Soft 3D Drop Shadow */}
      <filter id="dbbDropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#64748b" floodOpacity="0.22" />
      </filter>
    </defs>

    <g filter="url(#dbbDropShadow)">
      {/* 1. Top Antenna */}
      {/* Stem */}
      <rect x="78" y="4" width="4" height="8" rx="2" fill="url(#dbbMetal)" />
      {/* Ring / Ball on top */}
      <circle cx="80" cy="4" r="3.5" fill="url(#dbbWhite)" stroke="#cbd5e1" strokeWidth="1.2" />

      {/* 2. Torso (peeking down to card border line at y=118) */}
      <path
        d="M50 74 C50 70 60 68 80 68 C100 68 110 70 110 74 L114 118 C114 118 98 120 80 120 C62 120 46 118 46 118 Z"
        fill="url(#dbbWhite)"
        stroke="#cbd5e1"
        strokeWidth="1.2"
      />
      {/* Torso Center Panel Accent */}
      <path
        d="M60 78 C60 76 68 75 80 75 C92 75 100 76 100 78 L102 114 C102 116 92 117 80 117 C68 117 58 116 58 114 Z"
        fill="#f8fafc"
        stroke="#e2e8f0"
        strokeWidth="0.8"
      />
      {/* Subtle Cyan LED dot on chest */}
      <circle cx="80" cy="92" r="2" fill="#38bdf8" />

      {/* 3. Arms & Hands Clutching Card Top Edge */}
      {/* Left Arm */}
      <path
        d="M48 76 C38 78 30 84 28 94 C26 104 30 112 36 116 C40 118 46 115 48 108"
        fill="url(#dbbWhite)"
        stroke="#cbd5e1"
        strokeWidth="1.2"
      />
      {/* Right Arm */}
      <path
        d="M112 76 C122 78 130 84 132 94 C134 104 130 112 124 116 C120 118 114 115 112 108"
        fill="url(#dbbWhite)"
        stroke="#cbd5e1"
        strokeWidth="1.2"
      />

      {/* Left Hand (resting/gripping over card top border at y=118) */}
      <g>
        <rect x="30" y="112" width="20" height="12" rx="6" fill="url(#dbbHand)" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="36" y1="116" x2="36" y2="121" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
        <line x1="40" y1="116" x2="40" y2="121" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
        <line x1="44" y1="116" x2="44" y2="121" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* Right Hand (resting/gripping over card top border at y=118) */}
      <g>
        <rect x="110" y="112" width="20" height="12" rx="6" fill="url(#dbbHand)" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="116" y1="116" x2="116" y2="121" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
        <line x1="120" y1="116" x2="120" y2="121" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
        <line x1="124" y1="116" x2="124" y2="121" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* 4. Dark Collar Joint */}
      <rect x="68" y="65" width="24" height="6" rx="3" fill="url(#dbbMetal)" />

      {/* 5. Head (Glossy 3D Squircle Helmet) */}
      <path
        d="M38 30 C38 15 52 9 80 9 C108 9 122 15 122 30 L124 53 C124 64 112 68 98 68 H62 C48 68 36 64 36 53 Z"
        fill="url(#dbbHeadGrad)"
        stroke="#cbd5e1"
        strokeWidth="1.4"
      />

      {/* Head Top Specular Arc Highlight */}
      <path
        d="M52 15 C60 11 70 10 80 10 C90 10 100 11 108 15"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />

      {/* Ear Pods (flush 3D pills on sides) */}
      <ellipse cx="35" cy="42" rx="2.5" ry="8" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
      <ellipse cx="125" cy="42" rx="2.5" ry="8" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />

      {/* 6. Visor Screen */}
      <rect
        x="44"
        y="21"
        width="72"
        height="40"
        rx="15"
        fill="url(#dbbVisor)"
        stroke="#0f172a"
        strokeWidth="1.4"
      />

      {/* Visor Glass Reflection */}
      <path
        d="M47 25 C58 22 102 22 113 25 C108 37 98 42 80 42 C62 42 52 37 47 25 Z"
        fill="url(#dbbGlassReflect)"
      />

      {/* 7. Glowing Face: Happy Eyes `⌒  ⌒` */}
      <g filter="url(#dbbCyanGlow)">
        {/* Left Curved Eye */}
        <path
          d="M56 41 C56 34 61.5 32 66 32 C70.5 32 76 34 76 41"
          stroke="#38bdf8"
          strokeWidth="3.6"
          strokeLinecap="round"
        />

        {/* Right Curved Eye */}
        <path
          d="M84 41 C84 34 89.5 32 94 32 C98.5 32 104 34 104 41"
          stroke="#38bdf8"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
      </g>
    </g>
  </svg>
);

export const GithubWorkspace: React.FC<GithubWorkspaceProps> = ({
  githubUser,
  isGithubLoading,
  onConnectGithub,
  onDisconnectGithub,
  selectedRepo,
  currentQA,
  isNewChat,
  isLoadingQA,
  activeTab,
  onChangeTab,
  onAskQuestion,
  onNewQuestion,
  onIngestRepository,
  repos = [],
  onSelectRepo,
  leftSidebarOpen = true,
  onToggleLeftSidebar,
  rightSidebarOpen = true,
  onToggleRightSidebar,
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isReasoningEnabled, setIsReasoningEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState(false);
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0);
  const [thinkingElapsed, setThinkingElapsed] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const thinkingSteps = useMemo(() => [
    { label: 'Thinking...', detail: 'Understanding question intent & repository context...' },
    { label: 'Parsing Query Semantics...', detail: 'Extracting key AST symbols and file paths...' },
    { label: 'Searching Codebase...', detail: 'Retrieving relevant repository vector chunks...' },
    { label: 'Synthesizing with Gemini...', detail: 'Formulating grounded developer answer...' },
    { label: 'Polishing Citations...', detail: 'Attaching source lines & file references...' },
  ], []);

  useEffect(() => {
    if (!isLoadingQA) return;
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setThinkingElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const stepInterval = setInterval(() => {
      setThinkingStepIndex((prev) => (prev + 1) % thinkingSteps.length);
    }, 1500);

    return () => {
      clearInterval(timerInterval);
      clearInterval(stepInterval);
      setThinkingStepIndex(0);
      setThinkingElapsed(0);
    };
  }, [isLoadingQA, thinkingSteps.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentQA, isLoadingQA]);

  const handleIngestSelectedRepository = async () => {
    if (!selectedRepo || isIngesting) return;
    setIsIngesting(true);
    try {
      await onIngestRepository(selectedRepo);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmitQuestion = useCallback(async (customQuery?: string) => {
    const q = (customQuery || inputQuestion).trim();
    if (!q || isLoadingQA) return;

    if (!githubUser) {
      onConnectGithub();
      return;
    }

    if (!selectedRepo && repos.length > 0 && onSelectRepo) {
      onSelectRepo(repos[0]);
    }

    setInputQuestion('');
    setPendingQuestion(q);
    try {
      await onAskQuestion(q);
    } finally {
      setPendingQuestion(null);
    }
  }, [inputQuestion, isLoadingQA, githubUser, onConnectGithub, selectedRepo, repos, onSelectRepo, onAskQuestion]);

  const handlePillClick = (query: string) => {
    setInputQuestion(query);
    void handleSubmitQuestion(query);
  };

  const showActiveChat = (!isNewChat && currentQA) || isLoadingQA;

  const renderFormattedContent = (content: string) => {
    if (/<[a-z][\s\S]*>/i.test(content)) {
      return (
        <div
          className="text-slate-800 leading-relaxed text-xs space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_b]:font-semibold [&_strong]:font-semibold [&_p]:my-1"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    return (
      <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-xs font-sans">
        {content}
      </div>
    );
  };

  return (
    <div
      className={`flex-1 flex h-full min-w-0 bg-white/80 backdrop-blur-2xl border border-white/90 overflow-hidden font-sans select-none transition-all ${
        !leftSidebarOpen && !rightSidebarOpen
          ? 'rounded-[32px] md:rounded-[40px] shadow-[0_25px_70px_rgba(115,130,165,0.14)]'
          : 'rounded-[28px] md:rounded-[34px] shadow-[0_25px_70px_rgba(115,130,165,0.12)]'
      }`}
    >
      {/* 1. Left Mini Dock (Matching screenshot icon rail) */}
      <div className="w-13 sm:w-15 shrink-0 border-r border-slate-100/70 flex flex-col items-center justify-between py-4 sm:py-6 bg-white/35">
        <div className="flex flex-col items-center gap-3 sm:gap-3.5">
          {/* Top Mascot Icon Button (Home / New Chat) */}
          <button
            type="button"
            onClick={() => {
              onChangeTab('query');
              onNewQuestion();
            }}
            className="w-9 h-9 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-800 hover:scale-105 active:scale-95 transition-all cursor-pointer p-0.5"
            title="DevMind AI Home"
          >
            <RobotMascot size={26} />
          </button>

          {/* Search Button */}
          <button
            type="button"
            onClick={() => {
              onChangeTab('query');
              promptInputRef.current?.focus();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer"
            title="Focus Query Input"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* History / Previous Chats */}
          <button
            type="button"
            onClick={() => onToggleRightSidebar && onToggleRightSidebar()}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer"
            title="Previous Chats"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Repositories */}
          <button
            type="button"
            onClick={() => onToggleRightSidebar && onToggleRightSidebar()}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer"
            title="Repositories"
          >
            <FolderGit2 className="w-4 h-4" />
          </button>

          {/* Tree View Toggle */}
          <button
            type="button"
            onClick={() => onChangeTab(activeTab === 'tree' ? 'query' : 'tree')}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'tree'
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-slate-400 hover:text-slate-800 hover:bg-white'
            }`}
            title="Code Tree Explorer"
          >
            <FolderTree className="w-4 h-4" />
          </button>

          {/* Deep Reasoning Sparkle */}
          <button
            type="button"
            onClick={() => setIsReasoningEnabled((prev) => !prev)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isReasoningEnabled
                ? 'bg-purple-50 text-purple-600 border border-purple-200'
                : 'text-slate-400 hover:text-slate-800 hover:bg-white'
            }`}
            title="AI Reasoning Mode"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Icon: LayoutGrid (Matches screenshot bottom-left icon, opens/toggles workspaces) */}
        <div className="mt-auto">
          <button
            type="button"
            onClick={() => onToggleLeftSidebar && onToggleLeftSidebar()}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              leftSidebarOpen
                ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs'
                : 'text-slate-400 hover:text-slate-800 hover:bg-white'
            }`}
            title={leftSidebarOpen ? 'Hide Workspaces' : 'Open Workspaces'}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Tablet Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Card Top Bar (Clean & uncluttered, matching screenshot) */}
        <div className="min-h-14 px-5 sm:px-7 py-3 flex items-center justify-between gap-3 border-b border-slate-100/80 bg-white/40 shrink-0">
          {/* Left Brand Title & Left Sidebar Toggle Button */}
          <div className="flex items-center gap-2.5 min-w-0">
            {onToggleLeftSidebar && (
              <button
                type="button"
                onClick={onToggleLeftSidebar}
                title={leftSidebarOpen ? "Collapse Left Sidebar (Workspaces)" : "Open Left Sidebar (Workspaces)"}
                className="p-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
              >
                {leftSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4" />
                )}
              </button>
            )}
            <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              DevMind AI
            </span>
          </div>

          {/* Center Tab Switcher (Query vs Tree) */}
          {selectedRepo && (
            <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => onChangeTab('query')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'query'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Brain className="w-3 h-3 text-purple-600" />
                <span>Assistant</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('tree')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'tree'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FolderTree className="w-3 h-3 text-sky-600" />
                <span>File Tree</span>
              </button>
            </div>
          )}

          {/* Right Action Button (Matches the sleek dark "Upgrade" pill button) */}
          <div className="flex items-center gap-2 shrink-0">
            {!githubUser ? (
              <button
                type="button"
                onClick={onConnectGithub}
                disabled={isGithubLoading}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_18px_rgba(37,99,235,0.32)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isGithubLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Connect</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 text-slate-800 text-xs font-semibold shadow-2xs">
                  {githubUser.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={githubUser.avatarUrl}
                      alt=""
                      className="w-4 h-4 rounded-full border border-slate-300"
                    />
                  ) : null}
                  <span className="max-w-[120px] truncate">
                    {githubUser.username}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onDisconnectGithub}
                  disabled={isGithubLoading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  title="Disconnect GitHub account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}

            {/* Right Sidebar Toggle Button */}
            {onToggleRightSidebar && (
              <button
                type="button"
                onClick={onToggleRightSidebar}
                title={rightSidebarOpen ? "Collapse Right Sidebar (Repositories & Chats)" : "Open Right Sidebar (Repositories & Chats)"}
                className="p-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
              >
                {rightSidebarOpen ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRightOpen className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

          {/* Card Body Area */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col relative bg-[radial-gradient(ellipse_70%_60%_at_28%_45%,rgba(215,232,255,0.7),transparent_60%),radial-gradient(ellipse_65%_65%_at_86%_32%,rgba(255,238,226,0.7),transparent_55%)]">
            {/* VIEW 1: Tree Tab */}
            {activeTab === 'tree' ? (
              selectedRepo ? (
                <div className="flex-1 h-full overflow-hidden">
                  <GithubRepoTree
                    owner={selectedRepo.owner}
                    repo={selectedRepo.name}
                    branch={selectedRepo.default_branch || 'main'}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-slate-500">
                  <FolderTree className="w-8 h-8 mb-2 text-slate-300 stroke-1" />
                  <p className="font-medium text-slate-700">Select a repository to explore its tree</p>
                  <p className="text-[11px] text-slate-400 mt-1">Open the right sidebar to pick a repository.</p>
                </div>
              )
            ) : showActiveChat ? (
              /* VIEW 2: Active Chat / Answer View */
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Active Chat Header */}
                <div className="px-5 py-2.5 border-b border-slate-100 bg-white/40 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {selectedRepo ? selectedRepo.full_name : 'Repository QA'}
                    </span>
                    {selectedRepo?.html_url && (
                      <a
                        href={selectedRepo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-700"
                        title="Open on GitHub"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {selectedRepo?.default_branch && (
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 flex items-center gap-1">
                        <GitBranch className="w-2.5 h-2.5" />
                        <span>{selectedRepo.default_branch}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onNewQuestion}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Query</span>
                  </button>
                </div>

                {/* Conversation Thread */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {/* User Question */}
                  {(currentQA?.question || pendingQuestion) && (
                    <div className="flex justify-end items-start gap-2.5 pl-8 sm:pl-16">
                      <div className="bg-slate-800 text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-[0_6px_20px_rgba(15,23,42,0.12)] border border-slate-700/60 max-w-xl text-xs leading-relaxed">
                        <div className="flex items-center justify-between gap-4 mb-1 border-b border-white/10 pb-1 text-[10px] text-slate-300">
                          <span className="font-semibold uppercase tracking-wider">Your Query</span>
                          <span>
                            {currentQA?.createdAt
                              ? new Date(currentQA.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                              : 'Just now'}
                          </span>
                        </div>
                        <p className="font-medium">{pendingQuestion || currentQA?.question}</p>
                      </div>
                    </div>
                  )}

                  {/* Stepped Thinking Animation */}
                  {isLoadingQA && (
                    <div className="flex items-start gap-3 max-w-2xl pr-4">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 p-0.5">
                        <RobotMascot size={26} />
                      </div>
                      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl rounded-tl-xs p-4 shadow-sm w-full text-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                            <span className="font-semibold text-slate-800">
                              {thinkingSteps[thinkingStepIndex].label}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {thinkingElapsed}s
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-3">
                          {thinkingSteps[thinkingStepIndex].detail}
                        </p>
                        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-sky-500 h-1 rounded-full transition-all duration-300"
                            style={{
                              width: `${((thinkingStepIndex + 1) / thinkingSteps.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Response Card */}
                  {!isLoadingQA && currentQA && (
                    <div className="flex items-start gap-3 max-w-3xl pr-4">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 p-0.5">
                        <RobotMascot size={26} />
                      </div>

                      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-sm text-xs leading-relaxed text-slate-900 flex-1">
                        <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                              Assistant Answer
                            </span>
                            {currentQA.insufficientContext && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Context Limited</span>
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopy(currentQA._id || currentQA.id || 'qa', currentQA.answer)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
                            title="Copy answer"
                          >
                            {copiedId === (currentQA._id || currentQA.id || 'qa') ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-medium">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Formatted Answer */}
                        {renderFormattedContent(currentQA.answer)}

                        {/* Performance Timings */}
                        {currentQA.timings && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-500">
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-semibold flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 text-amber-500" />
                              {currentQA.timings.totalSeconds}s
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200">
                              embed: {currentQA.timings.embeddingSeconds}s
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200">
                              vector: {currentQA.timings.vectorSearchSeconds}s
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200">
                              gemini: {currentQA.timings.geminiSeconds}s
                            </span>
                          </div>
                        )}

                        {/* Source Citations */}
                        {Boolean(currentQA.rawChunks && currentQA.rawChunks.length > 0) && (
                          <div className="mt-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setExpandedSources((prev) => !prev)}
                              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              <Paperclip className="w-3 h-3 text-slate-400" />
                              <span>{currentQA.rawChunks?.length || 0} retrieved sources</span>
                              {expandedSources ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {expandedSources && (
                              <div className="mt-2.5 space-y-2 border-t border-slate-100 pt-2.5">
                                {currentQA.rawChunks?.map((chunk, cIdx) => (
                                  <div
                                    key={chunk.id || chunk._id || cIdx}
                                    className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-2.5 text-[11px]"
                                  >
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-mono">
                                      <span className="font-semibold text-slate-700 truncate">
                                        {typeof chunk.metadata?.filePath === 'string'
                                          ? `${chunk.metadata.filePath}${typeof chunk.metadata.startLine === 'number'
                                            ? `:${chunk.metadata.startLine}`
                                            : ''
                                          }`
                                          : `Source #${cIdx + 1}`}
                                      </span>
                                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1 py-0.2 rounded font-medium">
                                        Score: {typeof chunk.score === 'number' ? chunk.score.toFixed(3) : 'N/A'}
                                      </span>
                                    </div>
                                    <p className="text-slate-700 leading-relaxed font-sans font-normal">
                                      {chunk.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Follow-up Prompt Input Box */}
                <div className="p-3 sm:p-4 border-t border-slate-100 bg-white/70">
                  <div className="max-w-3xl mx-auto bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-300/30 transition-all flex items-center gap-2">
                    <textarea
                      value={inputQuestion}
                      onChange={(e) => setInputQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void handleSubmitQuestion();
                        }
                      }}
                      placeholder="Ask a follow-up question about this repository..."
                      rows={1}
                      className="flex-1 bg-transparent resize-none text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none px-2"
                    />

                    <button
                      type="button"
                      onClick={() => void handleSubmitQuestion()}
                      disabled={!inputQuestion.trim() || isLoadingQA}
                      className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all cursor-pointer shrink-0"
                    >
                      {isLoadingQA ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5 ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW 3: Hero Mascot & Action Console View (Exact match to uploaded design!) */
              <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-6 max-w-4xl mx-auto w-full text-center space-y-4">
                {/* Top Section: Left Headline + 3 Cards with Robot peeking behind Card 3 */}
                <div className="w-full max-w-3xl flex flex-col">
                  {/* Left Greeting Headline (Sitting directly above Card 1 & Card 2) */}
                  <div className="text-left mb-[-38px] max-w-md z-10 pointer-events-none">
                    <h1 className="text-2xl sm:text-3xl md:text-[32px] font-extrabold text-slate-900 tracking-tight leading-snug pointer-events-auto">
                      Hi {githubUser?.username || 'Developer'}, Ready to<br className="hidden sm:inline" /> Achieve Great Things?
                    </h1>
                  </div>

                  {/* Three Feature Cards (With Robot physically mounted directly on Card 3) */}
                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 pt-16">
                    {/* Card 1: Fast Start */}
                    <div
                      onClick={() => {
                        handlePillClick('Explain the core modules, syntax patterns, and application architecture.');
                      }}
                      className="bg-white/90 backdrop-blur-xl border border-white/95 rounded-2xl p-5 shadow-[0_8px_25px_rgba(120,135,170,0.08)] hover:shadow-[0_14px_35px_rgba(120,135,170,0.14)] hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between cursor-pointer group min-h-[200px]"
                    >
                      <div>
                        {/* Icon: Orange stacked isometric layers */}
                        <div className="w-9 h-9 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-center mb-3 text-amber-600 shadow-2xs">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                          Index repositories, explore source trees, and analyze commit histories — all in sync.
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 tracking-wider mt-4 block">
                        Fast Start
                      </span>
                    </div>

                    {/* Card 2: AI Assistant */}
                    <div
                      onClick={() => {
                        handlePillClick('Identify performance bottlenecks, heavy operations, and optimization opportunities.');
                      }}
                      className="bg-white/90 backdrop-blur-xl border border-white/95 rounded-2xl p-5 shadow-[0_8px_25px_rgba(120,135,170,0.08)] hover:shadow-[0_14px_35px_rgba(120,135,170,0.14)] hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between cursor-pointer group min-h-[200px]"
                    >
                      <div>
                        {/* Icon: Slack-style 4-color symbol */}
                        <div className="w-9 h-9 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-center mb-3 shadow-2xs">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="8" width="8" height="3" rx="1.5" fill="#36C5F0" />
                            <circle cx="15.5" cy="9.5" r="2.5" fill="#2EB67D" />
                            <rect x="13" y="13" width="8" height="3" rx="1.5" fill="#E01E5A" />
                            <circle cx="8.5" cy="14.5" r="2.5" fill="#ECB22E" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                          Stay connected with codebase logic, debug issues, and align architecture effortlessly with AI.
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 tracking-wider mt-4 block">
                        Collaborate with AI
                      </span>
                    </div>

                    {/* Card 3: Planning & Docs WITH Robot Mascot mounted on top */}
                    <div className="relative group">
                      {/* Robot Mascot peaking directly behind Card 3 with hands clutching the top edge */}
                      <div className="absolute -top-[98px] left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
                        {/* 3D Robot Mascot SVG */}
                        <div className="transform hover:scale-105 transition-transform duration-200">
                          <RobotMascot size={135} />
                        </div>
                      </div>

                      {/* Card 3 Body */}
                      <div
                        onClick={() => {
                          handlePillClick('Summarize project documentation, specifications, and architecture decisions.');
                        }}
                        className="relative z-10 bg-white/90 backdrop-blur-xl border border-white/95 rounded-2xl p-5 shadow-[0_8px_25px_rgba(120,135,170,0.08)] hover:shadow-[0_14px_35px_rgba(120,135,170,0.14)] hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between cursor-pointer min-h-[200px]"
                      >
                        <div>
                          {/* Icon: Blue calendar/doc symbol */}
                          <div className="w-9 h-9 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-center mb-3 shadow-2xs">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="3" y="4" width="18" height="17" rx="3.5" fill="#2563eb" />
                              <path d="M3 9H21" stroke="#ffffff" strokeWidth="1.5" />
                              <text x="12" y="17" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">31</text>
                            </svg>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                            Upload project docs, specifications, and reports with automatic LangChain chunking.
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 tracking-wider mt-4 block">
                          Planning & Docs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Highlight Action Banner */}
                <div className="w-full max-w-2xl bg-white/80 backdrop-blur-md border border-white/90 rounded-2xl p-3 px-4 sm:px-5 flex items-center justify-between gap-4 shadow-[0_6px_22px_rgba(120,135,170,0.08)] text-left">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                      {!githubUser
                        ? 'Unlock more with GitHub code intelligence'
                        : !selectedRepo
                          ? 'Select a repository to query commits & code'
                          : !selectedRepo.isIngested
                            ? `Index ${selectedRepo.name} for deep vector context`
                            : `Active: ${selectedRepo.full_name}`}
                    </span>
                  </div>

                  {!githubUser ? (
                    <button
                      type="button"
                      onClick={onConnectGithub}
                      disabled={isGithubLoading}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_18px_rgba(37,99,235,0.32)] transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      {isGithubLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Connect Now</span>
                    </button>
                  ) : !selectedRepo ? (
                    <button
                      type="button"
                      onClick={() => onToggleRightSidebar && onToggleRightSidebar()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all cursor-pointer shrink-0"
                    >
                      <span>Select Repo</span>
                    </button>
                  ) : !selectedRepo.isIngested ? (
                    <button
                      type="button"
                      onClick={() => void handleIngestSelectedRepository()}
                      disabled={isIngesting}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white text-xs font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      {isIngesting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Database className="w-3.5 h-3.5" />
                      )}
                      <span>{isIngesting ? 'Ingesting…' : 'Ingest Now'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onChangeTab('tree')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <FolderTree className="w-3.5 h-3.5 text-sky-200" />
                      <span>Browse Tree</span>
                    </button>
                  )}
                </div>

                {/* 4. Query Input Console Card - Only Send button as requested */}
                <div className="w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-white/90 rounded-2xl p-2.5 sm:p-3 shadow-[0_10px_35px_rgba(120,135,170,0.10)] focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 transition-all text-left flex items-center gap-2.5 sm:gap-3">
                  <textarea
                    ref={promptInputRef}
                    value={inputQuestion}
                    onChange={(e) => setInputQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleSubmitQuestion();
                      }
                    }}
                    placeholder="Initiate a query or ask anything about this repository..."
                    rows={1}
                    className="flex-1 bg-transparent resize-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none py-1.5 px-2 font-medium leading-relaxed"
                  />

                  {/* Send button (Eye-soothing blue circle with white send icon) */}
                  <button
                    type="button"
                    onClick={() => void handleSubmitQuestion()}
                    disabled={!inputQuestion.trim() || isLoadingQA}
                    className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center shadow-[0_4px_14px_rgba(37,99,235,0.28)] transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
                    title="Send query"
                  >
                    {isLoadingQA ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                </div>

                {/* 5. Suggestion Pills Row (Software Intelligence & Codebase Queries) */}
                <div className="flex items-center justify-center gap-2 flex-wrap max-w-2xl pt-1">
                  {[
                    { label: '</> Codebase Overview', query: 'Explain the core modules, syntax patterns, and application architecture.' },
                    { label: '⚙️ Architecture Flow', query: 'What is the end-to-end data flow, module hierarchy, and component relationships?' },
                    { label: '🛡️ Security & Bugs', query: 'Audit this repository for security vulnerabilities, memory leaks, and anti-patterns.' },
                    { label: '📦 Dependencies', query: 'List and explain key dependencies, package configurations, and runtime requirements.' },
                    { label: '🧪 Testing Strategy', query: 'Analyze the test coverage, unit tests, and how to run tests in this repo.' },
                    { label: '⚡ Performance', query: 'Identify performance bottlenecks, heavy operations, and optimization opportunities.' },
                    { label: '🐞 Troubleshoot', query: 'What are common errors or failure points in this repo and how to fix them?' },
                  ].map((pill, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePillClick(pill.query)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-white/90 text-slate-600 hover:text-slate-900 text-xs font-medium shadow-[0_4px_14px_rgba(120,135,170,0.06)] hover:shadow-[0_6px_18px_rgba(120,135,170,0.12)] transition-all cursor-pointer active:scale-95"
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};
