'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Save, FolderOpen, Plus, Moon, Sun, Bot, User, LogOut, Feather, Upload, Download, Settings, MoreVertical } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useApp } from '@/contexts/AppContext';

interface AppHeaderProps {
  onSave: () => void;
  onLoadProject: () => void;
  onNewProject: () => void;
  onToggleAI: () => void;
  onImportFile?: () => void;
  onExportProject?: () => void;
  onOpenSettings?: () => void;
  isAIOpen: boolean;
}

export function AppHeader({
  onSave,
  onLoadProject,
  onNewProject,
  onToggleAI,
  onImportFile,
  onExportProject,
  onOpenSettings,
  isAIOpen
}: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { currentProject, isDirty } = useApp();

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="/Logo.png" alt="Kalligram" className="h-10 w-10" />
          <h1 className="text-xl font-semibold hidden md:block">Kalligram</h1>
        </div>
        {currentProject && (
          <div className="ml-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium">{currentProject.title}</h2>
              {isDirty && (
                <span className="text-xs text-muted-foreground">• Saving...</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Last edited: {new Date(currentProject.updated_at).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* File Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              {isDirty ? 'Save*' : 'Save'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLoadProject}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Load Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewProject}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onImportFile && (
              <DropdownMenuItem onClick={onImportFile}>
                <Upload className="h-4 w-4 mr-2" />
                Import File
              </DropdownMenuItem>
            )}
            {onExportProject && (
              <DropdownMenuItem onClick={onExportProject}>
                <Download className="h-4 w-4 mr-2" />
                Export Project
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={onToggleAI}
          variant={isAIOpen ? "secondary" : "ghost"}
          size="icon"
        >
          <Bot className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          variant="ghost"
          size="icon"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
              <Avatar>
                <AvatarImage src="https://ui-avatars.com/api/?name=U&background=000&color=fff" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            {onOpenSettings && (
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
