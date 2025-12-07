"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Code,
  Minus,
  Undo,
  Redo,
  Palette,
  Highlighter,
  Smile,
} from "lucide-react";
import * as React from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontSize.configure({ types: ["textStyle", "paragraph", "heading"] }),
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4 text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground",
      },
    },
  });

  if (!editor) {
    return null;
  }

  const colors = [
    { name: "Black", value: "#000000" },
    { name: "Gray", value: "#6B7280" },
    { name: "Red", value: "#EF4444" },
    { name: "Orange", value: "#F97316" },
    { name: "Yellow", value: "#EAB308" },
    { name: "Green", value: "#22C55E" },
    { name: "Blue", value: "#3B82F6" },
    { name: "Indigo", value: "#6366F1" },
    { name: "Purple", value: "#A855F7" },
    { name: "Pink", value: "#EC4899" },
  ];

  const highlightColors = [
    { name: "None", value: "" },
    { name: "Yellow", value: "#FEF08A" },
    { name: "Green", value: "#BBF7D0" },
    { name: "Blue", value: "#BFDBFE" },
    { name: "Pink", value: "#FBCFE8" },
    { name: "Purple", value: "#E9D5FF" },
  ];

  const emojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🥳",
    "😏",
    "😒",
    "😞",
    "😔",
    "😟",
    "😕",
    "🙁",
    "☹️",
    "😣",
    "😖",
    "😫",
    "😩",
    "🥺",
    "😢",
    "😭",
    "😤",
    "😠",
    "😡",
    "🤬",
    "🤯",
    "😳",
    "🥵",
    "🥶",
    "😱",
    "😨",
    "😰",
    "😥",
    "😓",
    "🤗",
    "🤔",
    "🤭",
    "🤫",
    "🤥",
    "😶",
    "😐",
    "😑",
    "😬",
    "🙄",
    "😯",
    "😦",
    "😧",
    "😮",
    "😲",
    "🥱",
    "😴",
    "🤤",
    "😪",
    "😵",
    "🤐",
    "🥴",
    "🤢",
    "🤮",
    "🤧",
    "😷",
    "🤒",
    "🤕",
    "🤑",
    "🤠",
    "😈",
    "👿",
    "👹",
    "👺",
    "🤡",
    "💩",
    "👻",
    "💀",
    "☠️",
    "👽",
    "👾",
    "🤖",
    "🎃",
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "👇",
    "☝️",
    "✋",
    "🤚",
    "🖐️",
    "🖖",
    "👋",
    "🤝",
    "💪",
    "🙏",
    "✍️",
    "💅",
    "🤳",
    "💃",
    "🕺",
    "👯",
    "🧘",
    "🛀",
    "🛌",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
    "☮️",
    "✨",
    "⭐",
    "🌟",
    "💫",
    "✅",
    "❌",
    "⚠️",
    "🔥",
    "💯",
    "🎉",
    "🎊",
    "🎈",
    "🎁",
    "🏆",
    "🥇",
    "🥈",
    "🥉",
    "⚽",
    "🏀",
    "🏈",
  ];

  return (
    <div className="border border-border rounded-md bg-card">
      <div className="flex items-center gap-1 p-2 border-b border-border flex-wrap">
        {/* Font Size */}
        <select
          value={editor.getAttributes("textStyle").fontSize || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) {
              editor.chain().focus().unsetFontSize().run();
            } else {
              editor.chain().focus().setFontSize(val).run();
            }
          }}
          className="px-2 py-1 rounded border bg-background text-sm"
          title="Font Size"
        >
          <option value="">Font size</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="28px">28</option>
          <option value="32px">32</option>
        </select>

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-accent disabled:opacity-30"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-accent disabled:opacity-30"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => {
            if (editor.isActive("heading", { level: 1 })) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().setHeading({ level: 1 }).run();
            }
          }}
          className={`p-2 rounded hover:bg-accent ${editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (editor.isActive("heading", { level: 2 })) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().setHeading({ level: 2 }).run();
            }
          }}
          className={`p-2 rounded hover:bg-accent ${editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (editor.isActive("heading", { level: 3 })) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().setHeading({ level: 3 }).run();
            }
          }}
          className={`p-2 rounded hover:bg-accent ${editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""}`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive("bold") ? "bg-accent" : ""}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive("italic") ? "bg-accent" : ""}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive("underline") ? "bg-accent" : ""}`}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive("strike") ? "bg-accent" : ""}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
            }}
            className="p-2 rounded hover:bg-accent"
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <>
              <div
                className="fixed inset-0 z-10 cursor-pointer"
                onClick={() => setShowColorPicker(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-card border-2 border-border rounded-lg shadow-2xl p-3 z-20 min-w-[280px]">
                <div className="text-xs font-semibold mb-2 text-muted-foreground">
                  Text Color
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        editor.chain().focus().setColor(color.value).run();
                        setShowColorPicker(false);
                      }}
                      className="flex flex-col items-center gap-1 p-1.5 rounded hover:bg-accent transition-colors group"
                      title={color.name}
                    >
                      <div
                        className="w-10 h-10 rounded-md border-2 border-border group-hover:border-primary group-hover:scale-110 transition-all shadow-sm"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                        {color.name}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().unsetColor().run();
                      setShowColorPicker(false);
                    }}
                    className="flex flex-col items-center gap-1 p-1.5 rounded hover:bg-accent transition-colors group"
                    title="Reset Color"
                  >
                    <div className="w-10 h-10 rounded-md border-2 border-border group-hover:border-primary group-hover:scale-110 transition-all shadow-sm bg-background flex items-center justify-center text-xl font-bold text-muted-foreground">
                      ×
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                      Reset
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Highlight Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
            }}
            className="p-2 rounded hover:bg-accent"
            title="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          {showHighlightPicker && (
            <>
              <div
                className="fixed inset-0 z-10 cursor-pointer"
                onClick={() => setShowHighlightPicker(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-card border-2 border-border rounded-lg shadow-2xl p-3 z-20 min-w-[220px]">
                <div className="text-xs font-semibold mb-2 text-muted-foreground">
                  Highlight Color
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {highlightColors.map((color) => (
                    <button
                      key={color.value || "none"}
                      type="button"
                      onClick={() => {
                        if (color.value) {
                          editor
                            .chain()
                            .focus()
                            .setHighlight({ color: color.value })
                            .run();
                        } else {
                          editor.chain().focus().unsetHighlight().run();
                        }
                        setShowHighlightPicker(false);
                      }}
                      className="flex flex-col items-center gap-1 p-1.5 rounded hover:bg-accent transition-colors group"
                      title={color.name}
                    >
                      <div
                        className="w-12 h-10 rounded-md border-2 border-border group-hover:border-primary group-hover:scale-110 transition-all shadow-sm flex items-center justify-center"
                        style={{
                          backgroundColor: color.value || "transparent",
                        }}
                      >
                        {!color.value && (
                          <span className="text-xl font-bold text-muted-foreground">
                            ×
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Emoji Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowColorPicker(false);
              setShowHighlightPicker(false);
            }}
            className="p-2 rounded hover:bg-accent"
            title="Insert Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          {showEmojiPicker && (
            <>
              <div
                className="fixed inset-0 z-10 cursor-pointer"
                onClick={() => setShowEmojiPicker(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-card border-2 border-border rounded-lg shadow-2xl p-3 z-20 w-80 max-h-64 overflow-y-auto">
                <div className="text-xs font-semibold mb-2 text-muted-foreground">
                  Insert Emoji
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        editor.chain().focus().insertContent(emoji).run();
                        setShowEmojiPicker(false);
                      }}
                      className="p-2 text-2xl rounded hover:bg-accent transition-colors"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive({ textAlign: "left" }) ? "bg-accent" : ""}`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive({ textAlign: "center" }) ? "bg-accent" : ""}`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive({ textAlign: "right" }) ? "bg-accent" : ""}`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive({ textAlign: "justify" }) ? "bg-accent" : ""}`}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive("bulletList") ? "bg-accent" : ""}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive("orderedList") ? "bg-accent" : ""}`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Blockquote & Code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive("blockquote") ? "bg-accent" : ""}`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded hover:bg-accent ${editor.isActive("codeBlock") ? "bg-accent" : ""}`}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 rounded hover:bg-accent"
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
