/**
 * Course Repository
 * Handles all database operations for courses using Knex
 */

const knex = require('../../../config/knex');

class CourseRepository {
  /**
   * Get all courses with pagination and filters
   */
  async findAll(options = {}) {
    const { page = 1, limit = 10, search, category, instructor, status = 'published' } = options;
    const offset = (page - 1) * limit;

    let query = knex('courses')
      .select(
        'courses.*',
        'categories.name as category_name',
        'users.username as instructor_name',
        'users.first_name as instructor_first_name',
        'users.last_name as instructor_last_name',
        'users.avatar_url as instructor_avatar_url'
      )
      .leftJoin('categories', 'courses.category_id', 'categories.id')
      .leftJoin('users', 'courses.instructor_id', 'users.id');

    if (search) {
      query = query.where(function() {
        this.where('courses.title', 'ilike', `%${search}%`)
          .orWhere('courses.description', 'ilike', `%${search}%`);
      });
    }

    if (category) {
      query = query.where('courses.category_id', category);
    }

    if (instructor) {
      query = query.where('courses.instructor_id', instructor);
    }

    if (status) {
      // Use is_published field (true for published courses)
      query = query.where('courses.is_published', status === 'published' ? true : false);
    }

    let totalQuery = knex('courses').count('* as count');

    // Apply the same filters to the count query
    if (search) {
      totalQuery = totalQuery.where(function() {
        this.where('courses.title', 'ilike', `%${search}%`)
          .orWhere('courses.description', 'ilike', `%${search}%`);
      });
    }

    if (category) {
      totalQuery = totalQuery.where('courses.category_id', category);
    }

    if (instructor) {
      totalQuery = totalQuery.where('courses.instructor_id', instructor);
    }

    if (status) {
      // Use is_published field (true for published courses)
      totalQuery = totalQuery.where('courses.is_published', status === 'published' ? true : false);
    }

    const total = await totalQuery.first();
    const courses = await query
      .limit(limit)
      .offset(offset)
      .orderBy('courses.created_at', 'desc');

    return {
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  }

  /**
   * Find course by ID
   */
  async findById(id) {
    return await knex('courses')
      .select(
        'courses.*',
        'categories.name as category_name',
        'users.username as instructor_name',
        'users.first_name as instructor_first_name',
        'users.last_name as instructor_last_name',
        'users.avatar_url as instructor_avatar_url'
      )
      .leftJoin('categories', 'courses.category_id', 'categories.id')
      .leftJoin('users', 'courses.instructor_id', 'users.id')
      .where('courses.id', id)
      .first();
  }

  /**
   * Find course by ID with enrollment count
   */
  async findByIdWithDetails(id) {
    const course = await this.findById(id);
    
    if (!course) return null;

    // Get enrollment count
    const enrollmentCount = await knex('enrollments')
      .where({ course_id: id })
      .count('* as count')
      .first();

    course.enrollment_count = parseInt(enrollmentCount.count);

    return course;
  }

  /**
   * Find courses by category
   */
  async findByCategory(categoryId, options = {}) {
    const { status = 'published' } = options;

    return await knex('courses')
      .select('courses.*')
      .where('category_id', categoryId)
      .where('is_published', status === 'published' ? true : false)
      .orderBy('created_at', 'desc');
  }

  /**
   * Find courses by instructor
   */
  async findByInstructor(instructorId) {
    return await knex('courses')
      .select('courses.*', 'categories.name as category_name')
      .leftJoin('categories', 'courses.category_id', 'categories.id')
      .where('courses.instructor_id', instructorId)
      .orderBy('courses.created_at', 'desc');
  }

  /**
   * Create a new course
   */
  async create(courseData) {
    const {
      title,
      description,
      category_id,
      instructor_id,
      thumbnail_url,
      price = 0,
      duration_hours,
      level,
      status = 'draft'
    } = courseData;

    const [course] = await knex('courses')
      .insert({
        title,
        description,
        category_id,
        instructor_id,
        thumbnail_url,
        price,
        duration_hours,
        level,
        status,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('*');

    return course;
  }

  /**
   * Update course
   */
  async update(id, courseData) {
    const [course] = await knex('courses')
      .where({ id })
      .update({
        ...courseData,
        updated_at: knex.fn.now()
      })
      .returning('*');

    return course;
  }

  /**
   * Update course status
   */
  async updateStatus(id, status) {
    const [course] = await knex('courses')
      .where({ id })
      .update({
        status,
        updated_at: knex.fn.now()
      })
      .returning('*');

    return course;
  }

  /**
   * Delete course
   */
  async delete(id) {
    await knex('courses')
      .where({ id })
      .delete();
  }

  /**
   * Get popular courses
   */
  async findPopular(options = {}) {
    const { limit = 10 } = options;

    return await knex('courses')
      .select(
        'courses.*',
        'categories.name as category_name'
      )
      .leftJoin('categories', 'courses.category_id', 'categories.id')
      .where('courses.is_published', true)
      .where('courses.enrollment_count', '>', 0)
      .orderBy('courses.enrollment_count', 'desc')
      .limit(limit);
  }

  /**
   * Search courses
   */
  async search(searchOptions) {
    const {
      query,
      category,
      level,
      maxPrice,
      status = 'published',
      page = 1,
      limit = 10
    } = searchOptions;

    const offset = (page - 1) * limit;

    let queryBuilder = knex('courses')
      .select('courses.*', 'categories.name as category_name')
      .leftJoin('categories', 'courses.category_id', 'categories.id')
      .where('courses.is_published', status === 'published' ? true : false);

    if (query) {
      queryBuilder = queryBuilder.where(function() {
        this.where('courses.title', 'ilike', `%${query}%`)
          .orWhere('courses.description', 'ilike', `%${query}%`);
      });
    }

    if (category) {
      queryBuilder = queryBuilder.where('courses.category_id', category);
    }

    if (level) {
      queryBuilder = queryBuilder.where('courses.level', level);
    }

    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.where('courses.price', '<=', maxPrice);
    }

    const total = await queryBuilder.clone().count('* as count').first();
    const courses = await queryBuilder
      .limit(limit)
      .offset(offset)
      .orderBy('courses.created_at', 'desc');

    return {
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  }

  /**
   * Get course statistics
   */
  async getStatistics(courseId) {
    const enrollments = await knex('enrollments')
      .where({ course_id: courseId })
      .count('* as count')
      .first();

    const completions = await knex('enrollments')
      .where({ course_id: courseId, status: 'completed' })
      .count('* as count')
      .first();

    const avgProgress = await knex('enrollments')
      .where({ course_id: courseId })
      .avg('progress_percentage as avg')
      .first();

    const course = await this.findById(courseId);
    const revenue = course ? parseFloat(course.price) * parseInt(enrollments.count) : 0;

    return {
      enrollments: parseInt(enrollments.count),
      completions: parseInt(completions.count),
      avgProgress: parseFloat(avgProgress.avg) || 0,
      revenue
    };
  }

  /**
   * Get instructor dashboard data
   */
  async getInstructorDashboard(instructorId) {
    const totalCourses = await knex('courses')
      .where({ instructor_id: instructorId })
      .count('* as count')
      .first();

    const totalStudents = await knex('enrollments')
      .join('courses', 'enrollments.course_id', 'courses.id')
      .where('courses.instructor_id', instructorId)
      .countDistinct('enrollments.user_id as count')
      .first();

    const totalRevenue = await knex('enrollments')
      .join('courses', 'enrollments.course_id', 'courses.id')
      .where('courses.instructor_id', instructorId)
      .sum('courses.price as total')
      .first();

    const recentEnrollments = await knex('enrollments')
      .select('enrollments.*', 'courses.title as course_title', 'users.username')
      .join('courses', 'enrollments.course_id', 'courses.id')
      .join('users', 'enrollments.user_id', 'users.id')
      .where('courses.instructor_id', instructorId)
      .orderBy('enrollments.enrolled_at', 'desc')
      .limit(10);

    return {
      totalCourses: parseInt(totalCourses.count),
      totalStudents: parseInt(totalStudents.count),
      totalRevenue: parseFloat(totalRevenue.total) || 0,
      recentEnrollments
    };
  }

  /**
   * Get platform-wide statistics
   */
  async getPlatformStatistics() {
    const totalCourses = await knex('courses')
      .count('* as count')
      .first();

    const totalEnrollments = await knex('enrollments')
      .count('* as count')
      .first();

    const popularCategories = await knex('categories')
      .select('categories.name', knex.raw('COUNT(courses.id) as course_count'))
      .leftJoin('courses', 'categories.id', 'courses.category_id')
      .groupBy('categories.id', 'categories.name')
      .orderBy('course_count', 'desc')
      .limit(5);

    return {
      totalCourses: parseInt(totalCourses.count),
      totalEnrollments: parseInt(totalEnrollments.count),
      popularCategories
    };
  }
}

module.exports = new CourseRepository();
