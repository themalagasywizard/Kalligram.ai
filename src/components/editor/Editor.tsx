'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { EditorToolbar } from './EditorToolbar';
import { RewritePopup } from './RewritePopup';
import { cn } from '@/lib/utils';

import { useEditor, EditorContent, Editor as TTEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Suggestion from '@tiptap/suggestion';
import { Extension, Node, mergeAttributes } from '@tiptap/core';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { ListItem } from '@tiptap/extension-list-item';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';

// Callout block
const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      icon: { default: '💡' },
      tone: { default: 'info' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },
  renderHTML({ node }) {
    const icon = node.attrs.icon || '💡';
    return ['div', { 'data-type': 'callout', class: 'callout my-2 rounded-md border px-3 py-2 bg-muted/40' },
      ['div', { class: 'flex items-start gap-3' },
        ['div', { class: 'select-none text-xl leading-none pt-0.5' }, icon],
        ['div', { class: 'flex-1' }, 0]
      ]
    ];
  },
  addCommands() {
    return {
      setCallout:
        (attrs?: { icon?: string; tone?: string }) =>
        ({ chain }: any) =>
          chain()
            .insertContent({ type: this.name, attrs: attrs || {}, content: [{ type: 'paragraph' }] })
            .run(),
    } as any;
  },
});

// Toggle (collapsible) block
const Toggle = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return { title: { default: 'Toggle' } };
  },
  parseHTML() {
    return [{ tag: 'details[data-type="toggle"]' }];
  },
  renderHTML({ node }) {
    const title = node.attrs.title || 'Toggle';
    return ['details', { 'data-type': 'toggle', class: 'toggle my-2 rounded-md border bg-muted/30' },
      ['summary', { class: 'cursor-pointer select-none px-3 py-1 font-medium' }, title],
      ['div', { class: 'px-3 pb-2' }, 0]
    ];
  },
  addCommands() {
    return {
      setToggle:
        (attrs?: { title?: string }) =>
        ({ chain }: any) =>
          chain()
            .insertContent({ type: this.name, attrs: attrs || {}, content: [{ type: 'paragraph' }] })
            .run(),
    } as any;
  },
});

