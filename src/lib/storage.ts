import { Project, Chapter } from '@/types';

const STORAGE_KEYS = {
  PROJECTS: 'kalligram_projects',
  CHAPTERS: 'kalligram_chapters',
  CURRENT_PROJECT: 'kalligram_current_project',
  CURRENT_USER: 'kalligram_current_user'
};

// Projects
export const projectStorage = {
  getAll(): Project[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  },

  getById(id: string): Project | null {
    const projects = this.getAll();
    return projects.find(p => p.id === id) || null;
  },

  create(title: string, description?: string, settings?: { page_size?: 'A4' | 'A3'; orientation?: 'portrait' | 'landscape' }): Project {
    const project: Project = {
      id: Date.now().toString(),
      user_id: 'local_user',
      title,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      chapter_count: 0,
      page_size: settings?.page_size || 'A4',
      orientation: settings?.orientation || 'portrait'
    };

    const projects = this.getAll();
    projects.push(project);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return project;
  },

  update(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getAll();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) return null;

    projects[index] = {
      ...projects[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return projects[index];
  },

  delete(id: string): boolean {
    const projects = this.getAll();
    const filtered = projects.filter(p => p.id !== id);
    
    if (filtered.length === projects.length) return false;

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
    
    // Also delete all chapters for this project
    chapterStorage.deleteByProject(id);
    return true;
  }
};

// Chapters
export const chapterStorage = {
  getAll(): Chapter[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
    return data ? JSON.parse(data) : [];
  },

  getByProject(projectId: string): Chapter[] {
    return this.getAll()
      .filter(c => c.project_id === projectId)
      .sort((a, b) => a.order_index - b.order_index);
  },

  getById(id: string): Chapter | null {
    const chapters = this.getAll();
    return chapters.find(c => c.id === id) || null;
  },

  create(projectId: string, title: string, content: string = '', orderIndex: number): Chapter {
    const chapter: Chapter = {
      id: Date.now().toString(),
      project_id: projectId,
      title,
      content,
      order_index: orderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const chapters = this.getAll();
    chapters.push(chapter);
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));

    // Update project chapter count
    const project = projectStorage.getById(projectId);
    if (project) {
      projectStorage.update(projectId, { 
        chapter_count: (project.chapter_count || 0) + 1 
      });
    }

    return chapter;
  },

  update(id: string, updates: Partial<Chapter>): Chapter | null {
    const chapters = this.getAll();
    const index = chapters.findIndex(c => c.id === id);
    
    if (index === -1) return null;

    chapters[index] = {
      ...chapters[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));

    // Update project's updated_at
    if (chapters[index].project_id) {
      projectStorage.update(chapters[index].project_id, {});
    }

    return chapters[index];
  },

  updateOrder(updates: Array<{ id: string; order_index: number }>): boolean {
    const chapters = this.getAll();
    
    updates.forEach(update => {
      const index = chapters.findIndex(c => c.id === update.id);
      if (index !== -1) {
        chapters[index].order_index = update.order_index;
        chapters[index].updated_at = new Date().toISOString();
      }
    });

    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
    return true;
  },

  delete(id: string): boolean {
    const chapters = this.getAll();
    const chapter = chapters.find(c => c.id === id);
    const filtered = chapters.filter(c => c.id !== id);
    
    if (filtered.length === chapters.length) return false;

    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(filtered));

    // Update project chapter count
    if (chapter) {
      const project = projectStorage.getById(chapter.project_id);
      if (project && project.chapter_count) {
        projectStorage.update(chapter.project_id, { 
          chapter_count: project.chapter_count - 1 
        });
      }
    }

    return true;
  },

  deleteByProject(projectId: string): void {
    const chapters = this.getAll();
    const filtered = chapters.filter(c => c.project_id !== projectId);
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(filtered));
  }
};

// Current project tracking
export const currentProjectStorage = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);
  },

  set(projectId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, projectId);
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
  }
};

// File Import/Export
export const fileStorage = {
  // Import text file
  async importFile(): Promise<{ content: string; fileName: string } | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt,.md,.doc,.docx,.rtf';
      
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const content = await file.text();
          resolve({ content, fileName: file.name });
        } catch (error) {
          console.error('Error reading file:', error);
          resolve(null);
        }
      };

      input.click();
    });
  },

  // Export chapter as text file
  exportChapter(chapter: Chapter, format: 'txt' | 'md' = 'txt'): void {
    const content = this.stripHtml(chapter.content);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chapter.title}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Export project as PDF
  exportProjectAsPDF(project: Project, chapters: Chapter[]): void {
    // Create a simple HTML structure for PDF
    let html = `
      <html>
        <head>
          <style>
            body { font-family: 'Georgia', serif; line-height: 1.8; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; font-size: 32px; margin-bottom: 10px; }
            .subtitle { text-align: center; color: #666; margin-bottom: 40px; }
            h2 { font-size: 24px; margin-top: 40px; margin-bottom: 20px; page-break-before: always; }
            p { margin-bottom: 16px; text-align: justify; }
          </style>
        </head>
        <body>
          <h1>${project.title}</h1>
          ${project.description ? `<p class="subtitle">${project.description}</p>` : ''}
    `;

    chapters.forEach((chapter) => {
      html += `<h2>${chapter.title}</h2>`;
      html += this.stripHtml(chapter.content).split('\n').map(p => `<p>${p}</p>`).join('');
    });

    html += '</body></html>';

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  },

  // Export entire project as single file
  exportProject(project: Project, chapters: Chapter[], format: 'txt' | 'md' = 'txt'): void {
    let content = `${project.title}\n${'='.repeat(project.title.length)}\n\n`;
    
    if (project.description) {
      content += `${project.description}\n\n`;
    }

    chapters.forEach((chapter, index) => {
      content += `\n\n${format === 'md' ? '##' : ''} ${chapter.title}\n`;
      content += `${format === 'md' ? '' : '-'.repeat(chapter.title.length)}\n\n`;
      content += this.stripHtml(chapter.content);
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Strip HTML tags from content
  stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
};
