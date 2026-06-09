/**
 * API Service Layer
 * Handles all communication with the backend API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'An error occurred');
        }

        return result;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

/**
 * Health check
 */
export async function checkHealth() {
    return fetchAPI('/health');
}

// --- TASKS ---

/**
 * Get all tasks with optional filters
 * @param {Object} filters - { status: string, priority: string }
 */
export async function getAllTasks(filters = {}, token) {
    const queryParams = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== '')
    ).toString();

    const endpoint = `/tasks${queryParams ? '?' + queryParams : ''}`;
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // Note: The original generic getAllTasks didn't take a token, but the page.js calls fetch directly with token.
    // We should probably update this to accept token or use a unified method if we refactor.
    // For now, mirroring the usage pattern or enhancing it.
    // The previous file content showed getAllTasks uses fetchAPI which lacks token injection logic 
    // unless passed in options, but the function signature didn't take token.
    // I will add token as last argument (optional for backward compat if any) and add to headers.

    return (await fetchAPI(endpoint, { headers })).data;
}

/**
 * Get task by ID
 * @param {string} id - Task ID
 */
export async function getTaskById(id, token) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return (await fetchAPI(`/tasks/${id}`, { headers })).data;
}

/**
 * Create a new task
 * @param {Object} taskData - { title, description, status, priority }
 */
export async function createTask(taskData, token) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const result = await fetchAPI('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
        headers
    });
    return result.data;
}

/**
 * Update an existing task
 * @param {string} id - Task ID
 * @param {Object} updates - Fields to update
 */
export async function updateTask(id, updates, token) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const result = await fetchAPI(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers
    });
    return result.data;
}

/**
 * Delete a task
 * @param {string} id - Task ID
 */
export async function deleteTask(id, token) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const result = await fetchAPI(`/tasks/${id}`, {
        method: 'DELETE',
        headers
    });
    return result;
}

/**
 * Get task statistics
 */
export async function getTaskStats(token) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return (await fetchAPI('/tasks/stats', { headers })).data;
}

// --- DOCUMENTS ---

export async function getAllDocuments(filters = {}, token) {
    const queryParams = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== '')
    ).toString();
    const endpoint = `/documents${queryParams ? '?' + queryParams : ''}`;
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return (await fetchAPI(endpoint, { headers })).data;
}

export async function createDocument(docData, token) {
    console.log('API createDocument called with:', {
        docData: JSON.stringify(docData),
        hasToken: !!token
    });

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const requestBody = JSON.stringify(docData);

    console.log('Request body string:', requestBody);
    console.log('Request headers:', headers);

    const result = await fetchAPI('/documents', {
        method: 'POST',
        body: requestBody,
        headers
    });
    return result.data;
}

export async function getDocumentById(id, token) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return (await fetchAPI(`/documents/${id}`, { headers })).data;
}

export async function updateDocument(id, docData, token) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const result = await fetchAPI(`/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(docData),
        headers
    });
    return result.data;
}


export async function deleteDocument(id, token) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return await fetchAPI(`/documents/${id}`, {
        method: 'DELETE',
        headers
    });
}

export async function getStorageInsights(token) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return (await fetchAPI('/documents/insights', { headers })).data;
}

export async function toggleDocumentStar(id, isStarred, token) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return await fetchAPI(`/documents/${id}/star`, {
        method: 'PUT',
        body: JSON.stringify({ isStarred }),
        headers
    });
}


// --- CALENDAR ---

export async function getEvents(filters = {}, token) {
    const queryParams = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== '')
    ).toString();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return (await fetchAPI(`/calendar/events?${queryParams}`, { headers })).data;
}

export async function createEvent(eventData, token) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const result = await fetchAPI('/calendar/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
        headers
    });
    return result.data;
}

export async function deleteEvent(id, token) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return await fetchAPI(`/calendar/events/${id}`, {
        method: 'DELETE',
        headers
    });
}

export async function getSchedulingSuggestions(params, token) {
    const queryParams = new URLSearchParams(params).toString();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    return (await fetchAPI(`/calendar/suggest-slots?${queryParams}`, { headers })).data;
}

