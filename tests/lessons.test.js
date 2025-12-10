/**
 * Lesson Management Tests
 * Tests for lesson CRUD operations and module-based content
 */

const request = require('supertest');
const app = require('../server');
const knex = require('../config/knex');
const bcrypt = require('bcryptjs');

describe('Lesson Management API', () => {
  let adminToken;
  let instructorToken;
  let studentToken;
  let adminUser;
  let instructorUser;
  let studentUser;
  let testCourse;
  let testLesson;
  let testModule;
  let testAttachment;

  beforeAll(async () => {
    // Clean up test data - use raw SQL to ensure it works
    try {
      await knex.raw("DELETE FROM module_attachments WHERE module_id IN (SELECT id FROM lesson_modules WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id IN (SELECT id FROM courses WHERE slug = 'test-course-lessons')))");
      await knex.raw("DELETE FROM lesson_modules WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id IN (SELECT id FROM courses WHERE slug = 'test-course-lessons'))");
      await knex.raw("DELETE FROM lessons WHERE course_id IN (SELECT id FROM courses WHERE slug = 'test-course-lessons')");
      await knex.raw("DELETE FROM courses WHERE slug = 'test-course-lessons'");
      await knex.raw("DELETE FROM categories WHERE slug = 'test-category-lessons'");
      await knex.raw("DELETE FROM users WHERE username IN ('testadminlesson', 'testinstructorlesson', 'teststudentlesson')");
    } catch (error) {
      console.log('Cleanup error (may be expected):', error.message);
    }

    // Get roles
    const superAdminRole = await knex('roles').where('name', 'super_admin').first();
    const instructorRole = await knex('roles').where('name', 'instructor').first();
    const studentRole = await knex('roles').where('name', 'student').first();

    // Create test users
    const hashedPassword = await bcrypt.hash('Test123!@#', 10);

    [adminUser] = await knex('users').insert({
      username: 'testadminlesson',
      email: 'testadminlesson@example.com',
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'Admin',
      role_id: superAdminRole.id,
      is_active: true,
      is_verified: true
    }).returning('*');

    [instructorUser] = await knex('users').insert({
      username: 'testinstructorlesson',
      email: 'testinstructorlesson@example.com',
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'Instructor',
      role_id: instructorRole.id,
      is_active: true,
      is_verified: true
    }).returning('*');

    [studentUser] = await knex('users').insert({
      username: 'teststudentlesson',
      email: 'teststudentlesson@example.com',
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'Student',
      role_id: studentRole.id,
      is_active: true,
      is_verified: true
    }).returning('*');

    // Login users
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ user: 'testadminlesson@example.com', password: 'Test123!@#' });
    adminToken = adminLogin.body.token;

    const instructorLogin = await request(app)
      .post('/api/auth/login')
      .send({ user: 'testinstructorlesson@example.com', password: 'Test123!@#' });
    instructorToken = instructorLogin.body.token;

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ user: 'teststudentlesson@example.com', password: 'Test123!@#' });
    studentToken = studentLogin.body.token;

    // Create test category
    const [category] = await knex('categories').insert({
      name: 'Test Category Lessons',
      slug: 'test-category-lessons',
      description: 'Test category for lessons'
    }).returning('*');

    // Create test course
    [testCourse] = await knex('courses').insert({
      title: 'Test Course for Lessons',
      slug: 'test-course-lessons',
      description: 'Test course for lessons',
      category_id: category.id,
      instructor_id: instructorUser.id,
      level: 'beginner',
      price: 0,
      is_published: true
    }).returning('*');
  });

  afterAll(async () => {
    // Clean up
    await knex('module_attachments').del();
    await knex('lesson_modules').del();
    await knex('lessons').del();
    await knex('courses').del();
    await knex('users').where('email', 'like', '%testlesson%').del();
    await knex('categories').where('slug', 'test-category-lessons').del();
    await knex.destroy();
  });

  describe('POST /api/courses/:courseId/lessons', () => {
    it('should create a new lesson as instructor', async () => {
      const response = await request(app)
        .post(`/api/courses/${testCourse.id}/lessons`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Introduction to Testing',
          slug: 'intro-to-testing',
          description: 'Learn the basics of testing',
          is_published: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Introduction to Testing');
      testLesson = response.body.data;
    });

    it('should not allow student to create lesson', async () => {
      const response = await request(app)
        .post(`/api/courses/${testCourse.id}/lessons`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Lesson',
          slug: 'unauthorized-lesson'
        });

      expect(response.status).toBe(403);
    });

    it('should not allow duplicate slug', async () => {
      const response = await request(app)
        .post(`/api/courses/${testCourse.id}/lessons`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Duplicate Slug Test',
          slug: 'intro-to-testing'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('slug already exists');
    });
  });

  describe('GET /api/courses/:courseId/lessons', () => {
    it('should get all lessons for a course', async () => {
      const response = await request(app)
        .get(`/api/courses/${testCourse.id}/lessons`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/courses/${testCourse.id}/lessons?page=1&limit=5`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/lessons/:id', () => {
    it('should get a single lesson', async () => {
      const response = await request(app)
        .get(`/api/lessons/${testLesson.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testLesson.id);
      expect(response.body.data.title).toBe('Introduction to Testing');
    });

    it('should return 404 for non-existent lesson', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/lessons/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/lessons/:id', () => {
    it('should update lesson as instructor', async () => {
      const response = await request(app)
        .put(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Updated Lesson Title',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Lesson Title');
    });

    it('should not allow student to update lesson', async () => {
      const response = await request(app)
        .put(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Update'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/lessons/:id/publish', () => {
    it('should toggle publish status', async () => {
      const response = await request(app)
        .patch(`/api/lessons/${testLesson.id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          is_published: false
        });

      expect(response.status).toBe(200);
      expect(response.body.data.is_published).toBe(false);
    });
  });

  describe('POST /api/lessons/:id/duplicate', () => {
    it('should duplicate a lesson', async () => {
      const response = await request(app)
        .post(`/api/lessons/${testLesson.id}/duplicate`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Duplicated Lesson'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Duplicated Lesson');
    });
  });

  describe('GET /api/courses/:courseId/lessons/search', () => {
    it('should search lessons', async () => {
      const response = await request(app)
        .get(`/api/courses/${testCourse.id}/lessons/search?q=testing`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Module Management', () => {
    describe('POST /api/lessons/:lessonId/modules', () => {
      it('should create a module with video content', async () => {
        const response = await request(app)
          .post(`/api/lessons/${testLesson.id}/modules`)
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({
            title: 'Video Module',
            slug: 'video-module',
            description: 'A video module',
            content_type: 'video',
            video_url: 'https://example.com/video.mp4',
            video_duration: 1800,
            duration_minutes: 30,
            is_preview: true,
            is_published: true
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe('Video Module');
        expect(response.body.data.content_type).toBe('video');
        testModule = response.body.data;
      });

      it('should not allow student to create module', async () => {
        const response = await request(app)
          .post(`/api/lessons/${testLesson.id}/modules`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            title: 'Unauthorized Module',
            slug: 'unauthorized-module',
            content_type: 'text'
          });

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/lessons/:lessonId/modules', () => {
      it('should get all modules for a lesson', async () => {
        const response = await request(app)
          .get(`/api/lessons/${testLesson.id}/modules`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/modules/:id', () => {
      it('should get a single module', async () => {
        const response = await request(app)
          .get(`/api/modules/${testModule.id}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testModule.id);
      });
    });

    describe('PUT /api/modules/:id', () => {
      it('should update a module', async () => {
        const response = await request(app)
          .put(`/api/modules/${testModule.id}`)
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({
            title: 'Updated Module Title'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.title).toBe('Updated Module Title');
      });
    });

    describe('PATCH /api/modules/:id/publish', () => {
      it('should toggle module publish status', async () => {
        const response = await request(app)
          .patch(`/api/modules/${testModule.id}/publish`)
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({
            is_published: false
          });

        expect(response.status).toBe(200);
        expect(response.body.data.is_published).toBe(false);
      });
    });
  });

  describe('Module Attachment Management', () => {
    describe('POST /api/modules/:moduleId/attachments', () => {
      it('should create an attachment', async () => {
        const response = await request(app)
          .post(`/api/modules/${testModule.id}/attachments`)
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({
            title: 'Module Slides',
            file_url: 'https://example.com/slides.pdf',
            file_type: 'application/pdf',
            file_size: 2048576,
            is_downloadable: true
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe('Module Slides');
        testAttachment = response.body.data;
      });
    });

    describe('GET /api/modules/:moduleId/attachments', () => {
      it('should get all attachments for a module', async () => {
        const response = await request(app)
          .get(`/api/modules/${testModule.id}/attachments`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('PUT /api/module-attachments/:id', () => {
      it('should update an attachment', async () => {
        const response = await request(app)
          .put(`/api/module-attachments/${testAttachment.id}`)
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({
            title: 'Updated Slides'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.title).toBe('Updated Slides');
      });
    });

    describe('POST /api/modules/:moduleId/attachments/bulk', () => {
      it('should bulk create attachments', async () => {
        const response = await request(app)
          .post(`/api/modules/${testModule.id}/attachments/bulk`)
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({
            attachments: [
              {
                title: 'Code Examples',
                file_url: 'https://example.com/code.zip',
                file_type: 'application/zip',
                file_size: 512000
              },
              {
                title: 'Resources',
                file_url: 'https://example.com/resources.pdf',
                file_type: 'application/pdf',
                file_size: 1024000
              }
            ]
          });

        expect(response.status).toBe(201);
        expect(response.body.data.length).toBe(2);
      });
    });

    describe('DELETE /api/module-attachments/:id', () => {
      it('should delete an attachment', async () => {
        const response = await request(app)
          .delete(`/api/module-attachments/${testAttachment.id}`)
          .set('Authorization', `Bearer ${instructorToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('DELETE /api/lessons/:id', () => {
    it('should delete a lesson', async () => {
      const response = await request(app)
        .delete(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not allow student to delete lesson', async () => {
      // Create a new lesson first
      const createResponse = await request(app)
        .post(`/api/courses/${testCourse.id}/lessons`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Lesson to Delete',
          slug: 'lesson-to-delete-test'
        });

      const lessonId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });
});
