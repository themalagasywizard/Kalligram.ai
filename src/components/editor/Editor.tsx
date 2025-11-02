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
import { TextStyle } from '@tiptap/extension-text-style';

// Font size extension (uses textStyle mark)
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => ({ fontSize: (element as HTMLElement).style.fontSize || null }),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) => ({ chain }: any) => chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () => ({ chain }: any) => chain().setMark('textStyle', { fontSize: null }).run(),
    } as any;
  },
});

// PageBreak block
const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: false,
  parseHTML() {
    return [{ tag: 'hr[data-page-break="true"]' }];
  },
  renderHTML() {
    return ['hr', { 'data-page-break': 'true', class: 'page-break border-0 my-2' }];
  },
});

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
  const { currentChapter, currentProject, setIsDirty } = useApp();
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const contentFrameRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [pageHeightPx, setPageHeightPx] = useState(0);
  const bleedPx = Math.round(0.125 * 96); // 0.125in bleed

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
      // Inline styles
      TextStyle,
      FontSize,
      // Lists
      BulletList,
      OrderedList,
      ListItem,
      // Tables
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      // Custom blocks
      Callout,
      Toggle,
      PageBreak,
      // Slash menu
      SlashCommand,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none font-serif leading-relaxed px-6 py-8 rounded-lg bg-background',
        style: 'min-height: 70vh; overflow-y: visible;',
      },
      handleScrollToSelection: (view) => {
        // Allow natural scrolling behavior
        return false;
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
      queueMicrotask(() => recomputePagination());
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

  // Table editing keyboard shortcuts and right-click menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editor) return;

      // Only delete table with Backspace/Delete when table is selected but NO text is selected
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const { state } = editor;
        const { selection } = state;

        // Check if there's actual text selected
        const hasTextSelection = selection.from !== selection.to;

        // Check if cursor is inside a table
        let isInTable = false;
        let tableInfo: { node: any; pos: number } | null = null;
        state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (node.type.name === 'table') {
            isInTable = true;
            tableInfo = { node, pos };
            return false;
          }
        });

        // Only delete table if:
        // 1. We're in a table
        // 2. No text is selected (just cursor position)
        // 3. The table is the only content or we're at the table boundaries
        if (isInTable && !hasTextSelection && tableInfo) {
          const tableNode = (tableInfo as { node: any; pos: number }).node;
          const tablePos = (tableInfo as { node: any; pos: number }).pos;
          const tableSize = tableNode.nodeSize;
          const tableStart = tablePos;
          const tableEnd = tableStart + tableSize;

          // Check if the entire table is selected or if we're at table boundaries
          const isTableFullySelected = selection.from <= tableStart && selection.to >= tableEnd;

          if (isTableFullySelected) {
            e.preventDefault();
            editor.chain().focus().deleteTable().run();
            return;
          }
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (!editor) return;

      // Check if right-click is on a table
      const target = e.target as HTMLElement;
      const tableElement = target.closest('table');

      if (tableElement) {
        e.preventDefault();

        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'fixed z-50 bg-popover border rounded-md shadow-md p-1';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';

        // Grid size selector
        const gridButton = document.createElement('button');
        gridButton.className = 'flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded w-full text-left';
        gridButton.innerHTML = `
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
          </svg>
          Resize Table
        `;

        gridButton.onclick = () => {
          showGridSelector(e.clientX, e.clientY);
          menu.remove();
        };

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded w-full text-left text-destructive';
        deleteButton.innerHTML = `
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          Delete Table
        `;

        deleteButton.onclick = () => {
          editor.chain().focus().deleteTable().run();
          menu.remove();
        };

        menu.appendChild(gridButton);
        menu.appendChild(deleteButton);
        document.body.appendChild(menu);

        // Close menu when clicking outside
        const closeMenu = (e: MouseEvent) => {
          if (!menu.contains(e.target as HTMLElement)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
          }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
      }
    };

    const showGridSelector = (x: number, y: number) => {
      const grid = document.createElement('div');
      grid.style.position = 'fixed';
      grid.style.left = x + 'px';
      grid.style.top = y + 'px';
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
            // For resizing, we'll need to implement table resizing logic
            // For now, we'll just recreate the table with new dimensions
            editor.chain().focus().deleteTable().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
            grid.remove();
          });
          row.appendChild(cell);
        }
        grid.appendChild(row);
      }

      document.body.appendChild(grid);

      // Close on escape
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          grid.remove();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [editor]);

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
        if (value) (editor as any).chain().focus().setFontSize(value).run();
        break;
      default:
        break;
    }
    setIsDirty(true);
  }, [editor, setIsDirty]);

  const computePageStyle = () => {
    const size = (currentProject?.page_size || 'A4');
    const orient = (currentProject?.orientation || 'portrait');
    const sizes = {
      A4: { w: 8.27, h: 11.69 },
      A3: { w: 11.69, h: 16.54 },
    } as const;
    const dims = sizes[size];
    const widthIn = orient === 'portrait' ? dims.w : dims.h;
    const heightIn = orient === 'portrait' ? dims.h : dims.w;
    return { width: `${widthIn}in`, height: `${heightIn}in` } as React.CSSProperties;
  };
  const computeContentPadding = () => {
    // Top and bottom padding includes margins + bleed zones
    // Side padding remains 1.25in
    const topMargin = 1; // 1 inch
    const bottomMargin = 1; // 1 inch
    const topBleed = 0.125; // 0.125 inch
    const bottomBleed = 0.125; // 0.125 inch
    
    // Content starts after top margin + top bleed, ends before bottom margin + bottom bleed
    const paddingTop = topMargin + topBleed;
    const paddingBottom = bottomMargin + bottomBleed;
    
    return { 
      paddingTop: `${paddingTop}in`,
      paddingBottom: `${paddingBottom}in`,
      paddingLeft: '1.25in',
      paddingRight: '1.25in'
    } as React.CSSProperties;
  };

  const reflowLock = useRef(false);

  const recomputePagination = () => {
    const size = (currentProject?.page_size || 'A4');
    const orient = (currentProject?.orientation || 'portrait');
    const sizes = { A4: { w: 8.27, h: 11.69 }, A3: { w: 11.69, h: 16.54 } } as const;
    const dims = sizes[size];
    const widthIn = orient === 'portrait' ? dims.w : dims.h;
    const heightIn = orient === 'portrait' ? dims.h : dims.w;
    const pageH = Math.round(heightIn * 96);

    // Account for margins and bleed zones
    const topMargin = Math.round(1 * 96); // 1 inch top margin
    const bottomMargin = Math.round(1 * 96); // 1 inch bottom margin
    const topBleed = Math.round(0.125 * 96); // 0.125 inch top bleed
    const bottomBleed = Math.round(0.125 * 96); // 0.125 inch bottom bleed

    // Effective content height = page height - margins - bleed zones
    const contentH = Math.max(1, pageH - topMargin - bottomMargin - topBleed - bottomBleed);
    setPageHeightPx(pageH);
    const contentEl = contentFrameRef.current;
    if (!contentEl) return;
    const total = contentEl.scrollHeight;
    const count = Math.max(1, Math.ceil(total / contentH));
    setPageCount(count);
    // Broadcast to sidebar
    window.dispatchEvent(new CustomEvent('pagination-update', { detail: { count } }));
  };

  // Compute and enforce true page breaks by inserting PageBreak nodes at block boundaries
  const updatePageBreaks = () => {
    if (!editor || reflowLock.current) return;
    const view = editor.view;
    const root = contentFrameRef.current?.querySelector('.ProseMirror') as HTMLElement | null;
    if (!root) return;

    // Determine content height per page (accounting for margins and bleed zones)
    const size = (currentProject?.page_size || 'A4');
    const orient = (currentProject?.orientation || 'portrait');
    const sizes = { A4: { w: 8.27, h: 11.69 }, A3: { w: 11.69, h: 16.54 } } as const;
    const dims = sizes[size];
    const heightIn = orient === 'portrait' ? dims.h : dims.w;
    const pageH = Math.round(heightIn * 96);

    // Account for margins and bleed zones
    const topMargin = Math.round(1 * 96); // 1 inch top margin
    const bottomMargin = Math.round(1 * 96); // 1 inch bottom margin
    const topBleed = Math.round(0.125 * 96); // 0.125 inch top bleed
    const bottomBleed = Math.round(0.125 * 96); // 0.125 inch bottom bleed

    // Effective content height = page height - margins - bleed zones
    const contentH = Math.max(1, pageH - topMargin - bottomMargin - topBleed - bottomBleed);

    // Remove existing breaks positions from measurement
    const children = Array.from(root.children) as HTMLElement[];
    let accum = 0;
    let currentPageStart = 0; // Track where current page content starts
    const insertPositions: number[] = [];

    for (const el of children) {
      if (el.matches('hr[data-page-break="true"]')) {
        // Reset accumulator for new page, but account for page break height
        accum = 0;
        currentPageStart = accum;
        continue;
      }
      
      const rect = el.getBoundingClientRect();
      const h = Math.ceil(rect.height);
      
      // Check if adding this element would exceed content height for current page
      if (accum + h > contentH && accum > 0) {
        // Insert break before this element to start new page
        try {
          const pos = view.posAtDOM(el, 0);
          if (typeof pos === 'number' && pos > 0) {
            insertPositions.push(pos);
            // Reset accumulator for new page
            accum = h;
            currentPageStart = 0;
          } else {
            accum += h;
          }
        } catch {
          accum += h;
        }
      } else {
        accum += h;
      }
    }

    // Compare with existing breaks
    const state = view.state;
    const breakType = state.schema.nodes['pageBreak'];
    if (!breakType) return;

    const existing: number[] = [];
    state.doc.descendants((node, pos) => {
      if (node.type === breakType) existing.push(pos);
    });

    // Normalize positions (avoid duplicates)
    const desired = Array.from(new Set(insertPositions)).sort((a,b)=>a-b);
    const existSorted = existing.slice().sort((a,b)=>a-b);
    const same = desired.length === existSorted.length && desired.every((v,i)=>v===existSorted[i]);
    if (same) return;

    reflowLock.current = true;
    let tr = state.tr;
    // Remove existing breaks from end
    for (let i = existing.length - 1; i >= 0; i--) {
      const pos = existing[i];
      const node = state.doc.nodeAt(pos);
      if (node) tr = tr.delete(pos, pos + node.nodeSize);
    }
    // Insert desired breaks in ascending order with offset
    let offset = 0;
    desired.forEach((pos) => {
      tr = tr.insert(pos + offset, breakType.create());
      offset += 1; // pageBreak nodeSize assumed 1
    });

    if (tr.docChanged) {
      view.dispatch(tr);
      // Update page count per breaks
      const count = desired.length + 1;
      setPageCount(count);
      window.dispatchEvent(new CustomEvent('pagination-update', { detail: { count } }));
    }
    reflowLock.current = false;
  };

  useEffect(() => {
    recomputePagination();
    const ro = new ResizeObserver(() => { recomputePagination(); updatePageBreaks(); });
    if (contentFrameRef.current) ro.observe(contentFrameRef.current);
    const int = setInterval(updatePageBreaks, 500);
    return () => { ro.disconnect(); clearInterval(int); };
  }, [currentProject?.page_size, currentProject?.orientation]);

  useEffect(() => {
    const handler = (e: Event) => {
      const page = (e as CustomEvent).detail?.page as number;
      if (!Number.isInteger(page)) return;
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: page * pageHeightPx, behavior: 'smooth' });
      }
    };
    window.addEventListener('scroll-to-page', handler as any);
    return () => window.removeEventListener('scroll-to-page', handler as any);
  }, [pageHeightPx]);

  // Ensure cursor placement respects content boundaries
  useEffect(() => {
    if (!editor) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const proseMirror = target.closest('.ProseMirror');
      if (!proseMirror || !contentFrameRef.current) return;

      // Get click position relative to content frame
      const contentRect = contentFrameRef.current.getBoundingClientRect();
      const clickY = e.clientY - contentRect.top;

      // Top margin + bleed zone (1in + 0.125in)
      const topMarginBleed = Math.round(1.125 * 96);
      // Bottom margin + bleed zone (1in + 0.125in)  
      const bottomMarginBleed = Math.round(1.125 * 96);
      
      // Check if click is in top margin/bleed zone
      if (clickY < topMarginBleed) {
        e.preventDefault();
        e.stopPropagation();
        // Move cursor to start of content (after first page break if exists)
        setTimeout(() => {
          const view = editor.view;
          const state = view.state;
          const breakType = state.schema.nodes['pageBreak'];
          let startPos = 1; // Start after doc node
          
          // Find first content position after top margin
          state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
            if (node.type === breakType) {
              startPos = pos + node.nodeSize;
              return false; // Stop at first break
            }
            if (startPos === 1 && node.isBlock) {
              startPos = pos;
            }
          });
          
          editor.chain().focus().setTextSelection(startPos).run();
        }, 0);
        return false;
      }

      // Check if click is in bottom margin/bleed zone (check relative to each page)
      const relativeY = clickY % pageHeightPx;
      const pageContentHeight = pageHeightPx - topMarginBleed - bottomMarginBleed;
      
      if (relativeY > topMarginBleed + pageContentHeight) {
      e.preventDefault();
        e.stopPropagation();
        // Move cursor to end of current page content or start of next page
        setTimeout(() => {
          const view = editor.view;
          const docSize = view.state.doc.content.size;
          editor.chain().focus().setTextSelection(docSize).run();
        }, 0);
        return false;
      }
    };

    const editorDom = editor.view.dom;
    editorDom.addEventListener('mousedown', handleClick);
    return () => editorDom.removeEventListener('mousedown', handleClick);
  }, [editor, pageHeightPx]);

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
      
      <div className="flex-1 overflow-y-auto px-8 pt-6 pb-0" ref={scrollRef}>
        <div className="mx-auto min-h-full">
          {editor ? (
            <div className="relative mx-auto" style={computePageStyle()} ref={pageContainerRef}>
              {/* Page overlays for border and bleed per page */}
              {Array.from({ length: pageCount }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border border-gray-300 dark:border-gray-700 bg-white/0"
                  style={{
                    top: `${i * pageHeightPx}px`,
                    width: '100%',
                    height: `${pageHeightPx}px`,
                    boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Bleed zone */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      boxShadow: `inset 0 ${bleedPx}px 0 0 rgba(255,0,0,0.15), inset 0 -${bleedPx}px 0 0 rgba(255,0,0,0.15)`
                    }}
                  />
                  {/* Top margin zone (non-editable) */}
                  <div
                    className="absolute left-0 right-0 pointer-events-none bg-gray-100/30 dark:bg-gray-800/30"
                    style={{
                      top: 0,
                      height: `${Math.round(1 * 96) + bleedPx}px`, // 1in margin + bleed
                    }}
                  />
                  {/* Bottom margin zone (non-editable) */}
                  <div
                    className="absolute left-0 right-0 pointer-events-none bg-gray-100/30 dark:bg-gray-800/30"
                style={{
                      bottom: 0,
                      height: `${Math.round(1 * 96) + bleedPx}px`, // 1in margin + bleed
                    }}
                  />
                </div>
              ))}

              {/* Content frame (scrolls vertically and increases page overlays) */}
              <div 
                className="absolute left-0 top-0 w-full" 
                style={{ minHeight: `${pageCount * pageHeightPx}px` }}
              >
                {/* Content area that respects margins and bleed zones */}
                <div 
                  className="w-full relative" 
                  style={computeContentPadding()} 
                  ref={contentFrameRef}
                >
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
