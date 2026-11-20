'use client';

import React, { useState } from 'react';
import { GithubRepo, GithubUser, QAItem } from '../lib/types';
import { GithubRepoTree } from './GithubRepoTree';
import { GithubQueryPlaceholder } from './GithubQueryPlaceholder';
import { ChatSection } from './ChatSection';
import {
  FolderGit2,
  FolderTree,
  MessageSquare,
  ExternalLink,
  LogOut,
  Database,
  Loader2,
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
}

export const GithubWorkspace: React.FC<GithubWorkspaceProps> = ({
  githubUser,
  isGithubLoading,
  onConnectGithub,
  onDisconnectGithub,
  selectedRepo,
  reposCount,
  currentQA,
  isNewChat,
  isLoadingQA,
  activeTab,
  onChangeTab,
  onAskQuestion,
  onNewQuestion,
  onIngestRepository,
}) => {
  const [isIngesting, setIsIngesting] = useState(false);

  const handleIngestSelectedRepository = async () => {
    if (!selectedRepo || isIngesting) return;
    setIsIngesting(true);
    try {
      await onIngestRepository(selectedRepo);
    } finally {
      setIsIngesting(false);
    }
  };

  if (!githubUser) {
    return (
      <GithubQueryPlaceholder
        githubUser={null}
        isGithubLoading={isGithubLoading}
        onConnectGithub={onConnectGithub}
        onDisconnectGithub={onDisconnectGithub}
        selectedRepo={null}
        reposCount={reposCount}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden font-sans">
      <div className="min-h-14 px-4 md:px-5 py-2 border-b border-[#e5e7eb] flex items-center justify-between gap-3 bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {githubUser.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={githubUser.avatarUrl} alt="" className="w-7 h-7 rounded-full border border-neutral-200" />
          ) : null}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-neutral-800">GitHub account</p>
            <p className="text-[10px] text-neutral-500 truncate">@{githubUser.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={onDisconnectGithub} disabled={isGithubLoading} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-200/80 bg-rose-50/70 text-rose-700 hover:bg-rose-100/80 hover:border-rose-200 disabled:opacity-50 transition-colors cursor-pointer text-[11px] font-medium">
            <LogOut className="w-3 h-3" /><span>Disconnect</span>
          </button>
        </div>
      </div>

      <div className="min-h-14 px-4 md:px-5 py-2 border-b border-[#e5e7eb] bg-white flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
            <FolderGit2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold tracking-wider text-neutral-500">GITHUB REPOSITORY</p>
            {selectedRepo ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold text-[#0d0d0d] truncate">{selectedRepo.full_name}</span>
                <a href={selectedRepo.html_url} target="_blank" rel="noopener noreferrer" title="Open on GitHub" className="p-0.5 text-neutral-400 hover:text-neutral-900 shrink-0"><ExternalLink className="w-3 h-3" /></a>
              </div>
            ) : <p className="text-xs font-medium text-neutral-700">Choose a repository</p>}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#f3f4f6] p-1 rounded-xl border border-[#e5e7eb] shrink-0">
          <button type="button" onClick={() => onChangeTab('query')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'query' ? 'bg-white text-[#0d0d0d] shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'}`}>
            <MessageSquare className="w-3.5 h-3.5" /><span>Query</span>
          </button>
          <button type="button" onClick={() => onChangeTab('tree')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'tree' ? 'bg-white text-[#0d0d0d] shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'}`}>
            <FolderTree className="w-3.5 h-3.5 text-blue-600" /><span>Tree</span>
          </button>
        </div>

        <div className="ml-auto text-[10px] text-emerald-700 whitespace-nowrap">
          {selectedRepo ? 'Repository selected' : `${reposCount} repositories available`}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === 'tree' ? (
          selectedRepo ? (
            <GithubRepoTree owner={selectedRepo.owner} repo={selectedRepo.name} branch={selectedRepo.default_branch || 'main'} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8 text-xs text-neutral-500">Select a repository from the sidebar to browse its files.</div>
          )
        ) : selectedRepo && !selectedRepo.isIngested && !currentQA ? (
          <div className="flex-1 flex items-center justify-center px-6 py-10 bg-white">
            <div className="max-w-md w-full text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900">Index this repository to start chatting</h2>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                {selectedRepo.full_name} has not been ingested yet. Index its supported source files to make repository questions available.
              </p>
              <button
                type="button"
                onClick={() => void handleIngestSelectedRepository()}
                disabled={isIngesting}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d0d0d] hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:cursor-wait"
              >
                {isIngesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {isIngesting ? 'Ingesting repository…' : 'Ingest repository'}
              </button>
            </div>
          </div>
        ) : (
          <ChatSection
            selectedDocument={null}
            history={[]}
            currentQA={currentQA}
            isNewChat={isNewChat}
            onAskQuestion={onAskQuestion}
            onNewQuestion={onNewQuestion}
            isLoading={isLoadingQA}
            contextType="repository"
            contextName={selectedRepo?.full_name}
            contextReady={Boolean(selectedRepo)}
          />
        )}
      </div>
    </div>
  );
};
