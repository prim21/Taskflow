const { db } = require('../config/firebaseconfig');
const logger = require('../utils/logger');

/**
 * Task Service
 * Business logic for task operations using Firebase Firestore
 */

const COLLECTION_NAME = 'tasks';

class TaskService {
    // Get all tasks
    static async getAllTasks(filters = {}) {
        try {
            let query = db.collection(COLLECTION_NAME);

            // strict equality filters (db level)
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            if (filters.priority) {
                query = query.where('priority', '==', filters.priority);
            }
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            if (filters.workspaceId) {
                query = query.where('workspaceId', '==', filters.workspaceId);
            }
            if (filters.ownerId) {
                query = query.where('ownerId', '==', filters.ownerId);
            }
            if (filters.projectId && filters.projectId !== 'null') {
                query = query.where('projectId', '==', filters.projectId);
            }

            const snapshot = await query.get();
            let tasks = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                // Filter for 'null' projectId in memory to handle missing fields
                if (filters.projectId === 'null') {
                    if (data.projectId) return; // Skip if it has a project ID
                }

                tasks.push({
                    id: doc.id,
                    ...data,
                });
            });

            // Text Search (in-memory)
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                tasks = tasks.filter(task =>
                    task.title.toLowerCase().includes(searchLower) ||
                    (task.description && task.description.toLowerCase().includes(searchLower))
                );
            }

            // Sorting
            if (filters.sortBy) {
                const { sortBy, sortOrder = 'asc' } = filters;
                tasks.sort((a, b) => {
                    let valA = a[sortBy];
                    let valB = b[sortBy];

                    // Handle null/undefined
                    if (!valA) return 1;
                    if (!valB) return -1;

                    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                    return 0;
                });
            } else {
                // Default: Sort by priority order (high, medium, low) then by priority number
                tasks.sort((a, b) => {
                    if (a.priorityOrder !== b.priorityOrder) {
                        return a.priorityOrder - b.priorityOrder;
                    }
                    return a.priorityNumber - b.priorityNumber;
                });
            }

            return tasks;
        } catch (error) {
            logger.error('Error in getAllTasks:', error);
            throw error;
        }
    }

    // Get task by ID
    static async getTaskById(id) {
        try {
            const docRef = db.collection(COLLECTION_NAME).doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Task not found');
            }

            return {
                id: doc.id,
                ...doc.data(),
            };
        } catch (error) {
            logger.error('Error in getTaskById:', error);
            throw error;
        }
    }

    // Create new task
    static async createTask(taskData) {
        try {
            // Get count of existing tasks with the same priority for THIS USER
            const priorityQuery = await db.collection(COLLECTION_NAME)
                .where('priority', '==', taskData.priority || 'medium')
                .where('ownerId', '==', taskData.ownerId) // Filter by owner
                .get();

            const priorityCount = priorityQuery.size + 1;
            const priority = taskData.priority || 'medium';

            // Priority sorting order for easy filtering
            const priorityOrder = {
                'high': 1,
                'medium': 2,
                'low': 3
            };

            const newTask = {
                // Core task data
                title: taskData.title,
                description: taskData.description || '',
                status: taskData.status || 'todo',
                priority: priority,
                dueDate: taskData.dueDate || null,
                category: taskData.category || 'General',
                workspaceId: taskData.workspaceId || null,
                projectId: taskData.projectId || null, // Added projectId
                ownerId: taskData.ownerId,
                subtasks: taskData.subtasks || [], // Added subtasks support

                // Organizational metadata for easy monitoring
                priorityNumber: priorityCount,
                priorityOrder: priorityOrder[priority],
                displayName: `${priority.toUpperCase()} #${priorityCount}: ${taskData.title}`,

                // Timestamps
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Use add() to generate a unique ID
            const docRef = await db.collection(COLLECTION_NAME).add(newTask);

            return {
                id: docRef.id,
                ...newTask,
            };
        } catch (error) {
            logger.error('Error in createTask:', error);
            throw error;
        }
    }

    // Update task
    static async updateTask(id, updateData) {
        try {
            const docRef = db.collection(COLLECTION_NAME).doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Task not found');
            }

            const updatedData = {
                ...updateData,
                updatedAt: new Date().toISOString(),
            };

            await docRef.update(updatedData);

            const updatedDoc = await docRef.get();
            return {
                id: updatedDoc.id,
                ...updatedDoc.data(),
            };
        } catch (error) {
            logger.error('Error in updateTask:', error);
            throw error;
        }
    }

    // Delete task
    static async deleteTask(id) {
        try {
            const docRef = db.collection(COLLECTION_NAME).doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Task not found');
            }

            const taskData = {
                id: doc.id,
                ...doc.data(),
            };

            await docRef.delete();
            return taskData;
        } catch (error) {
            logger.error('Error in deleteTask:', error);
            throw error;
        }
    }

    // Get task statistics
    static async getTaskStats() {
        try {
            const snapshot = await db.collection(COLLECTION_NAME).get();
            const tasks = [];

            snapshot.forEach(doc => {
                tasks.push(doc.data());
            });

            return {
                total: tasks.length,
                byStatus: {
                    todo: tasks.filter(t => t.status === 'todo').length,
                    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
                    'in-review': tasks.filter(t => t.status === 'in-review').length,
                    blocked: tasks.filter(t => t.status === 'blocked').length,
                    completed: tasks.filter(t => t.status === 'completed' || t.status === 'done').length, // Legacy support
                },
                byPriority: {
                    low: tasks.filter(t => t.priority === 'low').length,
                    medium: tasks.filter(t => t.priority === 'medium').length,
                    high: tasks.filter(t => t.priority === 'high').length,
                },
            };
        } catch (error) {
            logger.error('Error in getTaskStats:', error);
            throw error;
        }
    }
}

module.exports = TaskService;
