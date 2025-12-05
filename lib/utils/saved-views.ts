// ---- Saved Views Utilities ----
// Stored key: pv:savedViews
// Structure: Array<{ id: string; name: string; query: string; status: string; sortBy: string; starredOnly: boolean }>

export type SavedView = {
  id: string;
  name: string;
  query: string;
  status: string;
  sortBy: string;
  starredOnly: boolean;
  clientFilter?: string;
};

function readViews(): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:savedViews");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeViews(views: SavedView[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:savedViews", JSON.stringify(views));
  } catch {}
}

export function getSavedViews(): SavedView[] {
  return readViews();
}

export function saveView(view: Omit<SavedView, "id">): SavedView {
  const newView: SavedView = {
    ...view,
    id: `v_${Date.now()}_${Math.random().toString(16).slice(2)}`,
  };
  const all = readViews();
  all.push(newView);
  writeViews(all);
  return newView;
}

export function deleteSavedView(id: string) {
  const all = readViews();
  writeViews(all.filter((v) => v.id !== id));
}
