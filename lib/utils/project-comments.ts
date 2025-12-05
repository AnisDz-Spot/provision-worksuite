// ---- Project Comments Utilities ----
// Stored in localStorage key `pv:projectComments`
// Shape: { id, projectId, author, content(html), createdAt }

export type ProjectComment = {
  id: string;
  projectId: string;
  author: string;
  content: string; // HTML produced by RichTextEditor
  createdAt: number;
};

function readComments(): ProjectComment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:projectComments");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeComments(comments: ProjectComment[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:projectComments", JSON.stringify(comments));
  } catch {}
}

export function addProjectComment(
  projectId: string,
  author: string,
  content: string
) {
  const comment: ProjectComment = {
    id: `c_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    projectId,
    author,
    content,
    createdAt: Date.now(),
  };
  const existing = readComments();
  existing.push(comment);
  writeComments(existing);
  return comment;
}

export function deleteProjectComment(id: string) {
  const existing = readComments();
  const filtered = existing.filter((c) => c.id !== id);
  writeComments(filtered);
}

export function getProjectComments(projectId: string): ProjectComment[] {
  return readComments()
    .filter((c) => c.projectId === projectId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Utility to highlight @mentions inside raw HTML (very lightweight)
export function highlightMentions(html: string): string {
  return html.replace(/(^|\s)@([A-Za-z0-9_\-]+)/g, (match, pre, handle) => {
    return `${pre}<span class="text-primary font-medium">@${handle}</span>`;
  });
}
