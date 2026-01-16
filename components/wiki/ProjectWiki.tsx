"use client";

import React, { useState, useEffect } from "react";
import { WikiSidebar } from "./WikiSidebar";
import { WikiEditor } from "./WikiEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToaster } from "@/components/ui/Toaster";
import { Trash2, Save, Edit } from "lucide-react";
import { WikiPage } from "@/types/wiki";

interface ProjectWikiProps {
  projectUid: string;
}

export function ProjectWiki({ projectUid }: ProjectWikiProps) {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Editor State
  const [editorContent, setEditorContent] = useState("");
  const [editorTitle, setEditorTitle] = useState("");

  const { show } = useToaster();

  // Fetch Pages
  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectUid}/wiki`);
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages);
        // Select first page if none selected
        if (!selectedPageId && data.pages.length > 0) {
          selectPage(data.pages[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch wiki pages", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [projectUid]);

  const selectPage = (page: WikiPage) => {
    setSelectedPageId(page.id);
    setEditorTitle(page.title);
    setEditorContent(page.content || "");
    setIsEditing(false);
  };

  // Helper to get CSRF token from cookies
  const getCsrfToken = () => {
    if (typeof document === "undefined") return "";
    const match = document.cookie.match(new RegExp("(^| )csrf-token=([^;]+)"));
    return match ? match[2] : "";
  };

  const handleCreate = async (parentId?: string | null) => {
    const newTitle = "Untitled Page";
    try {
      const res = await fetch(`/api/projects/${projectUid}/wiki`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({
          title: newTitle,
          content: "",
          parentId: parentId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPages([...pages, data.page]);
        selectPage(data.page);
        setIsEditing(true); // Auto enter edit mode
        show("success", "Page created");
      } else {
        const err = await res.json();
        show("error", err.error || "Failed to create page");
      }
    } catch (error) {
      show("error", "Failed to create page");
    }
  };

  const handleSave = async () => {
    if (!selectedPageId) return;

    try {
      const res = await fetch(
        `/api/projects/${projectUid}/wiki/${selectedPageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": getCsrfToken(),
          },
          body: JSON.stringify({ title: editorTitle, content: editorContent }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setPages(
          pages.map((p) =>
            p.id === selectedPageId
              ? { ...p, title: editorTitle, content: editorContent }
              : p
          )
        );
        setIsEditing(false);
        show("success", "Saved changes");
      } else {
        const err = await res.json();
        show("error", err.error || "Failed to save");
      }
    } catch (error) {
      show("error", "Failed to save");
    }
  };

  const handleDelete = async () => {
    if (
      !selectedPageId ||
      !confirm("Are you sure you want to delete this page?")
    )
      return;

    try {
      const res = await fetch(
        `/api/projects/${projectUid}/wiki/${selectedPageId}`,
        {
          method: "DELETE",
          headers: {
            "x-csrf-token": getCsrfToken(),
          },
        }
      );

      if (res.ok) {
        const newPages = pages.filter((p) => p.id !== selectedPageId);
        setPages(newPages);
        setSelectedPageId(null);
        setEditorTitle("");
        setEditorContent("");
        if (newPages.length > 0) selectPage(newPages[0]);
        show("success", "Page deleted");
      } else {
        const err = await res.json();
        show("error", err.error || "Failed to delete");
      }
    } catch (error) {
      show("error", "Failed to delete");
    }
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-card">
      <WikiSidebar
        pages={pages}
        selectedPageId={selectedPageId}
        onSelect={(id) => {
          const page = pages.find((p) => p.id === id);
          if (page) selectPage(page);
        }}
        onCreate={handleCreate}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {selectedPageId ? (
          <>
            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between gap-4 bg-muted/10">
              {isEditing ? (
                <Input
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  className="font-bold text-lg h-auto py-1 px-2"
                />
              ) : (
                <h2 className="font-bold text-xl truncate">{editorTitle}</h2>
              )}

              <div className="flex items-center gap-2 shrink-0">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <WikiEditor
                content={editorContent}
                onChange={setEditorContent}
                editable={isEditing}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a page or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}
