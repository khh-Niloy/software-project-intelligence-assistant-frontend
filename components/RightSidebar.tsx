'use client';

import React, { useRef, useState } from 'react';
import { DocumentItem, QAItem, UploadResponse } from '../lib/types';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  FileCode,
  FileSpreadsheet,
  MessageSquare,
  Zap,
  ArrowUpRight,
  Folder,
} from 'lucide-react';

export type RightSidebarTab = 'documents' | 'chats';

interface RightSidebarProps {
  activeTab: RightSidebarTab;
  onChangeTab: (tab: RightSidebarTab) => void;
  // Documents tab props
  documents: DocumentItem[];
  selectedDocumentId: string | null;
  onSelectDocument: (docId: string) => void;
  onUploadFile: (file: File) => Promise<UploadResponse | void>;
  isUploading: boolean;
  isLoadingDocs?: boolean;
  // Previous Chats tab props
  history: QAItem[];
  selectedQAId: string | null;
  onSelectQA: (qa: QAItem) => void;
  isLoadingHistory?: boolean;
}

const formatDateWithTime = (dateInput?: string | number) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })}, ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const RightSidebar: React.FC<RightSidebarProps> = ({
  activeTab,
  onChangeTab,
  documents,
  selectedDocumentId,
  onSelectDocument,
  onUploadFile,
  isUploading,
  isLoadingDocs = false,
  history,
  selectedQAId,
  onSelectQA,
  isLoadingHistory = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onUploadFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />;
    if (ext === 'docx') return <FileSpreadsheet className="w-4 h-4 text-blue-600" />;
    return <FileCode className="w-4 h-4 text-emerald-600" />;
  };

  return (
    <aside className="flex flex-col h-full w-full min-w-0 max-w-full bg-white/80 backdrop-blur-2xl rounded-[28px] md:rounded-[32px] border border-white/90 shadow-[0_20px_50px_rgba(115,130,165,0.09)] font-sans overflow-hidden bg-[radial-gradient(ellipse_at_top_right,rgba(255,238,226,0.45),transparent_70%)]">
      {/* Tab Switcher Header */}
      <div className="p-2.5 border-b border-slate-100/70 bg-white/40 shrink-0 flex items-center justify-between gap-2">
        <div className="grid grid-cols-2 p-1 bg-slate-100/70 backdrop-blur-sm rounded-xl text-xs font-medium gap-1 flex-1">
          {/* Documents Tab Button */}
          <button
            onClick={() => onChangeTab('documents')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-white text-slate-900 font-semibold shadow-[0_2px_8px_rgba(115,130,165,0.12)]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Documents</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border shrink-0 ${
                activeTab === 'documents'
                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-white/70 border-slate-200/60 text-slate-500'
              }`}
            >
              {documents.length}
            </span>
          </button>

          {/* Previous Chats Tab Button */}
          <button
            onClick={() => onChangeTab('chats')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'chats'
                ? 'bg-white text-slate-900 font-semibold shadow-[0_2px_8px_rgba(115,130,165,0.12)]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Previous Chats</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border shrink-0 ${
                activeTab === 'chats'
                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-white/70 border-slate-200/60 text-slate-500'
              }`}
            >
              {history.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.csv,.md,.json"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          {/* Upload Dropzone */}
          <div className="p-3 shrink-0">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                if (!isUploading) {
                  fileInputRef.current?.click();
                }
              }}
              className={`border border-dashed rounded-2xl p-3.5 text-center cursor-pointer transition-all duration-150 ${
                dragActive
                  ? 'border-slate-800 bg-white ring-2 ring-slate-800/10'
                  : 'border-slate-200/90 hover:border-slate-400 bg-white/70 hover:bg-white shadow-[0_2px_12px_rgba(120,135,170,0.04)]'
              } ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 mx-auto text-blue-600 animate-spin mb-1" />
              ) : (
                <UploadCloud className="w-5 h-5 mx-auto text-slate-400 mb-1" />
              )}
              <p className="text-xs font-semibold text-slate-800">
                {isUploading ? 'Uploading & Queuing...' : 'Drop PDF, DOCX or TXT here'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Auto-indexed via Supabase & LangChain
              </p>
            </div>
          </div>

          {/* Documents List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 space-y-2 min-w-0 w-full">
            <div className="pt-1 pb-0.5">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 px-1">
                Documents (Click to chat)
              </p>
            </div>

            {isLoadingDocs ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((idx) => (
                  <div
                    key={`doc-skeleton-${idx}`}
                    className="p-3 rounded-2xl border border-slate-100 bg-white/60 animate-pulse shadow-xs space-y-2 w-full min-w-0 overflow-hidden"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 w-full">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                        <div className="flex items-center gap-2">
                          <div className="h-4 bg-slate-100 rounded w-16" />
                          <div className="h-3.5 bg-slate-100 rounded w-12" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No documents uploaded yet.
              </div>
            ) : (
              documents.map((doc) => {
                const isSelected = selectedDocumentId === doc._id;
                return (
                  <div
                    key={doc._id}
                    onClick={() => onSelectDocument(doc._id)}
                    className={`p-3 rounded-2xl border transition-all duration-150 cursor-pointer group relative w-full min-w-0 overflow-hidden ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-200/90 shadow-[0_4px_16px_rgba(59,130,246,0.08)] ring-1 ring-blue-300/40'
                        : 'bg-white/75 border-slate-100/90 hover:border-slate-200 hover:bg-white shadow-[0_2px_10px_rgba(120,135,170,0.04)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0 w-full">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1 overflow-hidden">
                        <div
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-blue-100/70 border-blue-200 text-blue-700'
                              : 'bg-slate-100/80 border-slate-200/70 text-slate-600'
                          }`}
                        >
                          {getFileIcon(doc.filename)}
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p
                            className={`text-xs font-medium leading-snug break-all [word-break:break-word] [overflow-wrap:anywhere] ${
                              isSelected
                                ? 'text-blue-950 font-semibold'
                                : 'text-slate-800 group-hover:text-black'
                            }`}
                            title={doc.filename}
                          >
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {/* Status Badge */}
                            {doc.status === 'completed' && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded font-medium">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{doc.totalChunks || 0} chunks</span>
                              </span>
                            )}
                            {doc.status === 'processing' && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded font-medium animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                                <span>Embedding...</span>
                              </span>
                            )}
                            {doc.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                                <Clock className="w-3 h-3" />
                                <span>Queued</span>
                              </span>
                            )}
                            {doc.status === 'failed' && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-medium">
                                <AlertCircle className="w-3 h-3" />
                                <span>Failed</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Supabase Link */}
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open file in Supabase Storage"
                          className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors shrink-0 cursor-pointer ml-1 mt-0.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PREVIOUS CHATS */}
      {activeTab === 'chats' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header indicator */}
          <div className="px-4 py-2.5 border-b border-slate-100/70 flex items-center justify-between shrink-0 bg-white/40">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-slate-800">
                All question and ans
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {history.length} {history.length === 1 ? 'interaction' : 'interactions'}
            </span>
          </div>

          {/* List of Previous Chats */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-w-0">
            {isLoadingHistory ? (
              <div className="space-y-2 p-1">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={`history-skeleton-${idx}`}
                    className="w-full p-2.5 rounded-xl border border-slate-100 bg-white/60 animate-pulse space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-3.5 w-20 bg-slate-200 rounded" />
                      <div className="h-2.5 w-14 bg-slate-100 rounded" />
                    </div>
                    <div className="h-3 w-4/5 bg-slate-200 rounded" />
                    <div className="space-y-1 pt-0.5">
                      <div className="h-2.5 w-full bg-slate-100 rounded" />
                      <div className="h-2.5 w-3/4 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-center p-4 text-slate-400">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center mb-2.5 text-slate-400 shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  No previous chats yet
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[190px]">
                  Ask questions about any uploaded document to see interaction history here.
                </p>
              </div>
            ) : (
              history.map((qa, idx) => {
                const itemId = qa._id || qa.id || `qa-${idx}`;
                const isSelected =
                  selectedQAId === itemId ||
                  selectedQAId === qa._id ||
                  selectedQAId === qa.id;
                const dateStr = qa.createdAt || qa.timestamp;

                return (
                  <div
                    key={itemId}
                    onClick={() => onSelectQA(qa)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all duration-150 group relative cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-200/90 text-blue-950 shadow-[0_4px_16px_rgba(59,130,246,0.08)] ring-1 ring-blue-300/30'
                        : 'bg-white/75 hover:bg-white border-slate-100/90 hover:border-slate-200 text-slate-800 shadow-[0_2px_10px_rgba(120,135,170,0.04)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border max-w-[130px] truncate ${
                          isSelected
                            ? 'bg-blue-100/70 border-blue-200 text-blue-800'
                            : 'bg-slate-100/80 border-slate-200/70 text-slate-600'
                        }`}
                      >
                        {qa.documentName || 'Document'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {dateStr && (
                          <span
                            className={`text-[10px] flex items-center gap-1 font-mono ${
                              isSelected ? 'text-blue-700/80' : 'text-slate-400'
                            }`}
                            suppressHydrationWarning
                          >
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span>{formatDateWithTime(dateStr)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-900 line-clamp-1 leading-snug">
                      {qa.question}
                    </p>

                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {qa.answer.replace(/<[^>]*>?/gm, ' ')}
                    </p>

                    {qa.timings && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Zap className="w-2.5 h-2.5 text-amber-500" />
                        <span>{qa.timings.totalSeconds}s</span>
                      </div>
                    )}

                    <ArrowUpRight className="w-3 h-3 absolute top-2.5 right-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
