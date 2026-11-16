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
