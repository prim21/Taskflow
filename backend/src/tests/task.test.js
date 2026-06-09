const request = require('supertest');
const app = require('../app');

/**
 * Task API Tests
 * Run with: npm test
 */

describe('Task API Endpoints', () => {
    let createdTaskId;

    // Test health check
    describe('GET /api/health', () => {
        it('should return server health status', async () => {
            const res = await request(app).get('/api/health');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    // Test create task
    describe('POST /api/tasks', () => {
        it('should create a new task', async () => {
            const taskData = {
                title: 'Test Task',
                description: 'This is a test task',
                status: 'todo',
                priority: 'high',
            };

            const res = await request(app)
                .post('/api/tasks')
                .send(taskData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.title).toBe(taskData.title);

            createdTaskId = res.body.data.id;
        });

        it('should fail without required fields', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({});

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    // Test get all tasks
    describe('GET /api/tasks', () => {
        it('should get all tasks', async () => {
            const res = await request(app).get('/api/tasks');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should filter tasks by status', async () => {
            const res = await request(app).get('/api/tasks?status=todo');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    // Test get task by ID
    describe('GET /api/tasks/:id', () => {
        it('should get a task by ID', async () => {
            const res = await request(app).get(`/api/tasks/${createdTaskId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(createdTaskId);
        });

        it('should return 404 for non-existent task', async () => {
            const res = await request(app).get('/api/tasks/nonexistent');

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    // Test update task
    describe('PUT /api/tasks/:id', () => {
        it('should update a task', async () => {
            const updateData = {
                title: 'Updated Task',
                status: 'blocked',
            };

            const res = await request(app)
                .put(`/api/tasks/${createdTaskId}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe(updateData.title);
            expect(res.body.data.status).toBe(updateData.status);
        });
    });

    // Test get statistics
    describe('GET /api/tasks/stats', () => {
        it('should get task statistics', async () => {
            const res = await request(app).get('/api/tasks/stats');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('total');
            expect(res.body.data).toHaveProperty('byStatus');
            expect(res.body.data).toHaveProperty('byPriority');
        });
    });

    // Test delete task
    describe('DELETE /api/tasks/:id', () => {
        it('should delete a task', async () => {
            const res = await request(app).delete(`/api/tasks/${createdTaskId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 404 when deleting non-existent task', async () => {
            const res = await request(app).delete(`/api/tasks/${createdTaskId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });
});
