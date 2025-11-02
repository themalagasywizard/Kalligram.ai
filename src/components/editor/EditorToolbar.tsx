'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Maximize,
  ChevronDown,
  Table,
  Pilcrow,
} from 'lucide-react';
import type { Editor as TTEditor } from '@tiptap/react';

interface EditorToolbarProps {
  onCommand: (command: string, value?: string) => void;
  editor?: TTEditor | null;
}

export function EditorToolbar({ onCommand, editor }: EditorToolbarProps) {
  const [activeFontSize, setActiveFontSize] = useState<string>('3');
  const [selectedFont, setSelectedFont] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('selectedFont') || 'Merriweather' : 'Merriweather'
  );

  const fontOptions = [
    { name: 'Merriweather', value: 'Merriweather, serif', category: 'Serif' },
    { name: 'Crimson Text', value: 'Crimson Text, serif', category: 'Serif' },
    { name: 'Lato', value: 'Lato, sans-serif', category: 'Sans Serif' },
    { name: 'Open Sans', value: 'Open Sans, sans-serif', category: 'Sans Serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif', category: 'Sans Serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif', category: 'Sans Serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif', category: 'Sans Serif' },
    { name: 'Nunito', value: 'Nunito, sans-serif', category: 'Sans Serif' },
    { name: 'Inter', value: 'Inter, sans-serif', category: 'Sans Serif' },
    { name: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif', category: 'Sans Serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif', category: 'System' },
    { name: 'Arial', value: 'Arial, sans-serif', category: 'System' },
    { name: 'Georgia', value: 'Georgia, serif', category: 'System' },
    { name: 'Verdana', value: 'Verdana, sans-serif', category: 'System' },
  ];

  const handleBold = () => {
    if (editor) editor.chain().focus().toggleBold().run(); else onCommand('bold');
  };
  const handleItalic = () => {
    if (editor) editor.chain().focus().toggleItalic().run(); else onCommand('italic');
  };
  const handleHeading = (level: number | 'paragraph') => {
    if (editor) {
      if (level === 'paragraph') {
        editor.chain().focus().setParagraph().run();
      } else {
        editor.chain().focus().toggleHeading({ level }).run();
      }
    } else {
      if (level === 'paragraph') {
        onCommand('formatBlock', 'p');
      } else {
        onCommand('formatBlock', `h${level}`);
      }
    }
  };
  
  const handleFontSize = (size: string) => {
    setActiveFontSize(size);
    onCommand('fontSize', size);
  };

  const handleFontChange = (fontValue: string, fontName: string) => {
    setSelectedFont(fontName);
    localStorage.setItem('selectedFont', fontName);
    onCommand('fontName', fontValue);
  };

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleInsertTable = () => {
    if (!editor) return;

    // Get current cursor position or end of document
    const { from } = editor.state.selection;
    const insertPos = from;

    // Create grid picker overlay
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
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="flex items-center gap-2 px-4 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBold}
              className="h-9 w-9"
            >
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bold (Ctrl+B)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleItalic}
              className="h-9 w-9"
            >
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Italic (Ctrl+I)</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-3 gap-2">
                  <Heading1 className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Text Format</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleHeading('paragraph')} className="cursor-pointer">
              <Pilcrow className="h-4 w-4 mr-2" />
              Normal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleHeading(1)} className="cursor-pointer">
              <Heading1 className="h-4 w-4 mr-2" />
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleHeading(2)} className="cursor-pointer">
              <Heading2 className="h-4 w-4 mr-2" />
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleHeading(3)} className="cursor-pointer">
              <Heading3 className="h-4 w-4 mr-2" />
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleInsertTable}
              className="h-9 w-9"
            >
              <Table className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Insert Table</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Type className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Font Size</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleFontSize('1')}>8 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('2')}>9 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('3')}>10 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('4')}>11 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('5')}>12 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('6')}>14 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('7')}>16 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('8')}>18 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('9')}>20 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('10')}>24 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('11')}>28 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('12')}>36 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('13')}>48 pt</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFontSize('14')}>72 pt</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-3 gap-2">
                  <Type className="h-4 w-4" />
                  <span className="text-sm font-medium">{selectedFont}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Font Family</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-56">
            {fontOptions.map((font) => (
              <DropdownMenuItem
                key={font.name}
                onClick={() => handleFontChange(font.value, font.name)}
                className="cursor-pointer"
              >
                <span
                  style={{ fontFamily: font.value }}
                  className="flex-1"
                >
                  {font.name}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {font.category}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullScreen}
              className="h-9 w-9"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Full Screen</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
