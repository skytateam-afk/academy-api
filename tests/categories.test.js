/**
 * Category Module Tests
 * Tests for category CRUD operations and hierarchical structure
 */

const request = require('supertest');
const app = require('../server');
const { pool } = require('../config/database');

describe('Category Module', () => {
    let authToken;
    let adminUserId;
    let testCategoryId;
    let childCategoryId;

    // Setup: Create admin user and get auth token
    beforeAll(async () => {
        // Clean up test data
        await pool.query('DELETE FROM categories WHERE name LIKE $1', ['Test Category%']);
        await pool.query('DELETE FROM users WHERE email = $1', ['testadmin_cat@test.com']);
        
        // Create admin user for testing
        const hashedPassword = require('bcrypt').hashSync('Admin123!', 10);
        const userResult = await pool.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, role_id)
             VALUES ($1, $2, $3, $4, $5, (SELECT id FROM roles WHERE name = 'admin' LIMIT 1))
             RETURNING id`,
            ['testadmin_cat', 'testadmin_cat@test.com', hashedPassword, 'Test', 'Admin']
        );
        adminUserId = userResult.rows[0].id;

        // Login to get token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                user: 'testadmin_cat@test.com',
                password: 'Admin123!'
            });

        authToken = loginRes.body.token;
    });

    // Cleanup after all tests
    afterAll(async () => {
        await pool.query('DELETE FROM categories WHERE name LIKE $1', ['Test Category%']);
        await pool.query('DELETE FROM users WHERE id = $1', [adminUserId]);
        await pool.end();
    });

    describe('POST /api/categories - Create Category', () => {
        it('should create a new category successfully', async () => {
            const res = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Category 1',
                    description: 'Test category description',
                    icon: 'book'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.name).toBe('Test Category 1');
            expect(res.body.data.slug).toBe('test-category-1');
            
            testCategoryId = res.body.data.id;
        });

        it('should create a child category', async () => {
            const res = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Category Child',
                    description: 'Child category',
                    parentId: testCategoryId
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.parent_id).toBe(testCategoryId);
            
            childCategoryId = res.body.data.id;
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .post('/api/categories')
                .send({
                    name: 'Test Category Unauthorized'
                });

            expect(res.status).toBe(401);
        });

        it('should fail with invalid data', async () => {
            const res = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'AB' // Too short
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/categories - Get All Categories', () => {
        it('should get all categories', async () => {
            const res = await request(app)
                .get('/api/categories');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('should get categories with pagination', async () => {
            const res = await request(app)
                .get('/api/categories?page=1&limit=5');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(5);
        });
    });

    describe('GET /api/categories/tree - Get Category Tree', () => {
        it('should get hierarchical category tree', async () => {
            const res = await request(app)
                .get('/api/categories/tree');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            
            // Find our test category in the tree
            const testCat = res.body.data.find(cat => cat.id === testCategoryId);
            expect(testCat).toBeDefined();
            expect(testCat.children).toBeDefined();
            expect(Array.isArray(testCat.children)).toBe(true);
        });
    });

    describe('GET /api/categories/:id - Get Category by ID', () => {
        it('should get category by ID', async () => {
            const res = await request(app)
                .get(`/api/categories/${testCategoryId}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(testCategoryId);
            expect(res.body.data.name).toBe('Test Category 1');
        });

        it('should return 404 for non-existent category', async () => {
            const res = await request(app)
                .get('/api/categories/00000000-0000-0000-0000-000000000000');

            expect(res.status).toBe(404);
        });

        it('should return 400 for invalid UUID', async () => {
            const res = await request(app)
                .get('/api/categories/invalid-id');

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/categories/slug/:slug - Get Category by Slug', () => {
        it('should get category by slug', async () => {
            const res = await request(app)
                .get('/api/categories/slug/test-category-1');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.slug).toBe('test-category-1');
        });

        it('should return 404 for non-existent slug', async () => {
            const res = await request(app)
                .get('/api/categories/slug/non-existent-slug');

            expect(res.status).toBe(404);
        });
    });

    describe('PUT /api/categories/:id - Update Category', () => {
        it('should update category successfully', async () => {
            const res = await request(app)
                .put(`/api/categories/${testCategoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Category 1 Updated',
                    description: 'Updated description'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Test Category 1 Updated');
            expect(res.body.data.description).toBe('Updated description');
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .put(`/api/categories/${testCategoryId}`)
                .send({
                    name: 'Unauthorized Update'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/categories/reorder - Reorder Categories', () => {
        it('should reorder categories successfully', async () => {
            const res = await request(app)
                .post('/api/categories/reorder')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    categoryOrders: [
                        { id: testCategoryId, displayOrder: 1 },
                        { id: childCategoryId, displayOrder: 2 }
                    ]
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('DELETE /api/categories/:id - Delete Category', () => {
        it('should delete child category first', async () => {
            const res = await request(app)
                .delete(`/api/categories/${childCategoryId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should delete parent category', async () => {
            const res = await request(app)
                .delete(`/api/categories/${testCategoryId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 404 when deleting non-existent category', async () => {
            const res = await request(app)
                .delete('/api/categories/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
        });
    });
});
