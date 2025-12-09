"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  addProjectComment,
  deleteProjectComment,
  getProjectComments,
  highlightMentions,
  ProjectComment,
} from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Trash2 } from "lucide-react";
import usersData from "@/data/users.json";
import { shouldUseMockData } from "@/lib/dataSource";
import { sanitizeMentions } from "@/lib/sanitize";

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export function ProjectComments({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [comments, setComments] = React.useState<ProjectComment[]>([]);
  const [draft, setDraft] = React.useState<string>("<p></p>");
  const [author, setAuthor] = React.useState<string>("You");

  const refresh = React.useCallback(() => {
    setComments(getProjectComments(projectId));
  }, [projectId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function submit() {
    const clean = draft.trim();
    if (!clean || clean === "<p></p>") return;
    addProjectComment(projectId, author, clean);
    setDraft("<p></p>");
    refresh();
  }

  function remove(id: string) {
    deleteProjectComment(id);
    refresh();
  }

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-sm font-semibold">Comments</h3>
      <div className="space-y-2">
        <label className="text-xs font-medium">Author</label>
        <select
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="rounded-md border border-border bg-card text-foreground px-2 py-1 text-xs"
        >
          <option value="You">You</option>
          {shouldUseMockData() &&
            usersData.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name}
              </option>
            ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium">Comment</label>
        <RichTextEditor value={draft} onChange={setDraft} />
      </div>
      <div className="flex justify-end">
        <Button size="sm" variant="primary" onClick={submit}>
          Add Comment
        </Button>
      </div>
      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-xs text-muted-foreground">No comments yet.</p>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className="rounded-md border border-border p-3 space-y-2 text-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.author)}`}
                  alt={c.author}
                  className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform"
                  title={`View ${c.author}'s profile`}
                  onClick={() =>
                    router.push(
                      `/team/${c.author.toLowerCase().replace(/\s+/g, "-")}`
                    )
                  }
                />
                <span className="font-medium">{c.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDate(c.createdAt)}
                </span>
                <button
                  onClick={() => remove(c.id)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                  title="Delete comment"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: sanitizeMentions(highlightMentions(c.content)),
              }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
