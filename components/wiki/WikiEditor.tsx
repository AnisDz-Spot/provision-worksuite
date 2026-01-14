"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import React, { useEffect } from "react";

interface WikiEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b bg-muted/40 p-2 flex flex-wrap gap-1 sticky top-0 z-10">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn(editor.isActive("bold") ? "bg-accent" : "")}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn(editor.isActive("italic") ? "bg-accent" : "")}
      >
        <Italic className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""
        )}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""
        )}
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(editor.isActive("bulletList") ? "bg-accent" : "")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(editor.isActive("orderedList") ? "bg-accent" : "")}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(editor.isActive("blockquote") ? "bg-accent" : "")}
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn(editor.isActive("codeBlock") ? "bg-accent" : "")}
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function WikiEditor({
  content,
  onChange,
  editable = true,
}: WikiEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || "<p></p>",
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base focus:outline-none max-w-none min-h-[300px] p-4",
      },
    },
  });

  // Update content if it changes externally (e.g. switching pages)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Only update if significantly different to avoid cursor jumps
      // For simplicity in this demo, strict equality check might suffice if we don't have frequent external updates while typing
      // But better is to only setContent if it is a NEW page ID loaded (which we handle by remounting or this effect)
      // With collaborative editing this is complex, but for single user:
      if (
        Math.abs(editor.getText().length - content.length) > 5 ||
        content === ""
      ) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  // Handle editable prop change
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  return (
    <div className="border rounded-md overflow-hidden bg-card flex flex-col h-full min-h-[400px]">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  );
}
