'use client';

import React from 'react';
import Image from 'next/image';
import { FileText, GitBranch, ListChecks, User } from 'lucide-react';
import { GithubUser } from '../lib/types';

export type NavItemKey = 'doc-query' | 'github-query' | 'traceability';

interface LeftSidebarProps {
  activeNav: NavItemKey;
  onSelectNav: (key: NavItemKey) => void;
  user?: GithubUser | null;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeNav,
  onSelectNav,
  user,
}) => {
  const displayName = user?.username || 'Developer';

  return (
    <aside className="w-full h-full bg-white/80 backdrop-blur-2xl rounded-[28px] md:rounded-[32px] border border-white/90 shadow-[0_20px_50px_rgba(115,130,165,0.09)] flex flex-col justify-between font-sans select-none overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(224,236,255,0.45),transparent_70%)]">
      {/* Brand Header */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        <div className="h-14 px-4 border-b border-slate-100/70 flex items-center justify-between gap-2 bg-white/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1 shrink-0">
              <Image
                src="/logo.png"
                alt="DevMind Logo"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                  DevMind
                </h1>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200/80 text-slate-600 font-semibold">
                  RAG
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="p-3 space-y-1.5 flex-1">
          <div className="px-2 pb-1 pt-1">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Workspaces
            </p>
          </div>

          {/* 1. Project Documentation Query */}
          <button
            type="button"
            onClick={() => onSelectNav('doc-query')}
            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left group cursor-pointer ${
              activeNav === 'doc-query'
                ? 'bg-white/95 border border-white text-slate-900 shadow-[0_4px_16px_rgba(120,135,170,0.10)] font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeNav === 'doc-query'
                    ? 'bg-blue-50 text-blue-600 border border-blue-200/80'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Project Documentation Query</span>
            </div>
            {activeNav === 'doc-query' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
            )}
          </button>

          {/* 2. Github related query (Developers) */}
          <button
            type="button"
            onClick={() => onSelectNav('github-query')}
            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left group cursor-pointer ${
              activeNav === 'github-query'
                ? 'bg-white/95 border border-white text-slate-900 shadow-[0_4px_16px_rgba(120,135,170,0.10)] font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeNav === 'github-query'
                    ? 'bg-purple-50 text-purple-600 border border-purple-200/80'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Github related query (Developers)</span>
            </div>
            {activeNav === 'github-query' && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
            )}
          </button>

          {/* 3. Project Requirement Traceability */}
          <button
            type="button"
            onClick={() => onSelectNav('traceability')}
            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left group cursor-pointer ${
              activeNav === 'traceability'
                ? 'bg-white/95 border border-white text-slate-900 shadow-[0_4px_16px_rgba(120,135,170,0.10)] font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeNav === 'traceability'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">Project Requirement Traceability</span>
            </div>
            {activeNav === 'traceability' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Profile / Connected Account */}
      <div className="p-3 border-t border-slate-100/70 bg-white/40 shrink-0">
        <div className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/60 transition-colors cursor-pointer">
          {user?.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full border border-slate-200/80 shrink-0 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-slate-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user ? 'Linked GitHub Account' : 'DevMind Workspace'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
