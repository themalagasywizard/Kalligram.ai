'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { EditorToolbar } from './EditorToolbar';
import { RewritePopup } from './RewritePopup';
import { cn } from '@/lib/utils';

export function Editor() {
  const { currentChapter, setIsDirty, isDirty } = useApp();
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const [pages, setPages] = useState<number[]>([1]); // Keep for page break visualization

  const countWords = useCallback((text: string): number => {
    const cleanText = text.replace(/<[^>]*>/g, '');
    const words = cleanText.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
  }, []);

  const handleInput = useCallback(() => {
    if (!isDirty) {
      setIsDirty(true);
    }
  }, [isDirty, setIsDirty]);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      const text = selection.toString().trim();
      if (text.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setSelectionRange(range);
        setPopupPosition({
          top: rect.top - 50,
          left: rect.left + rect.width / 2
        });
        setShowPopup(true);
      } else {
        setShowPopup(false);
      }
    } else {
      setShowPopup(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  useEffect(() => {
    if (editorRef.current && currentChapter) {
      // Only set content on the first page (editable one)
      const firstPage = editorRef.current;
      if (firstPage) {
        // Create the title element
        const titleElement = document.createElement('h1');
        titleElement.className = 'text-2xl font-bold text-primary mb-6 text-center';
        titleElement.textContent = currentChapter.title;

        // Set the content
        const content = currentChapter.content || '<p class="mb-4">Start writing your story here...</p>';

        // Combine title and content
        firstPage.innerHTML = titleElement.outerHTML + content;

        // Apply saved font
        const savedFont = localStorage.getItem('selectedFont') || 'Merriweather';
        const fontOption = [
          { name: 'Merriweather', value: 'Merriweather, serif' },
          { name: 'Crimson Text', value: 'Crimson Text, serif' },
          { name: 'Lato', value: 'Lato, sans-serif' },
          { name: 'Open Sans', value: 'Open Sans, sans-serif' },
          { name: 'Roboto', value: 'Roboto, sans-serif' },
          { name: 'Montserrat', value: 'Montserrat, sans-serif' },
          { name: 'Poppins', value: 'Poppins, sans-serif' },
          { name: 'Nunito', value: 'Nunito, sans-serif' },
          { name: 'Inter', value: 'Inter, sans-serif' },
          { name: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif' },
          { name: 'Times New Roman', value: 'Times New Roman, serif' },
          { name: 'Arial', value: 'Arial, sans-serif' },
          { name: 'Georgia', value: 'Georgia, serif' },
          { name: 'Verdana', value: 'Verdana, sans-serif' },
        ].find(f => f.name === savedFont);

        if (fontOption) {
          firstPage.style.fontFamily = fontOption.value;
        }
      }
    }
  }, [currentChapter?.id]); // Only update when chapter changes

  // Monitor content height and create pages dynamically
  useEffect(() => {
    const checkContentHeight = () => {
      if (editorRef.current) {
        const contentHeight = editorRef.current.scrollHeight;
        const pageHeight = 11.69 * 96; // A4 height in pixels (11.69 inches * 96 DPI)
        const requiredPages = Math.max(1, Math.ceil(contentHeight / pageHeight));

        if (requiredPages !== pages.length) {
          setPages(Array.from({ length: requiredPages }, (_, i) => i + 1));
        }
      }
    };

    // Check immediately and on content changes
    checkContentHeight();

    // Also check periodically in case content changes without triggering onInput
    const interval = setInterval(checkContentHeight, 1000);

    return () => clearInterval(interval);
  }, [pages.length]);

  // Also check when content changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (editorRef.current) {
        const contentHeight = editorRef.current.scrollHeight;
        const pageHeight = 11.69 * 96; // A4 height in pixels
        const requiredPages = Math.max(1, Math.ceil(contentHeight / pageHeight));

        if (requiredPages !== pages.length) {
          setPages(Array.from({ length: requiredPages }, (_, i) => i + 1));
        }
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [isDirty, pages.length]);

  const getContent = useCallback(() => {
    return editorRef.current?.innerHTML || '';
  }, []);

  const execCommand = useCallback((command: string, value?: string) => {
    if (command === 'fontName' && value) {
      // Check if there's selected text
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        // Apply font to selected text only
        document.execCommand('fontName', false, value);
      } else if (editorRef.current) {
        // No selection, apply to entire editor
        editorRef.current.style.fontFamily = value;
      }
      setIsDirty(true);
    } else if (command === 'fontSize' && value) {
      // fontSize should already respect selections with document.execCommand
      document.execCommand(command, false, value);
      setIsDirty(true);
    } else {
      document.execCommand(command, false, value || undefined);
      setIsDirty(true);
    }
    editorRef.current?.focus();
  }, [setIsDirty]);

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar onCommand={execCommand} />
      <RewritePopup
        show={showPopup}
        position={popupPosition}
        selectedText={selectedText}
        selectionRange={selectionRange}
        onRewrite={() => setShowPopup(false)}
        onClose={() => setShowPopup(false)}
        setIsDirty={setIsDirty}
      />
      
      <div className="flex-1 overflow-y-auto px-8 pt-6 pb-0">
        <div className="max-w-4xl mx-auto">
          {currentChapter ? (
            <>
              {/* Separate A4 Pages with 3px gaps */}
              <div className="space-y-[3px]">
                {pages.map((pageNum, index) => (
                  <div key={pageNum} className="relative">
                    <div
                      ref={index === 0 ? editorRef : undefined}
                      contentEditable={index === 0}
                      suppressContentEditableWarning
                      onInput={index === 0 ? handleInput : undefined}
                      className={cn(
                        "prose prose-lg dark:prose-invert max-w-none",
                        "focus:outline-none",
                        "font-serif leading-relaxed",
                        // A4 dimensions: 210mm x 297mm = ~595px x ~842px at 72 DPI
                        // Using CSS inches for better accuracy: 8.27in x 11.69in
                        "w-[8.27in] h-[11.69in]",
                        "mx-auto",
                        "bg-white dark:bg-gray-900",
                        "shadow-lg border border-gray-200 dark:border-gray-700",
                        "px-[1in] py-[1.25in]", // Print-safe margins: 1in sides, 1.25in top/bottom
                        "relative",
                        "overflow-hidden"
                      )}
                      style={{
                        fontFamily: "'Merriweather', serif",
                        lineHeight: 1.8,
                        // Ensure content breaks properly
                        orphans: 3,
                        widows: 3
                      }}
                    >
                      {/* Title and content are loaded via useEffect for the first page only */}
                      {index === 0 && (
                        <div>
                          {/* Content will be loaded here */}
                        </div>
                      )}
                    </div>

                    {/* Page number */}
                    <div className="absolute bottom-[1.25in] left-[1in] text-sm text-gray-400 dark:text-gray-600">
                      Page {pageNum}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-20">
              <p className="text-xl">Select a chapter to start writing...</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
