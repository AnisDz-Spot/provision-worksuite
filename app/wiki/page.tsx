"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  Clock,
  User,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { sanitizeHtml } from "@/lib/sanitize";

type WikiPage = {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  projectId: string | null;
};

export default function WikiPage() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<WikiPage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: [] as string[],
    projectId: null as string | null,
  });

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = pages.filter(
        (page) =>
          page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setFilteredPages(filtered);
    } else {
      setFilteredPages(pages);
    }
  }, [searchQuery, pages]);

  const loadPages = async () => {
    try {
      const res = await fetch("/data/wiki.json");
      const data = await res.json();
      setPages(data);
      setFilteredPages(data);
    } catch (error) {
      console.error("Failed to load wiki pages:", error);
    }
  };

  const handleCreateNew = () => {
    setFormData({ title: "", content: "", tags: [], projectId: null });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (page: WikiPage) => {
    setFormData({
      title: page.title,
      content: page.content,
      tags: page.tags,
      projectId: page.projectId,
    });
    setSelectedPage(page);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (pageId: string) => {
    if (confirm("Are you sure you want to delete this page?")) {
      setPages(pages.filter((p) => p.id !== pageId));
    }
  };

  const handleSave = () => {
    if (isEditing && selectedPage) {
      setPages(
        pages.map((p) =>
          p.id === selectedPage.id
            ? { ...p, ...formData, updatedAt: new Date().toISOString() }
            : p
        )
      );
    } else {
      const newPage: WikiPage = {
        id: `wiki-${Date.now()}`,
        ...formData,
        createdBy: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPages([...pages, newPage]);
    }
    setIsModalOpen(false);
  };

  const handleViewPage = (page: WikiPage) => {
    setSelectedPage(page);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (selectedPage && !isModalOpen) {
    return (
      <section className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPage(null)}
          >
            ← Back to Wiki
          </Button>
        </div>
        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-3">{selectedPage.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{selectedPage.createdBy}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Updated {formatDate(selectedPage.updatedAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(selectedPage)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleDelete(selectedPage.id);
                  setSelectedPage(null);
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
          {selectedPage.tags.length > 0 && (
            <div className="flex gap-2 mb-6">
              {selectedPage.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(selectedPage.content),
            }}
          />
        </Card>
      </section>
    );
  }

  return (
    <section className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Wiki & Documentation</h1>
            <p className="text-sm text-muted-foreground">
              Centralized knowledge base for your team
            </p>
          </div>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
      </div>

      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search pages by title or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <div className="grid gap-4">
        {filteredPages.map((page) => (
          <Card
            key={page.id}
            className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleViewPage(page)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{page.title}</h3>
                <div
                  className="text-sm text-muted-foreground mb-3 line-clamp-2"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(
                      page.content.replace(/<[^>]*>/g, "").substring(0, 150) +
                        "..."
                    ),
                  }}
                />
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{page.createdBy}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(page.updatedAt)}</span>
                  </div>
                  {page.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <div className="flex gap-1">
                        {page.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(page);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(page.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? "Edit Page" : "Create New Page"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Page title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Write your content here (HTML supported)..."
              className="w-full min-h-[200px] px-3 py-2 bg-background border border-border rounded-lg resize-y"
            />
            <p className="text-xs text-muted-foreground mt-1">
              HTML tags are supported for rich formatting
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Tags (comma-separated)
            </label>
            <Input
              value={formData.tags.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="onboarding, guide, api..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? "Save Changes" : "Create Page"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
