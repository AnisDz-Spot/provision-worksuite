// ---- Project Files Storage ----
// Stored key: pv:projectFiles
// Structure: Array<{ id: string; projectId: string; name: string; size: number; type: string; dataUrl: string; uploadedAt: number; uploadedBy: string; version?: number }>

export type ProjectFile = {
  id: string;
  projectId: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // base64 data URL
  uploadedAt: number;
  uploadedBy: string;
  version?: number;
};

function readProjectFiles(): ProjectFile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:projectFiles");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeProjectFiles(files: ProjectFile[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:projectFiles", JSON.stringify(files));
  } catch {}
}

export function getProjectFiles(projectId: string): ProjectFile[] {
  return readProjectFiles()
    .filter((f) => f.projectId === projectId)
    .sort((a, b) => b.uploadedAt - a.uploadedAt);
}

export async function addProjectFile(
  projectId: string,
  file: File,
  uploadedBy: string
): Promise<ProjectFile | null> {
  try {
    // Convert to base64 data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const newFile: ProjectFile = {
      id: `f_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      projectId,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl,
      uploadedAt: Date.now(),
      uploadedBy,
    };

    const all = readProjectFiles();
    all.push(newFile);
    writeProjectFiles(all);
    return newFile;
  } catch (error) {
    console.error("Error adding project file:", error);
    return null;
  }
}

export function deleteProjectFile(fileId: string) {
  const all = readProjectFiles();
  writeProjectFiles(all.filter((f) => f.id !== fileId));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
