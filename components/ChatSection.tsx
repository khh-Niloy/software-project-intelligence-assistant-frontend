'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DocumentItem, QAItem } from '../lib/types';
import {
  ArrowUp,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Zap,
  Plus,
  PanelLeftOpen,
  PanelLeftClose,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';

interface ChatSectionProps {
  selectedDocument: DocumentItem | null;
  history: QAItem[];
  currentQA: QAItem | null;
  isNewChat?: boolean;
  onAskQuestion: (question: string) => Promise<void>;
  onNewQuestion: () => void;
  isLoading: boolean;
  isInitialLoading?: boolean;
  contextType?: 'document' | 'repository';
  contextName?: string;
  contextReady?: boolean;
  leftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  rightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  selectedDocument,
  currentQA,
  isNewChat = false,
  onAskQuestion,
  onNewQuestion,
  isLoading,
  isInitialLoading = false,
  contextType = 'document',
  contextName,
  contextReady,
  leftSidebarOpen = true,
  onToggleLeftSidebar,
  rightSidebarOpen = true,
  onToggleRightSidebar,
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [expandedSourcesId, setExpandedSourcesId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0);
  const [thinkingElapsed, setThinkingElapsed] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const thinkingSteps = useMemo(() => {
    return [
      {
        label: 'Thinking...',
        detail: 'Understanding question intent & context...',
      },
      {
        label: 'Parsing Query Semantics...',
        detail: 'Generating dense vector embedding representation...',
      },
      {
        label: 'Searching Knowledge Base...',
        detail: 'Executing cosine vector similarity retrieval...',
      },
      {
        label: 'Extracting Context Chunks...',
        detail: 'Selecting top matching document passages...',
      },
      {
        label: 'Synthesizing Response...',
        detail: 'Formulating grounded answer with Gemini...',
      },
      {
        label: 'Polishing & Structuring...',
        detail: 'Formatting citations, key points & final answer...',
      },
    ];
  }, []);

  useEffect(() => {
    if (!isLoading) return;

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setThinkingElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const stepInterval = setInterval(() => {
      setThinkingStepIndex((prev) => (prev + 1) % thinkingSteps.length);
    }, 1600);

    return () => {
      clearInterval(timerInterval);
      clearInterval(stepInterval);
      setThinkingStepIndex(0);
      setThinkingElapsed(0);
    };
  }, [isLoading, thinkingSteps.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentQA, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;

    const q = inputQuestion.trim();
    setInputQuestion('');
    setPendingQuestion(q);
    try {
      await onAskQuestion(q);
    } finally {
      setPendingQuestion(null);
    }
  };

  const handleSuggestedClick = async (q: string) => {
    if (isLoading) return;
    setPendingQuestion(q);
    try {
      await onAskQuestion(q);
    } finally {
      setPendingQuestion(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormattedContent = (content: string) => {
    if (/<[a-z][\s\S]*>/i.test(content)) {
      return (
        <div
          className="text-[#171717] leading-relaxed text-xs space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_b]:font-semibold [&_strong]:font-semibold [&_p]:my-1"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    return (
      <div className="whitespace-pre-wrap text-[#171717] leading-relaxed text-xs">
        {content}
      </div>
    );
  };

  const activeContextName = contextName ?? selectedDocument?.filename;
  const hasActiveContext = contextReady ?? Boolean(selectedDocument);

  const starterQuestions = useMemo(() => {
    if (!hasActiveContext || !activeContextName) {
      return [];
    }

    const docName = activeContextName || 'this source';

    if (contextType === 'repository') {
      return [
        `What is the purpose and structure of ${docName}?`,
        'Summarize the main modules and how they work together.',
        'Where is the main application logic implemented?',
      ];
    }

    return [
      `What is the main topic of ${docName}?`,
      'Summarize the key points and findings in bullet format.',
      'What policies, terms, or actions are specified in this document?',
    ];
  }, [activeContextName, contextType, hasActiveContext]);

  const qaKey =
    currentQA?._id || currentQA?.id || currentQA?.timestamp || 'qa-active';
  const isSourcesExpanded = expandedSourcesId === qaKey;
  const hasSources =
    Boolean(currentQA?.rawChunks && currentQA.rawChunks.length > 0);

  const showAnswerView = !isNewChat && currentQA && !isLoading;
  const showLoadingView = isLoading;
  const showWelcomeView = !showAnswerView && !showLoadingView;

  return (
    <div className="flex flex-col h-full relative font-sans bg-[radial-gradient(ellipse_70%_60%_at_28%_45%,rgba(215,232,255,0.7),transparent_60%),radial-gradient(ellipse_65%_65%_at_86%_32%,rgba(255,238,226,0.7),transparent_55%)]">
      {/* Top Banner: Selected Context Indicator */}
      {contextType !== 'repository' && (
        <div className="px-5 py-3 border-b border-slate-100/70 bg-white/40 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {onToggleLeftSidebar && (
              <button
                type="button"
                onClick={onToggleLeftSidebar}
                title={leftSidebarOpen ? 'Collapse Left Sidebar (Workspaces)' : 'Open Left Sidebar (Workspaces)'}
                className="p-1.5 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 shadow-[0_2px_8px_rgba(120,135,170,0.06)] hover:shadow-xs transition-all cursor-pointer shrink-0"
              >
                {leftSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4" />
                )}
              </button>
            )}
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
              UPLOADED DOC
            </span>
            <div className="h-3.5 w-px bg-slate-200/70 shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                {isInitialLoading ? (
                  <div className="space-y-1.5 py-0.5">
                    <div className="h-3.5 w-36 bg-slate-200 rounded animate-pulse" />
                    <div className="h-2.5 w-24 bg-slate-100 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <span
                        className="truncate max-w-[200px] sm:max-w-xs md:max-w-md"
                        title={activeContextName}
                      >
                        {activeContextName ?? 'No document selected'}
                      </span>
                      {selectedDocument?.fileUrl && (
                        <a
                          href={selectedDocument.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                          title="View file in Supabase"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </p>
                    {selectedDocument ? (
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <span className="capitalize font-medium text-emerald-700">
                          {selectedDocument.status}
                        </span>
                        <span>•</span>
                        <span>
                          {selectedDocument.totalChunks || 0} Chunks Indexed
                        </span>
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {contextType === 'document' && selectedDocument?.status === 'processing' && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                <span>Embedding chunks...</span>
              </div>
            )}

            {/* Quick Auth Navigation */}
            <div className="hidden sm:flex items-center gap-1.5 mr-1">
              <Link
                href="/login"
                className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-medium shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-2.5 py-1.5 rounded-xl text-white bg-blue-600 hover:bg-blue-700 text-xs font-medium shadow-2xs shadow-blue-500/20 hover:shadow-xs transition-all cursor-pointer"
              >
                Register
              </Link>
            </div>

            {onToggleRightSidebar && (
              <button
                type="button"
                onClick={onToggleRightSidebar}
                title={rightSidebarOpen ? 'Collapse Right Sidebar (Documents & Chats)' : 'Open Right Sidebar (Documents & Chats)'}
                className="p-1.5 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 shadow-[0_2px_8px_rgba(120,135,170,0.06)] hover:shadow-xs transition-all cursor-pointer shrink-0"
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
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* 1. Welcome View (New Question mode) */}
        {showWelcomeView && (
          <div className="flex flex-col items-center justify-center min-h-[420px] text-center max-w-xl mx-auto py-12">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_16px_rgba(120,135,170,0.08)] flex items-center justify-center mb-5 p-2 transition-transform hover:scale-105 duration-200">
              <Image
                src="/logo.png"
                alt="DevMind Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#0c1017] tracking-tight mb-2">
              {isInitialLoading
                ? 'Loading workspace...'
                : hasActiveContext
                  ? "What's on the agenda today?"
                  : contextType === 'repository' ? 'Select a repository to begin' : 'Select a document to begin'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-8 max-w-md break-words [overflow-wrap:anywhere]">
              {isInitialLoading
                ? 'Retrieving documents and indexed knowledge base...'
                : hasActiveContext
                  ? contextType === 'repository'
                    ? `Ask questions about ${activeContextName}. Answers use code chunks indexed from this repository.`
                    : `Ask questions about ${activeContextName} to extract insights, summarize sections, and query semantic vector embeddings.`
                  : contextType === 'repository'
                    ? 'Choose a repository from the right sidebar to start asking questions.'
                    : 'Choose a document from the right sidebar to start asking questions.'}
            </p>

            {isInitialLoading ? (
              <div className="w-full space-y-2.5 text-left">
                <div className="h-3 w-32 bg-slate-200 rounded animate-pulse mb-2 px-1" />
                {[1, 2, 3].map((idx) => (
                  <div
                    key={`starter-skeleton-${idx}`}
                    className="w-full bg-white/60 border border-slate-100 p-3.5 rounded-2xl animate-pulse shadow-xs"
                  >
                    <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              starterQuestions.length > 0 && (
                <div className="w-full space-y-2 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
                    SUGGESTED QUESTIONS
                  </p>
                  {starterQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedClick(q)}
                      className="w-full text-xs text-slate-700 bg-white/80 hover:bg-white border border-white/90 p-3.5 rounded-2xl transition-all duration-150 text-left flex items-center justify-between group shadow-[0_4px_14px_rgba(120,135,170,0.06)] hover:shadow-[0_8px_20px_rgba(120,135,170,0.10)] cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800">{q}</span>
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUp className="w-3.5 h-3.5 text-slate-700" />
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* 2. Loading State (When querying) */}
        {showLoadingView && (
          <div className="space-y-4 max-w-3xl mx-auto">
            {pendingQuestion && (
              <div className="flex justify-end items-start gap-2.5 pl-12">
                <div className="bg-slate-800 text-white border border-slate-700/60 rounded-2xl rounded-tr-xs px-4 py-3 shadow-[0_6px_20px_rgba(15,23,42,0.12)] max-w-xl text-xs leading-relaxed">
                  <div className="flex items-center justify-between gap-4 mb-1 border-b border-white/10 pb-1">
                    <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                      Question
                    </span>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <p className="font-medium">{pendingQuestion}</p>
                </div>
              </div>
            )}

            {/* Stepped progress card */}
            <div className="flex items-start gap-3 max-w-2xl pr-12">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0 p-1">
                <Image
                  src="/logo.png"
                  alt="DevMind"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <div className="bg-white/85 backdrop-blur-md border border-white/90 rounded-2xl rounded-tl-xs p-4 shadow-[0_8px_30px_rgba(115,130,165,0.08)] w-full text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    <span className="font-semibold text-slate-900">
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
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{
                      width: `${((thinkingStepIndex + 1) / thinkingSteps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Answer View */}
        {showAnswerView && (
          <div className="space-y-4 max-w-3xl mx-auto">
            {/* User Question */}
            <div className="flex justify-end items-start gap-2.5 pl-12">
              <div className="bg-slate-800 text-white border border-slate-700/60 rounded-2xl rounded-tr-xs px-4 py-3 shadow-[0_6px_20px_rgba(15,23,42,0.12)] max-w-xl text-xs leading-relaxed">
                <div className="flex items-center justify-between gap-4 mb-1 border-b border-white/10 pb-1">
                  <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                    Question
                  </span>
                  {currentQA.createdAt && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(currentQA.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                <p className="font-medium">{currentQA.question}</p>
              </div>
            </div>

            {/* AI Response */}
            <div className="flex items-start gap-3 max-w-3xl pr-4">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0 p-1">
                <Image
                  src="/logo.png"
                  alt="DevMind"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <div className="bg-white/85 backdrop-blur-md border border-white/90 rounded-2xl rounded-tl-xs p-5 shadow-[0_8px_30px_rgba(115,130,165,0.08)] max-w-2xl text-xs leading-relaxed text-slate-800 flex-1">
                <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                      Ans
                    </span>
                    {currentQA.insufficientContext && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>Context Limited</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleCopy(qaKey, currentQA.answer)}
                    className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
                    title="Copy answer"
                  >
                    {copiedId === qaKey ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-medium">
                          Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Answer content */}
                {renderFormattedContent(currentQA.answer)}

                {/* Performance Timings */}
                {currentQA.timings && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-500">
                    <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200/80 text-slate-900 font-semibold flex items-center gap-1 shadow-2xs">
                      <Zap className="w-2.5 h-2.5 text-amber-500" />
                      {currentQA.timings.totalSeconds}s
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/70 border border-slate-200/60">
                      embed: {currentQA.timings.embeddingSeconds}s
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/70 border border-slate-200/60">
                      vector: {currentQA.timings.vectorSearchSeconds}s
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/70 border border-slate-200/60">
                      gemini: {currentQA.timings.geminiSeconds}s
                    </span>
                  </div>
                )}

                {/* Source Citations */}
                {hasSources && (
                  <div className="mt-3 pt-2">
                    <button
                      onClick={() =>
                        setExpandedSourcesId(isSourcesExpanded ? null : qaKey)
                      }
                      className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3 h-3" />
                      <span>
                        {currentQA.rawChunks?.length || 0} retrieved sources
                      </span>
                      {isSourcesExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {isSourcesExpanded && (
                      <div className="mt-2.5 space-y-2 border-t border-slate-100 pt-2.5">
                        {currentQA.rawChunks?.map((chunk, cIdx) => (
                          <div
                            key={chunk.id || chunk._id || cIdx}
                            className="bg-white/80 border border-slate-100 rounded-xl p-2.5 text-[11px]"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                              <span className="font-semibold text-slate-700 truncate">
                                {typeof chunk.metadata?.filePath === 'string'
                                  ? `${chunk.metadata.filePath}${typeof chunk.metadata.startLine === 'number' ? `:${chunk.metadata.startLine}` : ''}`
                                  : `Source #${cIdx + 1}`}
                              </span>
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1 py-0.2 rounded font-medium">
                                Vector Score:{' '}
                                {typeof chunk.score === 'number'
                                    ? chunk.score.toFixed(3)
                                    : 'N/A'}
                              </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed font-sans">
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
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Footer Area */}
      {showAnswerView ? (
        <div className="p-4 border-t border-slate-100/70 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center">
          <button
            onClick={onNewQuestion}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Question</span>
          </button>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            Responses are grounded on retrieved {contextType === 'repository' ? 'repository code' : 'document'} chunks.
          </p>
        </div>
      ) : (
        <div className="p-4 border-t border-slate-100/70 bg-white/40 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
            <div className="flex items-center bg-white/90 backdrop-blur-xl border border-white/90 rounded-2xl shadow-[0_10px_30px_rgba(115,130,165,0.08)] focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-400/20 transition-all px-3 py-1">
              <div className="pl-1 pr-2 text-slate-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                disabled={isLoading || isInitialLoading || !hasActiveContext}
                placeholder={
                  isInitialLoading
                    ? 'Loading workspace documents...'
                    : hasActiveContext
                      ? contextType === 'repository' ? 'Ask a question about this repository...' : 'ask question about this document...'
                      : contextType === 'repository' ? 'Select a repository to ask questions...' : 'Select a document to ask questions...'
                }
                className="flex-1 min-w-0 bg-transparent py-3 pl-1 pr-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed font-medium"
              />

              <div className="flex items-center gap-2 shrink-0 py-1">
                {/* Submit button - Eye-soothing blue pill */}
                <button
                  type="submit"
                  disabled={
                    !inputQuestion.trim() || isLoading || !hasActiveContext
                  }
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(37,99,235,0.25)] shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  )}
                </button>
              </div>
            </div>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            Responses are grounded on retrieved {contextType === 'repository' ? 'repository code' : 'document'} chunks.
          </p>
        </div>
      )}
    </div>
  );
};