// Slash command extension
const SlashCommand = Extension.create({
  name: 'slash-command',
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      Suggestion({
        editor,
        char: '/',
        startOfLine: false,
        allowSpaces: true,
        items: ({ query }) => {
          const all = [
            { title: 'Paragraph', action: 'paragraph' },
            { title: 'Heading 1', action: 'heading1' },
            { title: 'Heading 2', action: 'heading2' },
            { title: 'Heading 3', action: 'heading3' },
            { title: 'Bullet List', action: 'bulletList' },
            { title: 'Numbered List', action: 'numberedList' },
            { title: 'Todo List', action: 'todoList' },
            { title: 'Quote', action: 'quote' },
            { title: 'Divider', action: 'divider' },
            { title: 'Code Block', action: 'codeBlock' },
            { title: 'Callout', action: 'callout' },
            { title: 'Toggle', action: 'toggle' },
            { title: 'Table', action: 'table' },
            { title: 'Image', action: 'image' },
          ];
          return all.filter(i => i.title.toLowerCase().includes(query.toLowerCase()));
        },
        command: ({ editor, range, props }) => {
          const action = (props as any).action;
          const insertPos = range.from;

          // Delete the "/" trigger text
          editor.chain().focus().deleteRange(range).run();

          switch (action) {
            case 'paragraph':
              editor.chain().focus().setTextSelection(insertPos).setParagraph().run();
              break;
            case 'heading1':
              editor.chain().focus().setTextSelection(insertPos).setHeading({ level: 1 }).run();
              break;
            case 'heading2':
              editor.chain().focus().setTextSelection(insertPos).setHeading({ level: 2 }).run();
              break;
            case 'heading3':
              editor.chain().focus().setTextSelection(insertPos).setHeading({ level: 3 }).run();
              break;
            case 'bulletList':
              editor.chain().focus().setTextSelection(insertPos).insertContent({
                type: 'bulletList',
                content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }]
              }).run();
              break;
            case 'numberedList':
              editor.chain().focus().setTextSelection(insertPos).insertContent({
                type: 'orderedList',
                content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }]
              }).run();
              break;
            case 'todoList':
              editor.chain().focus().setTextSelection(insertPos).insertContent({
                type: 'taskList',
                content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] }]
              }).run();
              break;
            case 'quote':
              editor.chain().focus().setTextSelection(insertPos).insertContent({
                type: 'blockquote',
                content: [{ type: 'paragraph' }]
              }).run();
              break;
            case 'divider':
              editor.chain().focus().setTextSelection(insertPos).setHorizontalRule().run();
              break;
            case 'codeBlock':
              editor.chain().focus().setTextSelection(insertPos).insertContent({
                type: 'codeBlock',
                content: [{ type: 'text', text: '' }]
              }).run();
              break;
            case 'callout':
              (editor as any).chain().focus().setTextSelection(insertPos).setCallout({ icon: '💡' }).run();
              break;
            case 'toggle':
              (editor as any).chain().focus().setTextSelection(insertPos).setToggle({ title: 'Toggle' }).run();
              break;
            case 'table': {
              // Open dimension picker
              const view = editor.view;
              const coords = view.coordsAtPos(insertPos);
              const grid = document.createElement('div');
              grid.style.position = 'fixed';
              grid.style.left = coords.left + 'px';
              grid.style.top = (coords.bottom + 8) + 'px';
              grid.className = 'z-50 rounded-md border bg-popover p-2 shadow-md';

              const info = document.createElement('div');
              info.className = 'text-xs text-muted-foreground mb-2';
              info.textContent = '0 × 0';
              grid.appendChild(info);

              const rowsMax = 8; const colsMax = 8;
              for (let r = 1; r <= rowsMax; r++) {
                const row = document.createElement('div');
                row.style.display = 'flex';
                for (let c = 1; c <= colsMax; c++) {
                  const cell = document.createElement('div');
                  cell.className = 'm-[2px] h-5 w-5 rounded border bg-background';
                  cell.dataset.r = String(r);
                  cell.dataset.c = String(c);
                  cell.addEventListener('mouseenter', () => {
                    info.textContent = `${r} × ${c}`;
                    Array.from(grid.querySelectorAll('[data-r]')).forEach((el) => {
                      const rr = Number((el as HTMLElement).dataset.r);
                      const cc = Number((el as HTMLElement).dataset.c);
                      (el as HTMLElement).style.background = (rr <= r && cc <= c) ? 'var(--accent)' : 'var(--background)';
                    });
                  });
                  cell.addEventListener('click', () => {
                    editor.chain().focus().setTextSelection(insertPos).insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
                    cleanup();
                  });
                  row.appendChild(cell);
                }
                grid.appendChild(row);
              }

              const cleanup = () => {
                window.removeEventListener('keydown', onKey);
                window.removeEventListener('click', onClickOutside, true);
                grid.parentNode && grid.parentNode.removeChild(grid);
              };
              const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cleanup(); };
              const onClickOutside = (e: MouseEvent) => { if (!grid.contains(e.target as HTMLElement)) cleanup(); };
              window.addEventListener('keydown', onKey);
              window.addEventListener('click', onClickOutside, true);
              document.body.appendChild(grid);
              break;
            }
            case 'image': {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = () => {
                const file = input.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  editor.chain().focus().setTextSelection(insertPos).setImage({ src: reader.result as string }).run();
                };
                reader.readAsDataURL(file);
              };
              input.click();
              break;
            }
          }
        },
        render: () => {
          let el: HTMLDivElement | null = null;
          return {
            onStart: (props) => {
              const { clientRect } = props;
              if (!clientRect) return;
              const rect = clientRect();
              if (!rect) return;
              if (!el) el = document.createElement('div');
              el.className = 'z-50 rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
              el.style.position = 'fixed';
              el.style.left = rect.left + 'px';
              el.style.top = rect.bottom + 6 + 'px';
              el.innerHTML = '';
              const items = props.items as any[];
              items.forEach((item) => {
                const button = document.createElement('button');
                button.className = 'flex w-full items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent';
                button.textContent = item.title;
                button.addEventListener('mousedown', (e) => e.preventDefault());
                button.addEventListener('click', () => props.command(item));
                el!.appendChild(button);
              });
              document.body.appendChild(el!);
            },
            onUpdate: (props) => {
              const { clientRect } = props;
              if (!clientRect) return;
              const rect = clientRect();
              if (!rect || !el) return;
              el.style.left = rect.left + 'px';
              el.style.top = rect.bottom + 6 + 'px';
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                props.event.preventDefault();
                return true;
              }
              return false;
            },
            onExit: () => {
              if (el && el.parentNode) el.parentNode.removeChild(el);
              el = null;
            },
          };
        },
      }) as any,
    ];
  },
});

