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
  Type,
  Maximize,
  ChevronDown,
} from 'lucide-react';

interface EditorToolbarProps {
  onCommand: (command: string, value?: string) => void;
}

export function EditorToolbar({ onCommand }: EditorToolbarProps) {
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

  const handleBold = () => onCommand('bold');
  const handleItalic = () => onCommand('italic');
  const handleHeading = () => onCommand('formatBlock', 'h2');
  
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

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleHeading}
              className="h-9 w-9"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Heading</p>
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
