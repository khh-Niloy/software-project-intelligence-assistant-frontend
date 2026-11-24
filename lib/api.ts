import {
  DocumentItem,
  UploadResponse,
  SearchResponse,
  QAItem,
  GithubStatusResponse,
  GithubRepo,
  RepositoryTreeResponse,
  RepositoryFileContent,
  TraceRequirement,
  TraceProject,
  RequirementDoc,
  ExtractRequirementsResponse,
  ApproveTraceResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function extractData<T>(json: unknown): T {
  if (
    json &&
    typeof json === 'object' &&
    'data' in json &&
    (json as { data: unknown }).data !== undefined
  ) {
    return (json as { data: T }).data;
  }
  return json as T;
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  try {
    const res = await fetch(`${API_BASE}/document`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    return extractData<DocumentItem[]>(json) ?? [];
  } catch (err) {
    console.warn('Backend offline or unreachable when loading documents:', err);
    return [];
  }
}

export async function fetchDocument(id: string): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/document/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    let errorMsg = `Failed to fetch document (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  const json = await res.json();
  return extractData<DocumentItem>(json);
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/ingest/doc`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let errorMsg = `Upload failed (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return extractData<UploadResponse>(json);
}

export async function ingestGithubRepository(repoName: string) {
  const res = await fetch(`${API_BASE}/ingest/repo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repoName }),
  });

  if (!res.ok) {
    let errorMsg = `Repository ingestion failed (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return extractData<{
    repoName: string;
    owner: string;
    branch: string;
    totalFiles: number;
    totalChunks: number;
  }>(json);
}

export async function searchDocument(
  query: string,
  documentId?: string,
): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/retrieve/doc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      documentId: documentId || undefined,
    }),
  });

  if (!res.ok) {
    let errorMsg = `Search failed (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return extractData<SearchResponse>(json);
}

export async function searchRepository(
  query: string,
  repoName: string,
): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/retrieve/repo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, repoName }),
  });

  if (!res.ok) {
    let errorMsg = `Repository query failed (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return extractData<SearchResponse>(await res.json());
}

export async function fetchQnas(): Promise<QAItem[]> {
  try {
    const res = await fetch(`${API_BASE}/chat/qna`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    return extractData<QAItem[]>(json) ?? [];
  } catch (err) {
    console.warn('Backend offline or unreachable when loading Q&A history:', err);
    return [];
  }
}

export async function fetchQna(id: string): Promise<QAItem> {
  const res = await fetch(`${API_BASE}/chat/qna/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Q&A item: ${res.statusText}`);
  }
  const json = await res.json();
  return extractData<QAItem>(json);
}

export async function fetchRepositoryQnas(): Promise<QAItem[]> {
  try {
    const res = await fetch(`${API_BASE}/retrieve/repo/qna`, { cache: 'no-store' });
    if (!res.ok) {
      return [];
    }
    return extractData<QAItem[]>(await res.json()) ?? [];
  } catch (err) {
    console.warn('Backend offline or unreachable when loading repository chat history:', err);
    return [];
  }
}

export async function fetchGithubStatus(): Promise<GithubStatusResponse> {
  try {
    const res = await fetch(`${API_BASE}/github/status`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return { connected: false, user: null };
    }
    const json = await res.json();
    return extractData<GithubStatusResponse>(json) ?? { connected: false, user: null };
  } catch (err) {
    console.warn('Backend offline or unreachable when checking GitHub status:', err);
    return { connected: false, user: null };
  }
}

export async function disconnectGithub(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/github/disconnect`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to disconnect GitHub');
  }
  const json = await res.json();
  return extractData<{ message: string }>(json);
}

export function getGithubLoginUrl(): string {
  return `${API_BASE}/github/login`;
}

export async function fetchGithubRepositories(): Promise<GithubRepo[]> {
  try {
    const res = await fetch(`${API_BASE}/github/repos`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    return extractData<GithubRepo[]>(json) ?? [];
  } catch (err) {
    console.warn('Backend offline or unreachable when loading repositories:', err);
    return [];
  }
}

export async function fetchRepositoryTree(
  owner: string,
  repo: string,
  branch?: string,
): Promise<RepositoryTreeResponse> {
  const params = new URLSearchParams({ owner, repo });
  if (branch) params.append('branch', branch);

  const res = await fetch(`${API_BASE}/github/tree?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    let errorMsg = `Failed to load repository tree (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  const json = await res.json();
  return extractData<RepositoryTreeResponse>(json);
}

export async function fetchRepositoryContent(
  owner: string,
  repo: string,
  path: string,
  branch?: string,
): Promise<RepositoryFileContent> {
  const params = new URLSearchParams({ owner, repo, path });
  if (branch) params.append('branch', branch);

  const res = await fetch(
    `${API_BASE}/github/content?${params.toString()}`,
    {
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    let errorMsg = `Failed to load file content (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  const json = await res.json();
  return extractData<RepositoryFileContent>(json);
}

export async function extractRequirements(params: {
  file?: File;
  documentId?: string;
}): Promise<ExtractRequirementsResponse> {
  let res: Response;

  if (params.file) {
    const formData = new FormData();
    formData.append('file', params.file);
    if (params.documentId) {
      formData.append('documentId', params.documentId);
    }
    res = await fetch(`${API_BASE}/trace/extract`, {
      method: 'POST',
      body: formData,
    });
  } else if (params.documentId) {
    res = await fetch(`${API_BASE}/trace/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: params.documentId }),
    });
  } else {
    throw new Error('Please choose an existing document or upload a requirement file.');
  }

  if (!res.ok) {
    let errorMsg = `Requirement extraction failed (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return extractData<ExtractRequirementsResponse>(json);
}

export async function approveTraceRequirements(data: {
  projectName?: string;
  repoName: string;
  repoOwner?: string;
  documentId?: string;
  documentName?: string;
  requirements: TraceRequirement[];
}): Promise<ApproveTraceResponse> {
  const res = await fetch(`${API_BASE}/trace/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let errorMsg = `Failed to approve requirements (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return extractData<ApproveTraceResponse>(json);
}

export async function fetchTraceProjects(): Promise<TraceProject[]> {
  try {
    const res = await fetch(`${API_BASE}/trace/projects`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return extractData<TraceProject[]>(json) ?? [];
  } catch (err) {
    console.warn('Backend offline or unreachable when fetching trace projects:', err);
    return [];
  }
}

export async function fetchTraceRequirementsByRepo(
  repoName: string,
): Promise<RequirementDoc[]> {
  try {
    const res = await fetch(
      `${API_BASE}/trace/requirements/${encodeURIComponent(repoName)}`,
      {
        cache: 'no-store',
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return extractData<RequirementDoc[]>(json) ?? [];
  } catch (err) {
    console.warn(
      `Backend offline or unreachable when fetching requirements for ${repoName}:`,
      err,
    );
    return [];
  }
}

export async function deleteTraceProject(id: string): Promise<{
  message: string;
  deletedRequirements: number;
}> {
  const res = await fetch(`${API_BASE}/trace/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    let errorMsg = `Failed to delete project (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return extractData<{ message: string; deletedRequirements: number }>(
    await res.json(),
  );
}

export async function deleteTraceRequirement(id: string): Promise<{
  message: string;
  deletedRequirementId: string;
}> {
  const res = await fetch(
    `${API_BASE}/trace/requirements/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );

  if (!res.ok) {
    let errorMsg = `Failed to delete requirement (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return extractData<{ message: string; deletedRequirementId: string }>(
    await res.json(),
  );
}
