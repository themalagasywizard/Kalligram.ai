'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { ChapterSidebar } from '@/components/sidebar/ChapterSidebar';
import { Editor } from '@/components/editor/Editor';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { projectStorage, chapterStorage, currentProjectStorage, fileStorage } from '@/lib/storage';
import { Chapter } from '@/types';
import { ExportDialog } from '@/components/dialogs/ExportDialog';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { NewProjectDialog } from '@/components/dialogs/NewProjectDialog';

function EditorPageContent() {
  const {
    currentProject,
    currentChapter,
    chapterCache,
    isDirty,
    setCurrentProject,
    setCurrentChapter,
    updateChapterCache,
    removeFromChapterCache,
    setIsDirty
  } = useApp();

  const [isAIOpen, setIsAIOpen] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  // Load project and chapters on mount
  useEffect(() => {
    const lastProjectId = currentProjectStorage.get();
    if (lastProjectId) {
      const project = projectStorage.getById(lastProjectId);
      if (project) {
        setCurrentProject(project);
        const projectChapters = chapterStorage.getByProject(lastProjectId);
        setChapters(projectChapters);
        projectChapters.forEach(ch => updateChapterCache(ch.id, ch));
      }
    } else {
      // Create a demo project for first-time users
      const existingProjects = projectStorage.getAll();
      if (existingProjects.length === 0) {
        const demoProject = projectStorage.create('My First Story', 'Start writing your story here');
        const demoChapter = chapterStorage.create(demoProject.id, 'Chapter 1: The Beginning', '<p>Once upon a time...</p>', 0);
        setCurrentProject(demoProject);
        setChapters([demoChapter]);
        updateChapterCache(demoChapter.id, demoChapter);
        currentProjectStorage.set(demoProject.id);
        toast.success('Welcome! A demo project has been created for you.');
      }
    }
  }, [setCurrentProject, updateChapterCache]);

  const handleSave = useCallback(async () => {
    if (!currentChapter) return;
    
    try {
      // Get current content from editor
      const editorElement = document.querySelector('[contenteditable]') as HTMLElement;
      const content = editorElement?.innerHTML || currentChapter.content;
      
      const updated = chapterStorage.update(currentChapter.id, { content });
      if (updated) {
        updateChapterCache(updated.id, updated);
        setCurrentChapter(updated);
        toast.success('Chapter saved successfully');
        setIsDirty(false);
      }
    } catch (error) {
      toast.error('Failed to save chapter');
    }
  }, [currentChapter, setIsDirty, updateChapterCache, setCurrentChapter]);

  const handleSelectChapter = useCallback((chapterId: string) => {
    const chapter = chapterCache.get(chapterId);
    if (chapter) {
      setCurrentChapter(chapter);
    }
  }, [chapterCache, setCurrentChapter]);

  const handleAddChapter = useCallback(async () => {
    if (!currentProject) {
      toast.error('Please create a project first');
      return;
    }

    try {
      const newChapter = chapterStorage.create(
        currentProject.id,
        `Chapter ${chapters.length + 1}`,
        '',
        chapters.length
      );

      setChapters(prev => [...prev, newChapter]);
      updateChapterCache(newChapter.id, newChapter);
      toast.success('Chapter added');
    } catch (error) {
      toast.error('Failed to add chapter');
    }
  }, [currentProject, chapters, updateChapterCache]);

  const handleRenameChapter = useCallback(async (chapterId: string, newTitle: string) => {
    try {
      const updated = chapterStorage.update(chapterId, { title: newTitle });
      if (updated) {
        updateChapterCache(chapterId, updated);
        setChapters(prev => prev.map(c => c.id === chapterId ? updated : c));
        if (currentChapter?.id === chapterId) {
          setCurrentChapter(updated);
        }
        toast.success('Chapter renamed');
      }
    } catch (error) {
      toast.error('Failed to rename chapter');
    }
  }, [updateChapterCache, currentChapter, setCurrentChapter]);

  const handleDeleteChapter = useCallback(async (chapterId: string) => {
    try {
      chapterStorage.delete(chapterId);
      setChapters(prev => prev.filter(c => c.id !== chapterId));
      removeFromChapterCache(chapterId);
      if (currentChapter?.id === chapterId) {
        setCurrentChapter(null);
      }
      toast.success('Chapter deleted');
    } catch (error) {
      toast.error('Failed to delete chapter');
    }
  }, [currentChapter, removeFromChapterCache, setCurrentChapter]);

  const handleReorderChapters = useCallback(async (updates: Array<{ id: string; order_index: number }>) => {
    try {
      chapterStorage.updateOrder(updates);
      const reordered = [...chapters].sort((a, b) => {
        const aIndex = updates.find(u => u.id === a.id)?.order_index ?? a.order_index;
        const bIndex = updates.find(u => u.id === b.id)?.order_index ?? b.order_index;
        return aIndex - bIndex;
      });
      setChapters(reordered);
      toast.success('Chapters reordered');
    } catch (error) {
      toast.error('Failed to reorder chapters');
    }
  }, [chapters]);

  const handleImportFile = useCallback(async () => {
    if (!currentProject) {
      toast.error('Please create a project first');
      return;
    }

    try {
      const result = await fileStorage.importFile();
      if (result) {
        const newChapter = chapterStorage.create(
          currentProject.id,
          result.fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
          result.content,
          chapters.length
        );
        setChapters(prev => [...prev, newChapter]);
        updateChapterCache(newChapter.id, newChapter);
        setCurrentChapter(newChapter);
        toast.success(`Imported ${result.fileName}`);
      }
    } catch (error) {
      toast.error('Failed to import file');
    }
  }, [currentProject, chapters, updateChapterCache, setCurrentChapter]);

  const handleInsertText = useCallback((text: string) => {
    if (!currentChapter) {
      toast.error('Please select a chapter first');
      return;
    }

    // Send to TipTap via custom event
    window.dispatchEvent(new CustomEvent('editor-insert-text', { detail: { text } }));
    setIsDirty(true);
    toast.success('Text inserted into editor');
  }, [currentChapter, setIsDirty]);

  const handleExportProject = useCallback(() => {
    if (!currentProject) {
      toast.error('No project to export');
      return;
    }
    setExportDialogOpen(true);
  }, [currentProject]);

  // Auto-save effect
  useEffect(() => {
    if (!isDirty || !currentChapter) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [isDirty, currentChapter, handleSave]);

  const handleExportWithFormat = useCallback((format: 'pdf' | 'txt') => {
    if (!currentProject) return;

    try {
      if (format === 'pdf') {
        fileStorage.exportProjectAsPDF(currentProject, chapters);
        toast.success('Opening PDF print dialog...');
      } else {
        fileStorage.exportProject(currentProject, chapters, 'txt');
        toast.success('Project exported as text file');
      }
    } catch (error) {
      toast.error('Failed to export project');
    }
  }, [currentProject, chapters]);

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col">
        <AppHeader
          onSave={handleSave}
          onLoadProject={() => toast.info('Load project dialog (to implement)')}
          onNewProject={() => setNewProjectOpen(true)}
          onImportFile={handleImportFile}
          onExportProject={handleExportProject}
          onOpenSettings={() => setSettingsDialogOpen(true)}
          onToggleAI={() => setIsAIOpen(!isAIOpen)}
          isAIOpen={isAIOpen}
        />

        <div className="flex-1 flex overflow-hidden">
          <ChapterSidebar
            chapters={chapters}
            currentChapterId={currentChapter?.id}
            currentChapterContent={currentChapter?.content || ''}
            onSelectChapter={handleSelectChapter}
            onAddChapter={handleAddChapter}
            onRenameChapter={handleRenameChapter}
            onDeleteChapter={handleDeleteChapter}
            onReorderChapters={handleReorderChapters}
          />

          <main className="flex-1 overflow-hidden">
            <Editor />
          </main>

          <AIAssistant
            isOpen={isAIOpen}
            onClose={() => setIsAIOpen(false)}
            onInsertText={handleInsertText}
          />
        </div>

        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          onExport={handleExportWithFormat}
          projectTitle={currentProject?.title || 'Project'}
        />

        <SettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
        />

        <NewProjectDialog
          open={newProjectOpen}
          onOpenChange={setNewProjectOpen}
          onCreate={({ title, description, page_size, orientation }) => {
            const project = projectStorage.create(title, description, { page_size, orientation });
            setCurrentProject(project);
            currentProjectStorage.set(project.id);
            const firstChapter = chapterStorage.create(project.id, 'Page 1', '', 0);
            setChapters([firstChapter]);
            updateChapterCache(firstChapter.id, firstChapter);
            setCurrentChapter(firstChapter);
            toast.success('Project created');
          }}
        />
      </div>
    </TooltipProvider>
  );
}

export default function EditorPage() {
  return (
    <AppProvider>
      <EditorPageContent />
    </AppProvider>
  );
}
