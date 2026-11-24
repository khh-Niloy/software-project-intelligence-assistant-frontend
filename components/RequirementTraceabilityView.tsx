'use client';

import React, { useState, useEffect } from 'react';
import {
  DocumentItem,
  GithubRepo,
  TraceRequirement,
  TraceProject,
  RequirementDoc,
  ImplementationStatus,
} from '../lib/types';
import {
  extractRequirements,
  approveTraceRequirements,
  fetchTraceProjects,
  fetchTraceRequirementsByRepo,
  ingestGithubRepository,
} from '../lib/api';
import {
  ListChecks,
  Plus,
  FolderGit2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Edit3,
  Trash2,
  Check,
  X,
  Search,
  Loader2,
  Sparkles,
  ChevronRight,
  Info,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  Calendar,
  Lock,
  Globe,
  GitBranch,
  Star,
  ExternalLink,
  Code2,
  FileCode,
  Layers,
  Database,
} from 'lucide-react';

interface RequirementTraceabilityViewProps {
  documents: DocumentItem[];
  repos: GithubRepo[];
  onUploadDocument?: (file: File) => Promise<unknown>;
  onRefreshRepos?: () => void;
  onIngestRepository?: (repo: GithubRepo) => Promise<void>;
  onToggleLeftSidebar?: () => void;
  leftSidebarOpen?: boolean;
}

type ModalStep = 'select-doc' | 'review-flow' | 'approved-success';
type ReviewModalTab = 'requirements' | 'repos';
type MainViewTab = 'projects' | 'repos';

const getLanguageColor = (language: string | null): string => {
  if (!language) return '#94a3b8';
  const l = language.toLowerCase();
  switch (l) {
    case 'typescript':
      return '#3178c6';
    case 'javascript':
      return '#f1e05a';
    case 'python':
      return '#3572a5';
    case 'go':
      return '#00add8';
    case 'rust':
      return '#dea584';
    case 'java':
      return '#b07219';
    case 'html':
      return '#e34c26';
    case 'css':
      return '#563d7c';
    default:
      return '#64748b';
  }
};

export const RequirementTraceabilityView: React.FC<
  RequirementTraceabilityViewProps
