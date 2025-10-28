// lib/local-storage.js
// Local storage-based authentication and database replacement for Supabase

// Helper function to generate unique IDs
function generateId() {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

// Helper function to get current user
function getCurrentUser() {
  const userJson = localStorage.getItem('currentUser');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

// Helper function to set current user
function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
  } else {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
  }
}

// Get data from localStorage
function getStorageData(key) {
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Set data to localStorage
function setStorageData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Export auth functions
export const auth = {
  signUp: async (email, password) => {
    try {
      // Check if user already exists
      const users = getStorageData('users');
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        return { 
          data: null, 
          error: { message: 'User already exists' }
        };
      }

      // Create new user
      const user = {
        id: generateId(),
        email: email,
        created_at: new Date().toISOString()
      };

      // Save user
      users.push(user);
      setStorageData('users', users);

      // Auto sign in
      setCurrentUser(user);

      return { 
        data: { user, session: { user, access_token: 'mock-token' } }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  signIn: async (email, password) => {
    try {
      // Accept any credentials - create user if doesn't exist
      let users = getStorageData('users');
      let user = users.find(u => u.email === email);
      
      if (!user) {
        // Create new user on the fly
        user = {
          id: generateId(),
          email: email,
          created_at: new Date().toISOString()
        };
        users.push(user);
        setStorageData('users', users);
      }

      // Set as current user
      setCurrentUser(user);

      return { 
        data: { user, session: { user, access_token: 'mock-token' } }, 
        error: null 
      };
    } catch (error) {
      return { data: { user: null }, error };
    }
  },

  signOut: async () => {
    setCurrentUser(null);
    return { error: null };
  },

  getUser: async () => {
    const user = getCurrentUser();
    return { data: { user }, error: null };
  },

  getSession: async () => {
    const user = getCurrentUser();
    const session = user ? { user, access_token: 'mock-token' } : null;
    return { data: { session }, error: null };
  }
};

// Export database functions
export const db = {
  from: (table) => {
    return {
      select: (columns = '*') => {
        const query = { table, columns, filters: [] };
        
        const builder = {
          eq: (column, value) => {
            query.filters.push({ column, operator: 'eq', value });
            return builder;
          },
          order: (column, options = {}) => {
            query.order = { column, ascending: options.ascending !== false };
            return builder;
          },
          single: () => {
            query.single = true;
            return builder;
          },
          then: (resolve) => {
            return executeQuery(query).then(resolve);
          }
        };
        
        return builder;
      },
      insert: (data) => {
        return executeInsert(table, data);
      },
      update: (data) => {
        return {
          eq: (column, value) => executeUpdate(table, data, column, value),
          select: () => ({ then: (resolve) => resolve({ data: [data], error: null }) })
        };
      },
      delete: () => {
        return {
          eq: (column, value) => executeDelete(table, column, value)
        };
      }
    };
  }
};

// Execute query operations
function executeQuery(query) {
  return new Promise((resolve) => {
    const data = getStorageData(query.table);
    let result = [...data];

    // Apply filters
    query.filters.forEach(filter => {
      if (filter.operator === 'eq') {
        result = result.filter(item => item[filter.column] === filter.value);
      }
    });

    // Apply sorting
    if (query.order) {
      result.sort((a, b) => {
        const aVal = a[query.order.column];
        const bVal = b[query.order.column];
        if (aVal < bVal) return query.order.ascending ? -1 : 1;
        if (aVal > bVal) return query.order.ascending ? 1 : -1;
        return 0;
      });
    }

    // Return single or array
    const finalResult = query.single ? (result[0] || null) : result;
    resolve({ data: finalResult, error: null });
  });
}

function executeInsert(table, data) {
  return new Promise((resolve) => {
    const tableData = getStorageData(table);
    const newItems = Array.isArray(data) ? data : [data];
    
    const itemsWithIds = newItems.map(item => ({
      ...item,
      id: item.id || generateId()
    }));
    
    tableData.push(...itemsWithIds);
    setStorageData(table, tableData);
    
    resolve({ 
      data: itemsWithIds, 
      error: null,
      select: () => ({ then: (res) => res({ data: itemsWithIds, error: null }) })
    });
  });
}

function executeUpdate(table, updates, column, value) {
  return new Promise((resolve) => {
    const tableData = getStorageData(table);
    const updatedItems = [];
    
    const newData = tableData.map(item => {
      if (item[column] === value) {
        const updated = { ...item, ...updates };
        updatedItems.push(updated);
        return updated;
      }
      return item;
    });
    
    setStorageData(table, newData);
    resolve({ 
      data: updatedItems, 
      error: null,
      select: () => ({ then: (res) => res({ data: updatedItems, error: null }) })
    });
  });
}

function executeDelete(table, column, value) {
  return new Promise((resolve) => {
    const tableData = getStorageData(table);
    const newData = tableData.filter(item => item[column] !== value);
    setStorageData(table, newData);
    resolve({ data: null, error: null });
  });
}

// Project Management
export const projects = {
  getAll: async () => {
    try {
      const user = getCurrentUser();
      if (!user) return { data: null, error: new Error('User not authenticated') };

      const allProjects = getStorageData('projects');
      const userProjects = allProjects.filter(p => p.user_id === user.id);
      userProjects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      return { data: userProjects, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  getById: async (projectId) => {
    try {
      const allProjects = getStorageData('projects');
      const project = allProjects.find(p => p.id === projectId);
      return { data: project || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  create: async (title, description = '') => {
    try {
      const user = getCurrentUser();
      if (!user) return { data: null, error: new Error('User not authenticated') };

      const newProject = {
        id: generateId(),
        user_id: user.id,
        title,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const projects = getStorageData('projects');
      projects.push(newProject);
      setStorageData('projects', projects);

      return { data: [newProject], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  update: async (projectId, updates) => {
    try {
      const projects = getStorageData('projects');
      const index = projects.findIndex(p => p.id === projectId);
      
      if (index === -1) {
        return { data: null, error: new Error('Project not found') };
      }

      projects[index] = {
        ...projects[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      setStorageData('projects', projects);
      return { data: [projects[index]], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  delete: async (projectId) => {
    try {
      const projects = getStorageData('projects');
      const filtered = projects.filter(p => p.id !== projectId);
      setStorageData('projects', filtered);
      
      // Also delete related chapters, characters, etc.
      ['chapters', 'characters', 'locations', 'timeline_events'].forEach(table => {
        const data = getStorageData(table);
        const filtered = data.filter(item => item.project_id !== projectId);
        setStorageData(table, filtered);
      });
      
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};

// Chapter Management
export const chapters = {
  getByProject: async (projectId) => {
    try {
      const allChapters = getStorageData('chapters');
      const projectChapters = allChapters.filter(c => c.project_id === projectId);
      projectChapters.sort((a, b) => a.order_index - b.order_index);
      return { data: projectChapters, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  getById: async (chapterId) => {
    try {
      const allChapters = getStorageData('chapters');
      const chapter = allChapters.find(c => c.id === chapterId);
      return { data: chapter || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  create: async (projectId, title, content = '', orderIndex = 0) => {
    try {
      const newChapter = {
        id: generateId(),
        project_id: projectId,
        title,
        content,
        order_index: orderIndex,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const chapters = getStorageData('chapters');
      chapters.push(newChapter);
      setStorageData('chapters', chapters);

      return { data: [newChapter], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  update: async (chapterId, updates) => {
    try {
      const chapters = getStorageData('chapters');
      const index = chapters.findIndex(c => c.id === chapterId);
      
      if (index === -1) {
        return { data: null, error: new Error('Chapter not found') };
      }

      chapters[index] = {
        ...chapters[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      setStorageData('chapters', chapters);
      return { data: [chapters[index]], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  updateOrder: async (chaptersArray) => {
    try {
      const allChapters = getStorageData('chapters');
      
      chaptersArray.forEach(updatedChapter => {
        const index = allChapters.findIndex(c => c.id === updatedChapter.id);
        if (index !== -1) {
          allChapters[index].order_index = updatedChapter.order_index;
          allChapters[index].updated_at = new Date().toISOString();
        }
      });

      setStorageData('chapters', allChapters);
      return { data: chaptersArray, error: null };
    } catch (error) {
      return { error };
    }
  },

  delete: async (chapterId) => {
    try {
      const chapters = getStorageData('chapters');
      const filtered = chapters.filter(c => c.id !== chapterId);
      setStorageData('chapters', filtered);
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};

// Character Management
export const characters = {
  getByProject: async (projectId) => {
    const allCharacters = getStorageData('characters');
    const projectCharacters = allCharacters.filter(c => c.project_id === projectId);
    projectCharacters.sort((a, b) => a.name.localeCompare(b.name));
    return { data: projectCharacters, error: null };
  },

  getById: async (characterId) => {
    const allCharacters = getStorageData('characters');
    const character = allCharacters.find(c => c.id === characterId);
    return { data: character || null, error: null };
  },

  create: async (projectId, name, role, traits = '', backstory = '') => {
    const newCharacter = {
      id: generateId(),
      project_id: projectId,
      name,
      role,
      traits,
      backstory,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const characters = getStorageData('characters');
    characters.push(newCharacter);
    setStorageData('characters', characters);

    return { data: [newCharacter], error: null };
  },

  update: async (characterId, updates) => {
    const characters = getStorageData('characters');
    const index = characters.findIndex(c => c.id === characterId);
    
    if (index === -1) {
      return { data: null, error: new Error('Character not found') };
    }

    characters[index] = {
      ...characters[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    setStorageData('characters', characters);
    return { data: [characters[index]], error: null };
  },

  delete: async (characterId) => {
    const characters = getStorageData('characters');
    const filtered = characters.filter(c => c.id !== characterId);
    setStorageData('characters', filtered);
    return { data: null, error: null };
  },

  getRelationships: async (characterId) => {
    const allRelationships = getStorageData('character_relationships');
    const relationships = allRelationships.filter(r => r.character_id === characterId);
    return { data: relationships, error: null };
  },

  createRelationship: async (characterId, relatedCharacterId, relationshipType) => {
    const newRelationship = {
      id: generateId(),
      character_id: characterId,
      related_character_id: relatedCharacterId,
      relationship_type: relationshipType,
      created_at: new Date().toISOString()
    };

    const relationships = getStorageData('character_relationships');
    relationships.push(newRelationship);
    setStorageData('character_relationships', relationships);

    return { data: [newRelationship], error: null };
  },

  deleteRelationship: async (relationshipId) => {
    const relationships = getStorageData('character_relationships');
    const filtered = relationships.filter(r => r.id !== relationshipId);
    setStorageData('character_relationships', filtered);
    return { data: null, error: null };
  }
};

// Timeline Events Management
export const timelineEvents = {
  getByProject: async (projectId) => {
    const allEvents = getStorageData('timeline_events');
    const projectEvents = allEvents.filter(e => e.project_id === projectId);
    projectEvents.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
    return { data: projectEvents, error: null };
  },

  create: async (projectId, name, dateTime, description, locationId, characterIds) => {
    try {
      const newEvent = {
        id: generateId(),
        project_id: projectId,
        name,
        date_time: dateTime,
        description,
        location_id: locationId
      };

      const events = getStorageData('timeline_events');
      events.push(newEvent);
      setStorageData('timeline_events', events);

      // Handle character links if provided
      if (characterIds && characterIds.length > 0) {
        const eventCharacters = getStorageData('timeline_event_characters');
        characterIds.forEach(characterId => {
          eventCharacters.push({
            id: generateId(),
            event_id: newEvent.id,
            character_id: characterId
          });
        });
        setStorageData('timeline_event_characters', eventCharacters);
      }

      return { data: newEvent, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  update: async (eventId, updates) => {
    const events = getStorageData('timeline_events');
    const index = events.findIndex(e => e.id === eventId);
    
    if (index === -1) {
      return { data: null, error: new Error('Event not found') };
    }

    events[index] = {
      ...events[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    setStorageData('timeline_events', events);
    return { data: [events[index]], error: null };
  },

  delete: async (eventId) => {
    const events = getStorageData('timeline_events');
    const filtered = events.filter(e => e.id !== eventId);
    setStorageData('timeline_events', filtered);
    
    // Also delete character links
    const eventCharacters = getStorageData('timeline_event_characters');
    const filteredLinks = eventCharacters.filter(ec => ec.event_id !== eventId);
    setStorageData('timeline_event_characters', filteredLinks);
    
    return { data: null, error: null };
  },

  updateCharacters: async (eventId, characterIds) => {
    try {
      // Delete existing links
      const eventCharacters = getStorageData('timeline_event_characters');
      const filtered = eventCharacters.filter(ec => ec.event_id !== eventId);
      
      // Add new links
      if (characterIds && characterIds.length > 0) {
        characterIds.forEach(characterId => {
          filtered.push({
            id: generateId(),
            event_id: eventId,
            character_id: characterId
          });
        });
      }
      
      setStorageData('timeline_event_characters', filtered);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
};

// Locations Management
export const locations = {
  getByProject: async (projectId) => {
    const allLocations = getStorageData('locations');
    const projectLocations = allLocations.filter(l => l.project_id === projectId);
    projectLocations.sort((a, b) => a.name.localeCompare(b.name));
    return { data: projectLocations, error: null };
  },

  create: async (projectId, name, type, description = '', keyFeatures = '') => {
    const newLocation = {
      id: generateId(),
      project_id: projectId,
      name,
      type,
      description,
      key_features: keyFeatures,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const locations = getStorageData('locations');
    locations.push(newLocation);
    setStorageData('locations', locations);

    return { data: [newLocation], error: null };
  },

  update: async (locationId, updates) => {
    const locations = getStorageData('locations');
    const index = locations.findIndex(l => l.id === locationId);
    
    if (index === -1) {
      return { data: null, error: new Error('Location not found') };
    }

    locations[index] = {
      ...locations[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    setStorageData('locations', locations);
    return { data: [locations[index]], error: null };
  },

  delete: async (locationId) => {
    const locations = getStorageData('locations');
    const filtered = locations.filter(l => l.id !== locationId);
    setStorageData('locations', filtered);
    return { data: null, error: null };
  }
};

// User Profiles Management
export const profiles = {
  get: async () => {
    try {
      const user = getCurrentUser();
      if (!user) return { data: null, error: new Error('User not authenticated') };

      const profiles = getStorageData('profiles');
      const profile = profiles.find(p => p.id === user.id);
      
      return { data: profile || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  upsert: async (profileData) => {
    try {
      const user = getCurrentUser();
      if (!user) return { data: null, error: new Error('User not authenticated') };

      const profiles = getStorageData('profiles');
      const index = profiles.findIndex(p => p.id === user.id);

      const updatedProfile = {
        ...profileData,
        id: user.id,
        updated_at: new Date().toISOString()
      };

      if (index === -1) {
        updatedProfile.created_at = new Date().toISOString();
        profiles.push(updatedProfile);
      } else {
        profiles[index] = updatedProfile;
      }

      setStorageData('profiles', profiles);
      return { data: [updatedProfile], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  uploadProfilePicture: async (file) => {
    try {
      const user = getCurrentUser();
      if (!user) return { publicUrl: null, error: new Error('User not authenticated') };

      // For local storage, we'll just use a placeholder
      const mockUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.charAt(0))}&background=4B5EAA&color=fff`;
      
      await profiles.upsert({ profile_picture_url: mockUrl });
      
      return { publicUrl: mockUrl, error: null };
    } catch (error) {
      return { publicUrl: null, error };
    }
  }
};
