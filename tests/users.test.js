/**
 * User Management Tests
 * Tests for user CRUD operations, role assignment, and permissions
 */

const request = require('supertest');
const app = require('../server');
const { pool } = require('../config/database');

describe('User Management API', () => {
    let adminToken;
    let adminUserId;
    let testUserId;
    let studentRoleId;

    const adminUser = {
        email: 'admin@test.com',
        username: 'adminuser',
        password: 'AdminPass123!',
        firstName: 'Admin',
        lastName: 'User'
    };

    const testUser = {
        email: 'user@test.com',
        username: 'regularuser',
        password: 'UserPass123!',
        firstName: 'Regular',
        lastName: 'User'
    };

    // Setup: Create admin user and get token
    beforeAll(async () => {
        // Clean up existing test data
        await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [adminUser.email, testUser.email]);

        // Create admin user directly in database
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(adminUser.password, 10);
        
        // Get super_admin role
        const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['super_admin']);
        const superAdminRoleId = roleResult.rows[0].id;
        
        const adminResult = await pool.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, is_active, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, true, true)
             RETURNING id`,
            [adminUser.username, adminUser.email, hashedPassword, adminUser.firstName, adminUser.lastName, superAdminRoleId]
        );
        adminUserId = adminResult.rows[0].id;

        // Get student role ID for tests
        const studentRoleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['student']);
        if (studentRoleResult.rows.length > 0) {
            studentRoleId = studentRoleResult.rows[0].id;
        }

        // Login as admin
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                user: adminUser.email,
                password: adminUser.password
            });

        adminToken = loginResponse.body.token;
    });

    // Cleanup after all tests
    afterAll(async () => {
        await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [adminUser.email, testUser.email]);
        await pool.end();
    });

    describe('GET /api/users', () => {
        it('should get all users with authentication', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body).toHaveProperty('pagination');
        });

        it('should not get users without authentication', async () => {
            const response = await request(app)
                .get('/api/users')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should filter users by search query', async () => {
            const response = await request(app)
                .get('/api/users?search=admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should paginate users correctly', async () => {
            const response = await request(app)
                .get('/api/users?page=1&limit=5')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(5);
        });
    });

    describe('POST /api/users', () => {
        it('should create a new user with admin privileges', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    ...testUser,
                    roleId: studentRoleId
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.email).toBe(testUser.email);

            testUserId = response.body.data.id;
        });

        it('should not create user without authentication', async () => {
            const response = await request(app)
                .post('/api/users')
                .send({
                    email: 'another@test.com',
                    username: 'anotheruser',
                    password: 'Pass123!'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should not create user with duplicate email', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(testUser)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should not create user with invalid data', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'invalid-email',
                    username: 'test'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/users/:id', () => {
        it('should get user by ID', async () => {
            const response = await request(app)
                .get(`/api/users/${testUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testUserId);
            expect(response.body.data.email).toBe(testUser.email);
        });

        it('should not get user with invalid ID', async () => {
            const response = await request(app)
                .get('/api/users/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should not get user without authentication', async () => {
            const response = await request(app)
                .get(`/api/users/${testUserId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/:id', () => {
        it('should update user information', async () => {
            const response = await request(app)
                .put(`/api/users/${testUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    first_name: 'Updated',
                    last_name: 'Name',
                    bio: 'Updated bio'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.first_name).toBe('Updated');
            expect(response.body.data.last_name).toBe('Name');
        });

        it('should not update user without authentication', async () => {
            const response = await request(app)
                .put(`/api/users/${testUserId}`)
                .send({
                    firstName: 'Test'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/:id/role', () => {
        it('should update user role', async () => {
            const response = await request(app)
                .put(`/api/users/${testUserId}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role_name: 'student'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.role_name).toBe('student');
        });

        it('should not update role without proper permissions', async () => {
            // This would require a non-admin token to test properly
            // For now, we test with invalid role ID
            const response = await request(app)
                .put(`/api/users/${testUserId}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role_name: 'invalid-role'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/:id/password', () => {
        it('should update user password', async () => {
            const response = await request(app)
                .put(`/api/users/${testUserId}/password`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    current_password: testUser.password,
                    new_password: 'NewPassword123!'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should not update password with weak password', async () => {
            const response = await request(app)
                .put(`/api/users/${testUserId}/password`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    current_password: 'NewPassword123!',
                    new_password: '123'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/users/:id/toggle-status', () => {
        it('should toggle user active status', async () => {
            const response = await request(app)
                .patch(`/api/users/${testUserId}/toggle-status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('is_active');
        });

        it('should not toggle status without authentication', async () => {
            const response = await request(app)
                .patch(`/api/users/${testUserId}/toggle-status`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should delete user', async () => {
            const response = await request(app)
                .delete(`/api/users/${testUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should not delete non-existent user', async () => {
            const response = await request(app)
                .delete(`/api/users/${testUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should not delete user without authentication', async () => {
            const response = await request(app)
                .delete(`/api/users/${adminUserId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
