import { useState } from "react";
import { Project } from "@/hooks/useProjectEditData";
import { X } from "lucide-react";

interface ProjectTaxonomyProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  allCategories: string[];
  setAllCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ProjectTaxonomy({
  project,
  setProject,
  allCategories,
  setAllCategories,
}: ProjectTaxonomyProps) {
  const [tagInput, setTagInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");

  const handleAddCategory = () => {
    if (categoryInput.trim()) {
      const newCat = categoryInput.trim();
      if (!allCategories.includes(newCat)) {
        const updated = [...allCategories, newCat];
        setAllCategories(updated);
        localStorage.setItem("pv:categories", JSON.stringify(updated));
      }
      const cats = Array.isArray(project.categories) ? project.categories : [];
      if (!cats.includes(newCat)) {
        setProject((p) => (p ? { ...p, categories: [...cats, newCat] } : p));
      }
      setCategoryInput("");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Categories</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(Array.isArray(project.categories) ? project.categories : []).map(
            (cat: string, idx: number) => (
              <span
                key={idx}
                className="bg-accent px-2 py-1 rounded-md text-xs flex items-center gap-1"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => {
                    const cats = Array.isArray(project.categories)
                      ? project.categories
                      : [];
                    setProject((p) =>
                      p
                        ? {
                            ...p,
                            categories: cats.filter((_, i) => i !== idx),
                          }
                        : p
                    );
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          )}
        </div>
        <select
          className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm mb-2"
          onChange={(e) => {
            const value = e.target.value;
            const cats = Array.isArray(project.categories)
              ? project.categories
              : [];
            if (value && !cats.includes(value)) {
              setProject((p) =>
                p ? { ...p, categories: [...cats, value] } : p
              );
            }
            e.target.value = "";
          }}
          value=""
        >
          <option value="">+ Select Category</option>
          {allCategories
            .filter(
              (c) =>
                !(
                  Array.isArray(project.categories) ? project.categories : []
                ).includes(c)
            )
            .map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
        </select>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            placeholder="Add new category"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCategory();
              }
            }}
          />
          <button
            type="button"
            className="px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm hover:bg-accent"
            onClick={handleAddCategory}
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(project.tags || []).map((tag, idx) => (
            <span
              key={idx}
              className="bg-accent px-2 py-1 rounded-md text-xs flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() =>
                  setProject((p) =>
                    p
                      ? {
                          ...p,
                          tags: (p.tags || []).filter((_, i) => i !== idx),
                        }
                      : p
                  )
                }
                className="text-muted-foreground hover:text-destructive"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && tagInput.trim()) {
              e.preventDefault();
              setProject((p) =>
                p ? { ...p, tags: [...(p.tags || []), tagInput.trim()] } : p
              );
              setTagInput("");
            }
          }}
          placeholder="Type tag and press Enter"
        />
      </div>
    </div>
  );
}