export function Editor() {
  const { currentChapter, setIsDirty } = useApp();
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const [selectionPos, setSelectionPos] = useState<{ from: number; to: number } | null>(null);

  const initialContent = useMemo(() => {
    if (!currentChapter) return '<p />';
    const title = `<h1 class="text-3xl font-bold mb-4">${currentChapter.title}</h1>`;
    const body = currentChapter.content || '<p>Start writing your story here...</p>';
    return `${title}${body}`;
  }, [currentChapter?.id]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      Link.configure({ openOnClick: true, autolink: true }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Type "/" for commands…' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ inline: false, allowBase64: true }),
      // Lists
      BulletList,
      OrderedList,
      ListItem,
      // Tables
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      // Custom blocks
      Callout,
      Toggle,
      // Slash menu
      SlashCommand,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none font-serif leading-relaxed min-h-[70vh] px-6 py-8 rounded-lg bg-background',
      },
      handleDOMEvents: {
        drop: (view, event) => {
          // Basic drop-to-insert image
          const dt = (event as DragEvent).dataTransfer;
          if (dt && dt.files && dt.files[0] && dt.files[0].type.startsWith('image/')) {
            const file = dt.files[0];
            const reader = new FileReader();
            reader.onload = () => {
              editor?.chain().focus().setImage({ src: reader.result as string }).run();
            };
            reader.readAsDataURL(file);
            event.preventDefault();
            return true;
          }
          return false;
        },
      },
    },
    onUpdate() {
      setIsDirty(true);
    },
  });

  // Selection popup for AI rewrite
  useEffect(() => {
    const handler = () => {
      if (!editor) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return setShowPopup(false);
      const range = sel.getRangeAt(0);
      if (!editor.view.dom.contains(range.startContainer)) return setShowPopup(false);
      const text = sel.toString().trim();
      if (!text) return setShowPopup(false);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setSelectionRange(range);
      setSelectionPos({ from: editor.state.selection.from, to: editor.state.selection.to });
      setPopupPosition({ top: rect.top - 50, left: rect.left + rect.width / 2 });
        setShowPopup(true);
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [editor]);

  // Allow external inserts via custom event
  useEffect(() => {
    const onInsert = (e: Event) => {
      const detail = (e as CustomEvent).detail as { text: string };
      editor?.chain().focus().insertContent(detail.text).run();
      setIsDirty(true);
    };
    window.addEventListener('editor-insert-text', onInsert as any);
    return () => window.removeEventListener('editor-insert-text', onInsert as any);
  }, [editor, setIsDirty]);

  const execCommand = useCallback((command: string, value?: string) => {
    if (!editor) return;
    switch (command) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'formatBlock':
        if (value === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'fontName':
        if (value) editor.view.dom.style.fontFamily = value;
        break;
      case 'fontSize':
        // TipTap does not support legacy fontSize; could map to heading/scale later
        break;
      default:
        break;
    }
    setIsDirty(true);
  }, [editor, setIsDirty]);

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar onCommand={execCommand} editor={editor as unknown as TTEditor | null} />

      <RewritePopup
        show={showPopup}
        position={popupPosition}
        selectedText={selectedText}
        selectionRange={selectionRange}
        selectionPos={selectionPos}
        editor={editor as unknown as TTEditor | null}
        onRewrite={() => setShowPopup(false)}
        onClose={() => setShowPopup(false)}
        setIsDirty={setIsDirty}
      />
      
      <div className="flex-1 overflow-y-auto px-8 pt-6 pb-0">
        <div className="max-w-3xl mx-auto">
          {editor ? (
            <EditorContent editor={editor} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
