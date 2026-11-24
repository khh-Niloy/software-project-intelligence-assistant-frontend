export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DocumentItem {
  _id: string;
  id?: string;
  filename: string;
  fileUrl: string;
  originalText?: string;
  status: DocumentStatus;
  totalChunks?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChunkItem {
  _id?: string;
  id?: string;
  documentId?: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface SearchTimings {
  embeddingSeconds: number;
  vectorSearchSeconds: number;
  geminiSeconds: number;
  totalSeconds: number;
}

export interface SearchResponse {
  res: {
    query: string;
    answer: string;
    insufficientContext: boolean;
  };
  rawChunks: ChunkItem[];
  selectedChunks: number;
  timings: SearchTimings;
  qna?: QAItem;
}

export interface QAItem {
  _id?: string;
  id?: string;
  documentId?: string | null;
  documentName?: string;
  repoName?: string;
  question: string;
  answer: string;
  insufficientContext: boolean;
  rawChunks?: ChunkItem[];
  timings?: SearchTimings;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
}

export interface DocumentStats {
  totalCharacters?: number;
  loadedPagesOrSections?: number;
  totalChunks?: number;
  embeddingDimension?: number;
}

export interface UploadResponse {
  message: string;
  document: DocumentItem;
  stats?: DocumentStats;
  totalChunks?: number;
}

export interface GithubUser {
  username: string;
  displayName: string;
  avatarUrl: string;
  email: string;
  scope: string;
  updatedAt?: string;
}

export interface GithubStatusResponse {
  connected: boolean;
  user: GithubUser | null;
}

export interface GithubRepo {
  name: string;
  full_name: string;
  private: boolean;
  owner: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  isIngested: boolean;
}

export interface TreeItem {
  path: string;
  type: 'file' | 'directory' | string;
  size?: number;
}

export interface RepositoryTreeResponse {
  owner: string;
  repo: string;
  branch: string;
  truncated: boolean;
  total_items: number;
  tree: TreeItem[];
}

export interface RepositoryFileContent {
  type: 'file';
  name: string;
  path: string;
  size: number;
  sha: string;
  download_url?: string;
  content: string;
}

export interface TraceRequirement {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected' | string;
}

export interface TraceProject {
  _id: string;
  id?: string;
  repoName: string;
  totalRequirements?: number;
  completedCount?: number;
  partiallyCount?: number;
  notImplementedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvidenceItem {
  filePath: string;
  startLine: number;
  endLine: number;
  chunkId?: string;
  explanation: string;
}

export type ImplementationStatus =
  | 'completed'
  | 'partially_implemented'
  | 'not_implemented';

export interface RequirementDoc {
  _id: string;
  id?: string;
  requirementSlug: string;
  title: string;
  description: string;
  source?: {
    documentId?: string;
    documentName?: string;
    pageNumber?: number;
  };
  evidence: EvidenceItem[];
  implementationStatus: ImplementationStatus;
  repository: {
    owner?: string;
    name: string;
    branch?: string;
    commitSha?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ExtractRequirementsResponse {
  documentName: string;
  documentId?: string;
  totalRequirements: number;
  requirements: TraceRequirement[];
}

export interface ApproveTraceResponse {
  message: string;
  project: TraceProject;
  summary: {
    total: number;
    completed: number;
    partially_implemented: number;
    not_implemented: number;
  };
  requirements: RequirementDoc[];
}