> = ({
  documents,
  repos,
  onUploadDocument,
  onRefreshRepos,
  onIngestRepository,
  onToggleLeftSidebar,
  leftSidebarOpen = true,
}) => {
  // Main view tabs: 'projects' vs 'repos'
  const [mainTab, setMainTab] = useState<MainViewTab>('projects');

  // Modal flow state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('select-doc');

  // Review step tabs inside the modal: Tab 1 = requirements, Tab 2 = repos
  const [reviewTab, setReviewTab] = useState<ReviewModalTab>('requirements');

  // Step 1: Document selection / upload state
  const [docSourceType, setDocSourceType] = useState<'existing' | 'upload'>(
    'existing',
  );
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Step 2: Requirements & Repo review state
  const [activeDocumentName, setActiveDocumentName] = useState<string>('');
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [selectedRepoName, setSelectedRepoName] = useState<string>('');
  const [ingestingRepoName, setIngestingRepoName] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<TraceRequirement[]>([]);
  const [reqSearchQuery, setReqSearchQuery] = useState('');
  const [repoSearchQuery, setRepoSearchQuery] = useState('');

  // Handle ingestion of a repository
  const handleIngest = async (repo: GithubRepo) => {
    setIngestingRepoName(repo.name);
    try {
      if (onIngestRepository) {
        await onIngestRepository(repo);
      } else {
        await ingestGithubRepository(repo.name);
      }
      onRefreshRepos?.();
    } catch (err: unknown) {
      console.error('Failed to ingest repo:', err);
      alert(err instanceof Error ? err.message : 'Ingestion failed');
    } finally {
      setIngestingRepoName(null);
    }
  };

  // Inline editing for requirement
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
  }>({
    title: '',
    description: '',
  });

  // Adding new requirement manually
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');

  // Step 3: Approval result state
  const [isApproving, setIsApproving] = useState(false);
  const [approvedProject, setApprovedProject] = useState<TraceProject | null>(
    null,
  );
  const [approvedSummary, setApprovedSummary] = useState<{
    total: number;
    completed: number;
    partially_implemented: number;
    not_implemented: number;
  } | null>(null);
  const [approvedReqDocs, setApprovedReqDocs] = useState<RequirementDoc[]>([]);

  // Main Page: Saved Projects & On-Click Requirements details
  const [savedProjects, setSavedProjects] = useState<TraceProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedProjectRepo, setSelectedProjectRepo] = useState<string | null>(
    null,
  );
  const [projectRequirements, setProjectRequirements] = useState<
    RequirementDoc[]
  >([]);
  const [isLoadingProjectReqs, setIsLoadingProjectReqs] = useState(false);

  // Auto-select first ingested repo if available and not yet added
  useEffect(() => {
    if (!selectedRepoName && repos.length > 0) {
      const addedRepoNames = new Set(savedProjects.map((p) => p.repoName));
      const firstIngested = repos.find(
        (r) => r.isIngested && !addedRepoNames.has(r.name),
      );
      if (firstIngested) {
        setSelectedRepoName(firstIngested.name);
      }
    }
  }, [repos, savedProjects, selectedRepoName]);

  // Load saved projects list
  const loadSavedProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const list = await fetchTraceProjects();
      setSavedProjects(list);
    } catch (e) {
      console.warn('Failed to fetch trace projects:', e);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    void loadSavedProjects();
  }, []);

  // When clicking a project on the trace page, fetch its requirements by repoName
  const handleSelectProject = async (repoName: string) => {
    if (selectedProjectRepo === repoName) {
      setSelectedProjectRepo(null);
      setProjectRequirements([]);
      return;
    }

    setSelectedProjectRepo(repoName);
    setIsLoadingProjectReqs(true);
    try {
      const reqs = await fetchTraceRequirementsByRepo(repoName);
      setProjectRequirements(reqs);
    } catch (err) {
      console.error(`Failed to load requirements for repo ${repoName}:`, err);
    } finally {
      setIsLoadingProjectReqs(false);
    }
  };

  // Open modal clean
  const handleOpenNewModal = () => {
    setModalStep('select-doc');
    setDocSourceType('existing');
    setSelectedDocId(documents.length > 0 ? documents[0]._id : null);
    setUploadFile(null);
    setExtractError(null);
    setRequirements([]);
    setEditingId(null);
    setIsAddingNew(false);
    setReviewTab('requirements');
    setApprovedProject(null);
    setApprovedSummary(null);
    setApprovedReqDocs([]);

    const addedRepoNames = new Set(savedProjects.map((p) => p.repoName));
    const firstIngested = repos.find(
      (r) => r.isIngested && !addedRepoNames.has(r.name),
    );
    setSelectedRepoName(firstIngested ? firstIngested.name : '');
    setIsModalOpen(true);
  };

  // Step 1: Extract requirements
  const handleExtractRequirements = async () => {
    setExtractError(null);
    setIsExtracting(true);

    try {
      let result;
      if (docSourceType === 'existing') {
        if (!selectedDocId) {
          throw new Error('Please select an existing document.');
        }
        const doc = documents.find((d) => d._id === selectedDocId);
        result = await extractRequirements({ documentId: selectedDocId });
        const docName = doc?.filename || result.documentName;
        setActiveDocumentName(docName);
        setActiveDocumentId(selectedDocId);
      } else {
        if (!uploadFile) {
          throw new Error('Please upload a valid requirement document.');
        }
        result = await extractRequirements({ file: uploadFile });
        setActiveDocumentName(uploadFile.name);
        setActiveDocumentId(result.documentId || null);

        if (onUploadDocument) {
          void onUploadDocument(uploadFile);
        }
      }

      setRequirements(result.requirements);
      setReviewTab('requirements');
      setModalStep('review-flow');
    } catch (err: unknown) {
      setExtractError(
        err instanceof Error ? err.message : 'Requirement extraction failed.',
      );
    } finally {
      setIsExtracting(false);
    }
  };

  // Step 2: Edit, Accept, Add, Delete requirements
  const handleToggleAccept = (id: string) => {
    setRequirements((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === 'accepted' ? 'pending' : 'accepted' }
          : r,
      ),
    );
  };

  const handleStartEdit = (req: TraceRequirement) => {
    setEditingId(req.id);
    setEditForm({
      title: req.title,
      description: req.description,
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!editForm.title.trim()) return;
    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...editForm } : r)),
    );
    setEditingId(null);
  };

  const handleDeleteRequirement = (id: string) => {
    setRequirements((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddManualRequirement = () => {
    if (!newReqTitle.trim()) return;
    const nextIdx = requirements.length + 1;
    const newReq: TraceRequirement = {
      id: `REQ-${String(nextIdx).padStart(2, '0')}`,
      title: newReqTitle.trim(),
      description: newReqDesc.trim(),
      status: 'accepted',
    };
    setRequirements((prev) => [...prev, newReq]);
    setNewReqTitle('');
    setNewReqDesc('');
    setIsAddingNew(false);
  };

  // Step 2 Action: Final Approval -> creates Project & Requirement docs with chunk evidence
  const handleFinalApproval = async () => {
    if (!selectedRepoName) {
      setReviewTab('repos');
      alert('Please select an ingested target repository from the Repositories tab.');
      return;
    }

    const targetRepo = repos.find(
      (r) => r.name.toLowerCase() === selectedRepoName.toLowerCase(),
    );
    if (!targetRepo || !targetRepo.isIngested) {
      setReviewTab('repos');
      alert(
        `Repository "${selectedRepoName}" is not ingested yet. You must ingest the repository first before approving requirement traceability. Click "Ingest" on the repository card.`,
      );
      return;
    }

    // Check if repo has already been approved and added
    const alreadyExists = savedProjects.some(
      (p) => p.repoName.toLowerCase() === selectedRepoName.toLowerCase(),
    );
    if (alreadyExists) {
      setReviewTab('repos');
      alert(
        `A traceability project for repository "${selectedRepoName}" has already been approved and added. Please select another repository.`,
      );
      return;
    }

    if (requirements.length === 0) {
      alert('Cannot approve an empty list of requirements.');
      return;
    }

    setIsApproving(true);
    try {
      const response = await approveTraceRequirements({
        repoName: selectedRepoName,
        documentName: activeDocumentName || undefined,
        documentId: activeDocumentId || undefined,
        requirements,
      });

      setApprovedProject(response.project);
      setApprovedSummary(response.summary);
      setApprovedReqDocs(response.requirements || []);
      setModalStep('approved-success');
      void loadSavedProjects();
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : 'Failed to approve requirements.',
      );
    } finally {
      setIsApproving(false);
    }
  };

  // Filter requirements by search
  const filteredRequirements = requirements.filter((r) => {
    if (!reqSearchQuery.trim()) return true;
    const q = reqSearchQuery.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  });

  // Filter repos by search
  const filteredRepos = repos.filter((repo) => {
    if (!repoSearchQuery.trim()) return true;
    const q = repoSearchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(q) ||
      repo.full_name.toLowerCase().includes(q) ||
      (repo.description && repo.description.toLowerCase().includes(q)) ||
      (repo.language && repo.language.toLowerCase().includes(q))
    );
  });

  const acceptedCount = requirements.filter(
    (r) => r.status === 'accepted',
  ).length;

  const renderStatusBadge = (status: ImplementationStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'partially_implemented':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Partially Implemented</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>Not Implemented</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-white/80 backdrop-blur-2xl rounded-[28px] md:rounded-[32px] border border-white/90 shadow-[0_20px_50px_rgba(115,130,165,0.09)] font-sans overflow-hidden bg-[radial-gradient(ellipse_at_top_right,rgba(235,248,255,0.5),transparent_70%)] relative">
      {/* Top Header */}
      <div className="h-14 px-4 sm:px-6 border-b border-slate-100/70 flex items-center justify-between gap-3 bg-white/40 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {onToggleLeftSidebar && (
            <button
              type="button"
              onClick={onToggleLeftSidebar}
              className="p-1.5 rounded-xl border border-slate-200/80 bg-white/80 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer mr-1"
              title={leftSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {leftSidebarOpen ? (
                <PanelLeftClose className="w-3.5 h-3.5" />
              ) : (
                <PanelLeftOpen className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
            <ListChecks className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
              Project Requirement Traceability
            </h2>
            <p className="text-[10px] text-slate-400 truncate hidden sm:block">
              Verify code chunk evidence and implementation status across your repositories
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenNewModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_18px_rgba(37,99,235,0.32)] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Main Page Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Hero Card */}
        <div className="p-6 rounded-3xl bg-white/90 border border-slate-200/80 shadow-[0_6px_25px_rgba(115,130,165,0.06)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Code Chunk Traceability</span>
            </div>
            <h3 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
              Automated Requirement Verification & Evidence Mapping
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Click <strong>New</strong> to start. When you approve requirements, the system matches them against repository code chunks to calculate <strong>completed</strong>, <strong>partially implemented</strong>, or <strong>not implemented</strong> status with exact file and line references.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewModal}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_6px_20px_rgba(37,99,235,0.30)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.38)] transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Traceability Project</span>
          </button>
        </div>

        {/* Main Page Tab Switcher: Tab 1 = Projects, Tab 2 = Repositories */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMainTab('projects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mainTab === 'projects'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Projects</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono">
                {savedProjects.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMainTab('repos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mainTab === 'repos'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Repositories</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono">
                {repos.length}
              </span>
            </button>
          </div>

          {mainTab === 'projects' ? (
            <button
              type="button"
              onClick={() => void loadSavedProjects()}
              disabled={isLoadingProjects}
              title="Refresh projects"
              className="p-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-500 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingProjects ? 'animate-spin' : ''}`}
              />
            </button>
          ) : (
            onRefreshRepos && (
              <button
                type="button"
                onClick={onRefreshRepos}
                title="Refresh repositories"
                className="p-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-500 transition-colors shadow-2xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>

        {/* TAB 1: Projects List with repoName & On-Click Requirements */}
        {mainTab === 'projects' && (
          <div className="space-y-4">
            {isLoadingProjects ? (
              <div className="p-8 text-center text-slate-400 bg-white/60 rounded-2xl border border-slate-200/70">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-xs">Loading projects...</p>
              </div>
            ) : savedProjects.length === 0 ? (
              <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-slate-200/80 space-y-2">
                <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  No projects created yet
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Click the <strong>New</strong> button to approve requirements for a repository.
                </p>
              </div>
            ) : (
              savedProjects.map((proj) => {
                const isSelected = selectedProjectRepo === proj.repoName;
                return (
                  <div
                    key={proj._id}
                    className={`p-4 rounded-2xl border transition-all text-left space-y-3 ${
                      isSelected
                        ? 'bg-white border-blue-400 shadow-md ring-1 ring-blue-400/20'
                        : 'bg-white/90 hover:bg-white border-slate-200/80 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FolderGit2 className="w-4 h-4 text-slate-700 shrink-0" />
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                            {proj.repoName}
                          </h4>
                          {proj.createdAt && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(proj.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Summary Badges */}
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-700">
                            {proj.totalRequirements ?? 0} Requirements
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                            {proj.completedCount ?? 0} Completed
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                            {proj.partiallyCount ?? 0} Partial
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                            {proj.notImplementedCount ?? 0} Not Implemented
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectProject(proj.repoName)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{isSelected ? 'Hide Requirements' : 'View Requirements'}</span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isSelected ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Fetched requirements list on project click */}
                    {isSelected && (
                      <div className="pt-3 border-t border-slate-100 space-y-3 animate-fade-in">
                        {isLoadingProjectReqs ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-blue-600" />
                            <span>Loading requirements for {proj.repoName}...</span>
                          </div>
                        ) : projectRequirements.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No requirements found for this repository.
                          </div>
                        ) : (
                          projectRequirements.map((req) => (
                            <div
                              key={req._id}
                              className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2 text-xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-blue-600 text-[10px]">
                                      {req.requirementSlug}
                                    </span>
                                    <h5 className="font-bold text-slate-900">
                                      {req.title}
                                    </h5>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">
                                    {req.description}
                                  </p>
                                </div>
                                <div>{renderStatusBadge(req.implementationStatus)}</div>
                              </div>

                              {/* Evidence snippets */}
                              {req.evidence && req.evidence.length > 0 && (
                                <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <Code2 className="w-3 h-3 text-slate-400" />
                                    Code Evidence ({req.evidence.length})
                                  </span>
                                  <div className="space-y-1">
                                    {req.evidence.map((ev, i) => (
                                      <div
                                        key={i}
                                        className="p-2 rounded-lg bg-white border border-slate-200/80 text-[11px] space-y-0.5"
                                      >
                                        <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[10px]">
                                          <FileCode className="w-3 h-3 text-blue-500" />
                                          <span className="font-semibold">{ev.filePath}</span>
                                          {ev.startLine > 0 && (
                                            <span className="text-slate-400">
                                              :L{ev.startLine}-L{ev.endLine}
                                            </span>
                                          )}
                                        </div>
                                        {ev.explanation && (
                                          <p className="text-[10px] text-slate-600 italic pl-4">
                                            "{ev.explanation}"
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: Repositories List */}
        {mainTab === 'repos' && (
          <div className="space-y-3">
            {repos.length === 0 ? (
              <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-slate-200/80 space-y-2">
                <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  No repositories found
                </p>
                <p className="text-[11px] text-slate-400">
                  Connect your GitHub account to inspect and select your repositories.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {repos.map((repo) => (
                  <div
                    key={repo.full_name}
                    className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs space-y-2 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FolderGit2 className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {repo.name}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                          repo.private
                            ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {repo.private ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                        {repo.private ? 'Private' : 'Public'}
                      </span>
                    </div>

                    {repo.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {repo.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <div className="flex items-center gap-3">
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: getLanguageColor(repo.language) }}
                            />
                            <span>{repo.language}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-mono text-slate-400">
                          <GitBranch className="w-2.5 h-2.5" />
                          <span>{repo.default_branch || 'main'}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {repo.isIngested ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                            <Database className="w-2.5 h-2.5 text-emerald-600" /> Ingested
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleIngest(repo);
                            }}
                            disabled={ingestingRepoName !== null}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60 text-[10px] font-semibold shadow-2xs transition-all cursor-pointer disabled:cursor-wait"
                          >
                            {ingestingRepoName === repo.name ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Database className="w-3 h-3" />
                            )}
                            {ingestingRepoName === repo.name
                              ? 'Ingesting…'
                              : 'Ingest'}
                          </button>
                        )}
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-slate-700 p-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ================= ONE SINGLE MODAL FOR THE WHOLE FLOW ==================== */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] transition-all">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {modalStep === 'review-flow' && (
                  <button
                    type="button"
                    onClick={() => setModalStep('select-doc')}
                    className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition-colors mr-1 cursor-pointer"
                    title="Back to document selection"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {modalStep === 'select-doc'
                      ? 'New Requirement Project'
                      : modalStep === 'review-flow'
                        ? 'Review & Approve Requirements'
                        : 'Traceability Analysis Complete'}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate">
                    {modalStep === 'select-doc'
                      ? 'Select or upload a specification document'
                      : modalStep === 'review-flow'
                        ? `Target Repository: ${selectedRepoName || 'None selected'}`
                        : `Project: ${approvedProject?.repoName || selectedRepoName}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ================= STEP 1: SELECT OR UPLOAD DOCUMENT ================= */}
            {modalStep === 'select-doc' && (
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Notes as requested */}
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-2.5 text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-[11px] leading-relaxed">
                    <p className="font-semibold text-blue-950">
                      Select which document to use for final requirements.
                    </p>
                    <p className="text-blue-800">
                      <strong>Note:</strong> You can edit before final approval. Please upload a valid requirement document.
                    </p>
                  </div>
                </div>

                {/* Tab switcher: Existing vs Upload */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold gap-1">
                  <button
                    type="button"
                    onClick={() => setDocSourceType('existing')}
                    className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                      docSourceType === 'existing'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Select from Uploaded ({documents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocSourceType('upload')}
                    className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                      docSourceType === 'upload'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Upload New Document
                  </button>
                </div>

                {/* Option A: List of existing uploaded documents */}
                {docSourceType === 'existing' && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-700">
                      Choose uploaded document:
                    </p>
                    {documents.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
                        <p>No documents uploaded yet.</p>
                        <button
                          type="button"
                          onClick={() => setDocSourceType('upload')}
                          className="text-blue-600 font-semibold hover:underline"
                        >
                          Upload a requirement document
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                        {documents.map((doc) => {
                          const isSelected = selectedDocId === doc._id;
                          return (
                            <div
                              key={doc._id}
                              onClick={() => setSelectedDocId(doc._id)}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-50/80 border-blue-400 text-blue-900 font-semibold shadow-2xs'
                                  : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate min-w-0">
                                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                                <span className="truncate">{doc.filename}</span>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Option B: Upload new document */}
                {docSourceType === 'upload' && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-700">
                      Upload requirement specification file:
                    </p>
                    <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30">
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-800">
                        {uploadFile ? uploadFile.name : 'Click to select requirement document'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {uploadFile
                          ? `${(uploadFile.size / 1024).toFixed(1)} KB`
                          : 'Supports PDF, DOCX, TXT, MD, CSV'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,.md,.csv"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}

                {extractError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{extractError}</span>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 2: REVIEW FLOW WITH TWO TABS ================= */}
            {modalStep === 'review-flow' && (
              <div className="flex flex-col flex-1 min-h-0 text-xs">
                {/* Two Tabs in the Review Flow: Tab 1 = Requirements, Tab 2 = Repositories */}
                <div className="p-3 px-6 border-b border-slate-100 bg-slate-50/80 shrink-0">
                  <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl text-xs font-bold gap-1">
                    {/* Tab 1: Requirements */}
                    <button
                      type="button"
                      onClick={() => setReviewTab('requirements')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                        reviewTab === 'requirements'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <ListChecks className="w-4 h-4 text-emerald-600" />
                      <span>Requirements</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono">
                        {requirements.length}
                      </span>
                    </button>

                    {/* Tab 2: Repositories (Responsible for showing repos) */}
                    <button
                      type="button"
                      onClick={() => setReviewTab('repos')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                        reviewTab === 'repos'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <FolderGit2 className="w-4 h-4 text-blue-600" />
                      <span>Repositories</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono">
                        {repos.length}
                      </span>
                      {selectedRepoName && (
                        <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 text-[9px] font-bold truncate max-w-[90px]">
                          {selectedRepoName}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* TAB 1 CONTENT: REQUIREMENTS LIST */}
                {reviewTab === 'requirements' && (
                  <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
                    {/* Search & Add New Requirement Bar */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={reqSearchQuery}
                          onChange={(e) => setReqSearchQuery(e.target.value)}
                          placeholder="Search requirements..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none text-slate-800"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAddingNew(!isAddingNew)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-600" />
                        <span>Add Requirement</span>
                      </button>
                    </div>

                    {/* Inline form to add requirement manually */}
                    {isAddingNew && (
                      <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2 animate-fade-in">
                        <p className="font-bold text-blue-900 text-[11px]">
                          Add New Requirement Manually
                        </p>
                        <input
                          type="text"
                          value={newReqTitle}
                          onChange={(e) => setNewReqTitle(e.target.value)}
                          placeholder="Requirement title (e.g. OAuth 2.0 Integration)"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 font-medium"
                        />
                        <textarea
                          rows={2}
                          value={newReqDesc}
                          onChange={(e) => setNewReqDesc(e.target.value)}
                          placeholder="Detailed requirement description & behavior..."
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
                        />
                        <div className="flex justify-end items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingNew(false)}
                            className="px-3 py-1 text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddManualRequirement}
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-2xs cursor-pointer"
                          >
                            Add to List
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Requirements List items */}
                    <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
                      {filteredRequirements.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200/80">
                          No matching requirements found.
                        </div>
                      ) : (
                        filteredRequirements.map((req) => {
                          const isEditing = editingId === req.id;
                          const isAccepted = req.status === 'accepted';

                          if (isEditing) {
                            return (
                              <div
                                key={req.id}
                                className="p-3.5 rounded-2xl bg-white border-2 border-blue-400 shadow-sm space-y-2"
                              >
                                <span className="font-mono text-xs font-bold text-blue-600">
                                  Editing {req.id}
                                </span>
                                <input
                                  type="text"
                                  value={editForm.title}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, title: e.target.value })
                                  }
                                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl font-semibold text-slate-900"
                                />
                                <textarea
                                  rows={2}
                                  value={editForm.description}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      description: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-700"
                                />
                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1 text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(req.id)}
                                    className="px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={req.id}
                              className={`p-3.5 rounded-2xl border transition-all text-left space-y-1.5 ${
                                isAccepted
                                  ? 'bg-white border-emerald-200/80 shadow-2xs'
                                  : 'bg-slate-50/70 border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                                    {req.id}
                                  </span>
                                  <h4 className="font-bold text-slate-900 truncate">
                                    {req.title}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Accept toggle */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAccept(req.id)}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                      isAccepted
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>{isAccepted ? 'Accepted' : 'Accept'}</span>
                                  </button>

                                  {/* Edit */}
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(req)}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                    title="Edit requirement"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRequirement(req.id)}
                                    className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Delete requirement"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {req.description}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2 CONTENT: REPOSITORIES LIST (RESPONSIBLE FOR SHOWING REPO'S) */}
                {reviewTab === 'repos' && (
                  <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
                    {/* Header with Search and Instructions */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={repoSearchQuery}
                          onChange={(e) => setRepoSearchQuery(e.target.value)}
                          placeholder="Search repositories..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none text-slate-800"
                        />
                      </div>
                      {onRefreshRepos && (
                        <button
                          type="button"
                          onClick={onRefreshRepos}
                          title="Refresh repositories"
                          className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 text-[11px] text-blue-900 flex items-center justify-between gap-2">
                      <span>Click an ingested repository below to select it as the target:</span>
                      {selectedRepoName ? (
                        <span className="font-bold text-blue-950 shrink-0 font-mono">
                          Selected: {selectedRepoName}
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold shrink-0">
                          No ingested repo selected
                        </span>
                      )}
                    </div>

                    {selectedRepoName &&
                      savedProjects.some(
                        (p) =>
                          p.repoName.toLowerCase() ===
                          selectedRepoName.toLowerCase(),
                      ) && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Repository <strong>{selectedRepoName}</strong> has
                            already been approved. Please select another unmapped
                            repository below.
                          </span>
                        </div>
                      )}

                    {/* Repository Cards Grid */}
                    <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                      {filteredRepos.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                          <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-semibold text-slate-600">No repositories found</p>
                          <p className="text-[11px]">Make sure your GitHub account is connected.</p>
                        </div>
                      ) : (
                        filteredRepos.map((repo) => {
                          const isAlreadyAdded = savedProjects.some(
                            (p) =>
                              p.repoName.toLowerCase() ===
                              repo.name.toLowerCase(),
                          );
                          const isSelected = selectedRepoName === repo.name;
                          const isIngested = !!repo.isIngested;
                          const isIngesting = ingestingRepoName === repo.name;

                          return (
                            <div
                              key={repo.full_name}
                              onClick={() => {
                                if (isAlreadyAdded) return;
                                if (!isIngested) {
                                  alert(
                                    `Repository "${repo.name}" has not been ingested yet. Please click the "Ingest" button to index its code chunks first.`,
                                  );
                                  return;
                                }
                                setSelectedRepoName(repo.name);
                              }}
                              className={`p-3.5 rounded-2xl border transition-all text-left space-y-2 ${
                                isAlreadyAdded
                                  ? 'bg-slate-50/60 border-slate-200/60 opacity-60 cursor-not-allowed'
                                  : !isIngested
                                    ? 'bg-white/90 border-slate-200 hover:border-amber-300 cursor-pointer'
                                    : isSelected
                                      ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-2 ring-blue-500/20 cursor-pointer'
                                      : 'bg-white hover:bg-slate-50/80 border-slate-200/80 shadow-2xs cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                      isAlreadyAdded
                                        ? 'bg-slate-100 text-slate-400 border-slate-200'
                                        : isSelected
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : !isIngested
                                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    <FolderGit2 className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-xs text-slate-900 block truncate">
                                      {repo.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                                      {repo.full_name}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                                      repo.private
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {repo.private ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                                    {repo.private ? 'Private' : 'Public'}
                                  </span>

                                  {isAlreadyAdded ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 font-semibold text-[10px] border border-slate-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Already Added
                                    </span>
                                  ) : isIngested ? (
                                    isSelected ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] shadow-2xs">
                                        <Check className="w-3 h-3" /> Selected
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px]">
                                        Select
                                      </span>
                                    )
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void handleIngest(repo);
                                      }}
                                      disabled={ingestingRepoName !== null}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60 text-[10px] font-semibold shadow-2xs transition-all cursor-pointer disabled:cursor-wait"
                                    >
                                      {isIngesting ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          <span>Ingesting…</span>
                                        </>
                                      ) : (
                                        <>
                                          <Database className="w-3 h-3" />
                                          <span>Ingest</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {repo.description && (
                                <p className="text-[11px] text-slate-600 line-clamp-1 leading-relaxed">
                                  {repo.description}
                                </p>
                              )}

                              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                <div className="flex items-center gap-3">
                                  {repo.language && (
                                    <span className="flex items-center gap-1">
                                      <span
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ backgroundColor: getLanguageColor(repo.language) }}
                                      />
                                      <span>{repo.language}</span>
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 font-mono text-slate-400">
                                    <GitBranch className="w-2.5 h-2.5" />
                                    <span>{repo.default_branch || 'main'}</span>
                                  </span>
                                  {repo.stargazers_count > 0 && (
                                    <span className="flex items-center gap-1 text-amber-600 font-mono">
                                      <Star className="w-2.5 h-2.5 fill-current" />
                                      <span>{repo.stargazers_count}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {isIngested ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-semibold">
                                      <Database className="w-2.5 h-2.5 text-emerald-600" /> Ingested
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-semibold">
                                      <AlertCircle className="w-2.5 h-2.5 text-amber-600" /> Ingestion Required
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 3: SUCCESS CELEBRATION WITH ANALYSIS RESULTS ================= */}
            {modalStep === 'approved-success' && approvedProject && (
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs animate-fade-in">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Traceability Analysis Completed
                  </h3>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Project record created for <strong>{approvedProject.repoName}</strong>. Requirements verified against codebase code chunks.
                  </p>
                </div>

                {/* Summary Metrics Cards */}
                {approvedSummary && (
                  <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto text-center">
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                      <span className="block text-base font-bold text-emerald-700 font-mono">
                        {approvedSummary.completed}
                      </span>
                      <span className="text-[10px] text-emerald-800 font-semibold">Completed</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200">
                      <span className="block text-base font-bold text-amber-700 font-mono">
                        {approvedSummary.partially_implemented}
                      </span>
                      <span className="text-[10px] text-amber-800 font-semibold">Partial</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200">
                      <span className="block text-base font-bold text-rose-700 font-mono">
                        {approvedSummary.not_implemented}
                      </span>
                      <span className="text-[10px] text-rose-800 font-semibold">Not Implemented</span>
                    </div>
                  </div>
                )}

                {/* Analyzed requirements preview with evidence */}
                <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
                  {approvedReqDocs.map((req) => (
                    <div
                      key={req._id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-left text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono font-bold text-blue-600 text-[10px]">
                            {req.requirementSlug}
                          </span>
                          <span className="font-semibold text-slate-900 truncate">
                            {req.title}
                          </span>
                        </div>
                        <div>{renderStatusBadge(req.implementationStatus)}</div>
                      </div>

                      {req.evidence && req.evidence.length > 0 && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200/70 text-[10px] space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-700 font-mono">
                            <Code2 className="w-3 h-3 text-blue-500" />
                            <span className="font-semibold">{req.evidence[0].filePath}</span>
                            {req.evidence[0].startLine > 0 && (
                              <span className="text-slate-400">
                                :L{req.evidence[0].startLine}-L{req.evidence[0].endLine}
                              </span>
                            )}
                          </div>
                          {req.evidence[0].explanation && (
                            <p className="text-slate-500 italic">
                              "{req.evidence[0].explanation}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
              {modalStep === 'select-doc' && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExtractRequirements}
                    disabled={
                      isExtracting ||
                      (docSourceType === 'existing' && !selectedDocId) ||
                      (docSourceType === 'upload' && !uploadFile)
                    }
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:cursor-not-allowed"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Extracting Requirements...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Extract Requirements</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {modalStep === 'review-flow' && (
                <>
                  <div className="text-[11px] text-slate-500 font-mono truncate max-w-[200px] sm:max-w-xs">
                    <span>
                      {acceptedCount} of {requirements.length} accepted
                    </span>
                    {selectedRepoName ? (
                      <span className="text-blue-600 font-semibold ml-1.5 truncate">
                        • {selectedRepoName}
                      </span>
                    ) : (
                      <span className="text-rose-500 ml-1.5 font-semibold">
                        • No repo selected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {reviewTab === 'requirements' ? (
                      <button
                        type="button"
                        onClick={() => setReviewTab('repos')}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <FolderGit2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Select Repo →</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReviewTab('requirements')}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                        <span>← Back to Requirements</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleFinalApproval}
                      disabled={isApproving || requirements.length === 0}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:cursor-not-allowed"
                    >
                      {isApproving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Analyzing Codebase...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Final Approval</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {modalStep === 'approved-success' && (
                <div className="w-full flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      void loadSavedProjects();
                    }}
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
