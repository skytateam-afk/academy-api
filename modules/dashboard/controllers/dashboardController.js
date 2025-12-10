/**
 * Dashboard Controller
 * Provides statistics and metrics for the admin dashboard
 */

const knex = require('../../../config/knex');

/**
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get current date and first day of current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // User Statistics - using Knex
    const totalUsers = await knex('users').count('* as count').first();
    const newUsersThisMonth = await knex('users')
      .count('* as count')
      .where('created_at', '>=', firstDayOfMonth)
      .first();
    const newUsersLastMonth = await knex('users')
      .count('* as count')
      .where('created_at', '>=', firstDayOfLastMonth)
      .where('created_at', '<', firstDayOfMonth)
      .first();

    // User counts by role - dynamically fetch all roles
    const usersByRole = await knex('roles')
      .leftJoin('users', 'users.role_id', 'roles.id')
      .select(
        'roles.id as role_id',
        'roles.name as role_name',
        'roles.description',
        knex.raw('COUNT(users.id) as user_count')
      )
      .groupBy('roles.id', 'roles.name', 'roles.description')
      .orderBy('user_count', 'desc');

    const userStats = {
      total_users: parseInt(totalUsers.count) || 0,
      new_this_month: parseInt(newUsersThisMonth.count) || 0,
      new_last_month: parseInt(newUsersLastMonth.count) || 0,
      by_role: usersByRole.map(role => ({
        role_id: role.role_id,
        role_name: role.role_name,
        description: role.description,
        count: parseInt(role.user_count) || 0
      }))
    };

    // Course Statistics - using Knex
    const totalCourses = await knex('courses').count('* as count').first();
    const publishedCourses = await knex('courses')
      .where('is_published', true)
      .count('* as count')
      .first();
    const draftCourses = await knex('courses')
      .where('is_published', false)
      .count('* as count')
      .first();
    const newCoursesThisMonth = await knex('courses')
      .where('created_at', '>=', firstDayOfMonth)
      .count('* as count')
      .first();

    const courseStats = {
      total_courses: parseInt(totalCourses.count) || 0,
      published_courses: parseInt(publishedCourses.count) || 0,
      draft_courses: parseInt(draftCourses.count) || 0,
      new_this_month: parseInt(newCoursesThisMonth.count) || 0
    };

    // Enrollment Statistics - using Knex
    let enrollmentStats = {
      total_enrollments: 0,
      new_this_month: 0,
      new_last_month: 0
    };

    try {
      const totalEnrollments = await knex('enrollments').count('* as count').first();
      const newEnrollmentsThisMonth = await knex('enrollments')
        .where('enrolled_at', '>=', firstDayOfMonth)
        .count('* as count')
        .first();
      const newEnrollmentsLastMonth = await knex('enrollments')
        .where('enrolled_at', '>=', firstDayOfLastMonth)
        .where('enrolled_at', '<', firstDayOfMonth)
        .count('* as count')
        .first();

      enrollmentStats = {
        total_enrollments: parseInt(totalEnrollments.count) || 0,
        new_this_month: parseInt(newEnrollmentsThisMonth.count) || 0,
        new_last_month: parseInt(newEnrollmentsLastMonth.count) || 0
      };
    } catch (err) {
      console.log('Enrollments table not available for stats:', err.message);
    }

    // Calculate growth percentages
    const userGrowth = userStats.new_last_month > 0
      ? ((userStats.new_this_month - userStats.new_last_month) / userStats.new_last_month * 100).toFixed(1)
      : 0;

    const enrollmentGrowth = enrollmentStats.new_last_month > 0
      ? ((enrollmentStats.new_this_month - enrollmentStats.new_last_month) / enrollmentStats.new_last_month * 100).toFixed(1)
      : 0;

    // Recent Enrollments (last 10) - handle if table doesn't exist
    let recentEnrollments = [];
    try {
      recentEnrollments = await knex('enrollments')
        .join('users', 'enrollments.user_id', 'users.id')
        .join('courses', 'enrollments.course_id', 'courses.id')
        .select(
          'enrollments.id',
          'enrollments.enrolled_at as created_at',
          'users.username',
          'users.email',
          'courses.title as course_title'
        )
        .orderBy('enrollments.enrolled_at', 'desc')
        .limit(10);
    } catch (err) {
      console.log('Enrollments table not available:', err.message);
    }

    // Recent Users (last 10)
    const recentUsers = await knex('users')
      .select('id', 'username', 'email', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(10);

    // Recent Courses (last 10)
    const recentCourses = await knex('courses')
      .select('id', 'title', 'is_published', 'created_at', 'updated_at')
      .orderBy('updated_at', 'desc')
      .limit(10);

    // User growth over last 6 months
    const userGrowthData = await knex.raw(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    // User signups over last 90 days (daily)
    const userSignupsData = await knex.raw(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as signups
      FROM users
      WHERE created_at >= NOW() - INTERVAL '90 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `);

    // Top courses by enrollment (with proper count handling)
    let topCourses = [];
    try {
      topCourses = await knex('courses')
        .leftJoin('enrollments', 'courses.id', 'enrollments.course_id')
        .select(
          'courses.id',
          'courses.title',
          knex.raw('COALESCE(COUNT(enrollments.id), 0) as enrollment_count')
        )
        .groupBy('courses.id', 'courses.title')
        .orderBy('enrollment_count', 'desc')
        .limit(20);

      // Ensure enrollment_count is a number
      topCourses = topCourses.map(course => ({
        ...course,
        enrollment_count: parseInt(course.enrollment_count) || 0
      }));
    } catch (err) {
      console.log('Error fetching top courses:', err.message);
      // Return empty array if enrollments table doesn't exist
      topCourses = [];
    }

    // Courses by category - show all categories even with 0 courses
    const coursesByCategory = await knex('categories')
      .leftJoin('courses', 'categories.id', 'courses.category_id')
      .select(
        'categories.name as category',
        knex.raw('COUNT(courses.id) as count')
      )
      .groupBy('categories.id', 'categories.name')
      .orderBy('count', 'desc');

    res.json({
      success: true,
      data: {
        stats: {
          users: {
            total: parseInt(userStats.total_users) || 0,
            newThisMonth: parseInt(userStats.new_this_month) || 0,
            growth: parseFloat(userGrowth),
            byRole: userStats.by_role
          },
          courses: {
            total: parseInt(courseStats.total_courses) || 0,
            published: parseInt(courseStats.published_courses) || 0,
            draft: parseInt(courseStats.draft_courses) || 0,
            newThisMonth: parseInt(courseStats.new_this_month) || 0
          },
          enrollments: {
            total: parseInt(enrollmentStats.total_enrollments) || 0,
            newThisMonth: parseInt(enrollmentStats.new_this_month) || 0,
            growth: parseFloat(enrollmentGrowth)
          }
        },
        charts: {
          userGrowth: userGrowthData.rows,
          userSignups: userSignupsData.rows,
          topCourses: topCourses,
          coursesByCategory: coursesByCategory
        },
        recentActivity: {
          enrollments: recentEnrollments,
          users: recentUsers,
          courses: recentCourses
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get comprehensive analytics data
 */
exports.getAnalyticsData = async (req, res, next) => {
  const analyticsData = {
    userAnalytics: {},
    courseAnalytics: {},
    revenueAnalytics: {},
    engagementAnalytics: {},
    performanceAnalytics: {},
    updatedAt: new Date().toISOString()
  };

  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    // ============================================
    // USER ANALYTICS
    // ============================================
    try {
      analyticsData.userAnalytics = await getUserAnalytics(knex);
    } catch (err) {
      console.log('User analytics failed:', err.message);
      // Fallback to basic if full fails
      try {
        analyticsData.userAnalytics = await getBasicUserAnalytics(knex);
      } catch (e) {
        analyticsData.userAnalytics = { error: 'User analytics unavailable' };
      }
    }

    // ============================================
    // COURSE ANALYTICS
    // ============================================
    try {
      analyticsData.courseAnalytics = await getCourseAnalytics(knex, firstDayOfMonth, firstDayOfYear);
    } catch (err) {
      console.log('Course analytics failed:', err.message);
      // Fallback to basic if full fails
      try {
        analyticsData.courseAnalytics = await getBasicCourseAnalytics(knex);
      } catch (e) {
        analyticsData.courseAnalytics = { error: 'Course analytics unavailable' };
      }
    }

    // ============================================
    // REVENUE ANALYTICS
    // ============================================
    try {
      analyticsData.revenueAnalytics = await getRevenueAnalytics(knex, firstDayOfMonth, firstDayOfYear);
    } catch (err) {
      console.log('Revenue analytics failed:', err.message);
      analyticsData.revenueAnalytics = {
        revenueTrends: [],
        revenueByCourse: [],
        paymentMethods: [],
        totalRevenue: 0,
        totalTransactions: 0,
        error: 'Revenue analytics unavailable'
      };
    }

    // ============================================
    // ENGAGEMENT ANALYTICS
    // ============================================
    try {
      analyticsData.engagementAnalytics = await getEngagementAnalytics(knex);
    } catch (err) {
      console.log('Engagement analytics failed:', err.message);
      analyticsData.engagementAnalytics = {
        dailyActiveUsers: [],
        peakHours: [],
        featureUsage: [],
        sessionDuration: {},
        error: 'Engagement analytics unavailable'
      };
    }

    // ============================================
    // PERFORMANCE ANALYTICS
    // ============================================
    try {
      analyticsData.performanceAnalytics = await getPerformanceAnalytics(knex);
    } catch (err) {
      console.log('Performance analytics failed:', err.message);
      analyticsData.performanceAnalytics = {
        errorRates: [],
        responseTimes: {},
        dbPerformance: [],
        systemHealth: {},
        error: 'Performance analytics unavailable'
      };
    }

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Analytics error:', error);
    // Return partial data instead of failing completely
    res.json({
      success: true,
      data: {
        ...analyticsData,
        errors: [error.message]
      }
    });
  }
};

/**
 * Basic User Analytics Helper - Using proper Knex builder methods where possible
 */
async function getBasicUserAnalytics(knex) {
  // Just get some basic user stats using Knex builder
  const totalUsersQuery = await knex('users')
    .count('* as count')
    .first();

  const activeUsersQuery = await knex('users')
    .count('* as count')
    .where('is_active', true)
    .first();

  // User growth over last 6 months - complex date functions require raw SQL
  const userGrowthData = await knex.raw(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
      COUNT(*) as count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at)
  `);

  return {
    totalUsers: parseInt(totalUsersQuery.count) || 0,
    activeUsers: parseInt(activeUsersQuery.count) || 0,
    growth: userGrowthData.rows
  };
}

/**
 * Basic Course Analytics Helper - Using proper Knex builder methods
 */
async function getBasicCourseAnalytics(knex) {
  const totalCoursesQuery = await knex('courses')
    .count('* as count')
    .first();

  const publishedCoursesQuery = await knex('courses')
    .count('* as count')
    .where('is_published', true)
    .first();

  return {
    totalCourses: parseInt(totalCoursesQuery.count) || 0,
    publishedCourses: parseInt(publishedCoursesQuery.count) || 0
  };
}

// ============================================
// HELPER FUNCTIONS FOR ANALYTICS
// ============================================

/**
 * User Analytics Helper
 */
async function getUserAnalytics(knex) {
  // User registration trends (last 12 months)
  const userRegistrations12M = await knex.raw(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
      COUNT(*) as registrations,
      DATE_TRUNC('month', created_at) as period
    FROM users
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY period
  `);

  // User activity patterns
  const userActivity = await knex.raw(`
    SELECT
      CASE
        WHEN last_login >= NOW() - INTERVAL '7 days' THEN 'Very Active'
        WHEN last_login >= NOW() - INTERVAL '30 days' THEN 'Active'
        WHEN last_login >= NOW() - INTERVAL '3 months' THEN 'Inactive'
        ELSE 'Dormant'
      END as activity_level,
      COUNT(*) as count
    FROM users
    WHERE is_active = true
    GROUP BY
      CASE
        WHEN last_login >= NOW() - INTERVAL '7 days' THEN 'Very Active'
        WHEN last_login >= NOW() - INTERVAL '30 days' THEN 'Active'
        WHEN last_login >= NOW() - INTERVAL '3 months' THEN 'Inactive'
        ELSE 'Dormant'
      END
    ORDER BY count DESC
  `);

  // User demographics by role
  const roleDistribution = await knex.raw(`
    SELECT
      r.name as role,
      COUNT(u.id) as count,
      ROUND(COUNT(u.id)::numeric / (SELECT COUNT(*) FROM users)::numeric * 100, 1) as percentage
    FROM roles r
    LEFT JOIN users u ON r.id = u.role_id
    GROUP BY r.name, r.id
    ORDER BY count DESC
  `);

  // New vs returning users rate
  const userRetention = await knex.raw(`
    SELECT
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE last_login IS NOT NULL) as returning_users,
      ROUND(
        COUNT(*) FILTER (WHERE last_login IS NOT NULL)::numeric /
        NULLIF(COUNT(*), 0)::numeric * 100, 1
      ) as retention_rate
    FROM users
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `);

  return {
    registrations: {
      monthly: userRegistrations12M.rows,
      total: userRegistrations12M.rows.reduce((sum, item) => sum + parseInt(item.registrations), 0)
    },
    activityLevels: userActivity.rows,
    roleDistribution: roleDistribution.rows,
    retention: userRetention.rows[0] || { total_users: 0, returning_users: 0, retention_rate: 0 }
  };
}

/**
 * Course & Learning Analytics Helper
 */
async function getCourseAnalytics(knex, firstDayOfMonth, firstDayOfYear) {
  // Course performance metrics
  const coursePerformance = await knex.raw(`
    SELECT
      c.id,
      c.title,
      c.enrollment_count,
      COALESCE(AVG(cr.rating), 0) as avg_rating,
      COUNT(cr.id) as review_count,
      COALESCE(AVG(cr.rating), 0) * COUNT(cr.id) as weighted_rating,
      c.created_at
    FROM courses c
    LEFT JOIN course_reviews cr ON c.id = cr.course_id
    WHERE c.is_published = true
    GROUP BY c.id, c.title, c.enrollment_count, c.created_at
    ORDER BY enrollment_count DESC, weighted_rating DESC
    LIMIT 50
  `);

  // Learning progression metrics
  const learningProgression = await knex.raw(`
    WITH progress_data AS (
      SELECT
        c.id,
        c.title,
        COUNT(e.id) as enrollments,
        COUNT(e.id) FILTER (WHERE e.completed_at IS NOT NULL) as completions,
        ROUND(
          COUNT(e.id) FILTER (WHERE e.completed_at IS NOT NULL)::numeric /
          NULLIF(COUNT(e.id), 0)::numeric * 100, 1
        ) as completion_rate
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      GROUP BY c.id, c.title
      ORDER BY enrollments DESC
      LIMIT 20
    )
    SELECT
      *,
      completion_rate as percentage
    FROM progress_data
    WHERE enrollments > 0
  `);

  // Lesson engagement metrics
  const lessonEngagement = await knex.raw(`
    SELECT
      l.id,
      l.title,
      c.title as course_title,
      COUNT(lp.id) as views,
      AVG(lp.watch_time_seconds) as avg_watch_time,
      ROUND(
        COUNT(lp.id)::numeric / NULLIF(c.enrollment_count, 0)::numeric * 100, 1
      ) as engagement_rate
    FROM lessons l
    JOIN courses c ON l.course_id = c.id
    LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id
    WHERE c.is_published = true
    GROUP BY l.id, l.title, c.title, c.enrollment_count
    HAVING COUNT(lp.id) > 0
    ORDER BY engagement_rate DESC, views DESC
    LIMIT 20
  `);

  // Quiz/assessment performance
  const assessmentPerformance = await knex.raw(`
    SELECT
      q.title as quiz_title,
      COUNT(qa.id) as attempts,
      AVG(qa.score) as avg_score,
      MAX(qa.score) as highest_score,
      MIN(qa.score) as lowest_score,
      ROUND(
        COUNT(qa.id) FILTER (WHERE qa.passed = true)::numeric /
        NULLIF(COUNT(qa.id), 0)::numeric * 100, 1
      ) as pass_rate
    FROM quizzes q
    LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
    GROUP BY q.id, q.title
    HAVING COUNT(qa.id) > 0
    ORDER BY attempts DESC
    LIMIT 20
  `);

  // Category popularity trends
  const categoryPopularity = await knex.raw(`
    SELECT
      cat.name as category,
      cat.id,
      COUNT(c.id) as total_courses,
      SUM(c.enrollment_count) as total_enrollments,
      ROUND(
        SUM(c.enrollment_count)::numeric / NULLIF(COUNT(c.id), 0)::numeric, 1
      ) as avg_enrollments_per_course,
      COUNT(c.id) FILTER (WHERE c.created_at >= $1) as new_courses_this_month
    FROM categories cat
    LEFT JOIN courses c ON cat.id = c.category_id
    GROUP BY cat.id, cat.name
    ORDER BY total_enrollments DESC
  `, [firstDayOfMonth]);

  return {
    coursePerformance: coursePerformance.rows,
    learningProgression: learningProgression.rows,
    lessonEngagement: lessonEngagement.rows,
    assessmentPerformance: assessmentPerformance.rows,
    categoryPopularity: categoryPopularity.rows
  };
}

/**
 * Revenue & Transaction Analytics Helper
 */
async function getRevenueAnalytics(knex, firstDayOfMonth, firstDayOfYear) {
  // Revenue trends (monthly)
  const revenueTrends = await knex.raw(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
      SUM(amount) as revenue,
      COUNT(*) as transactions,
      ROUND(SUM(amount) / COUNT(*), 2) as avg_transaction,
      DATE_TRUNC('month', created_at) as period
    FROM transactions
    WHERE status = 'completed'
    AND created_at >= $1
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY period
  `, [firstDayOfYear]);

  // Revenue by course (top 10)
  const revenueByCourse = await knex.raw(`
    SELECT
      c.title as course_title,
      t.currency,
      SUM(t.amount) as total_revenue,
      COUNT(t.id) as sales_count,
      AVG(t.amount) as avg_price
    FROM transactions t
    JOIN enrollments e ON t.user_id = e.user_id AND t.course_id = e.course_id
    JOIN courses c ON t.course_id = c.id
    WHERE t.status = 'completed'
    GROUP BY c.id, c.title, t.currency
    ORDER BY total_revenue DESC
    LIMIT 10
  `);

  // Payment method distribution
  const paymentMethods = await knex.raw(`
    SELECT
      payment_method,
      COUNT(*) as transactions,
      SUM(amount) as total_amount,
      ROUND(
        COUNT(*)::numeric / (SELECT COUNT(*) FROM transactions WHERE status = 'completed')::numeric * 100, 1
      ) as percentage
    FROM transactions
    WHERE status = 'completed'
    GROUP BY payment_method
    ORDER BY transactions DESC
  `);

  return {
    revenueTrends: revenueTrends.rows,
    revenueByCourse: revenueByCourse.rows,
    paymentMethods: paymentMethods.rows,
    totalRevenue: revenueTrends.rows.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0),
    totalTransactions: revenueTrends.rows.reduce((sum, item) => sum + parseInt(item.transactions || 0), 0)
  };
}

/**
 * Engagement Analytics Helper
 */
async function getEngagementAnalytics(knex) {
  // Daily/weekly active users
  const dailyActive = await knex.raw(`
    SELECT
      DATE(created_at) as date,
      COUNT(DISTINCT user_id) as active_users
    FROM audit_logs
    WHERE action IN ('login', 'page_view', 'lesson_view')
    AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);

  // Peak usage hours
  const peakHours = await knex.raw(`
    SELECT
      EXTRACT(hour from created_at) as hour,
      COUNT(*) as activity_count,
      COUNT(DISTINCT user_id) as unique_users
    FROM audit_logs
    WHERE action IN ('login', 'page_view', 'lesson_view')
    AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY EXTRACT(hour from created_at)
    ORDER BY hour
  `);

  // Most active features
  const featureUsage = await knex.raw(`
    SELECT
      CASE
        WHEN resource LIKE '%course%' THEN 'Courses'
        WHEN resource LIKE '%lesson%' THEN 'Lessons'
        WHEN resource LIKE '%user%' THEN 'Users'
        WHEN resource LIKE '%auth%' OR resource LIKE '%login%' THEN 'Authentication'
        WHEN resource = 'dashboard' THEN 'Dashboard'
        ELSE resource
      END as feature,
      COUNT(*) as actions,
      COUNT(DISTINCT user_id) as unique_users
    FROM audit_logs
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY
      CASE
        WHEN resource LIKE '%course%' THEN 'Courses'
        WHEN resource LIKE '%lesson%' THEN 'Lessons'
        WHEN resource LIKE '%user%' THEN 'Users'
        WHEN resource LIKE '%auth%' OR resource LIKE '%login%' THEN 'Authentication'
        WHEN resource = 'dashboard' THEN 'Dashboard'
        ELSE resource
      END
    ORDER BY actions DESC
    LIMIT 10
  `);

  // User session duration (estimated from login/logout patterns)
  const sessionDuration = await knex.raw(`
    WITH user_sessions AS (
      SELECT
        user_id,
        session_created_at,
        first_activity_at,
        last_activity_at,
        EXTRACT(epoch FROM (last_activity_at - first_activity_at)) / 60 as session_minutes
      FROM (
        SELECT
          user_id,
          DATE(created_at) as session_date,
          MIN(created_at) as session_created_at,
          MIN(created_at) as first_activity_at,
          MAX(created_at) as last_activity_at
        FROM audit_logs
        WHERE action IN ('login', 'page_view', 'lesson_view')
        AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY user_id, DATE(created_at)
      ) daily_sessions
    )
    SELECT
      ROUND(AVG(session_minutes), 1) as avg_session_duration,
      ROUND(MEDIAN(session_minutes), 1) as median_session_duration,
      ROUND(MAX(session_minutes), 1) as max_session_duration,
      COUNT(*) as total_sessions
    FROM user_sessions
    WHERE session_minutes > 0 AND session_minutes < 480  -- Filter out invalid data (sessions longer than 8 hours)
  `);

  return {
    dailyActiveUsers: dailyActive.rows,
    peakHours: peakHours.rows,
    featureUsage: featureUsage.rows,
    sessionDuration: sessionDuration.rows[0] || {
      avg_session_duration: 0,
      median_session_duration: 0,
      max_session_duration: 0,
      total_sessions: 0
    }
  };
}

/**
 * Performance Analytics Helper
 */
async function getPerformanceAnalytics(knex) {
  // Error rates (from audit logs and system errors)
  const errorRates = await knex.raw(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) FILTER (WHERE success = false) as errors,
      COUNT(*) FILTER (WHERE success = true) as successes,
      ROUND(
        COUNT(*) FILTER (WHERE success = false)::numeric /
        NULLIF(COUNT(*), 0)::numeric * 100, 2
      ) as error_rate
    FROM audit_logs
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);

  // API response times (estimated from audit logs)
  const responseTimes = await knex.raw(`
    SELECT
      AVG(EXTRACT(epoch FROM (updated_at - created_at)) * 1000) as avg_response_time,
      MIN(EXTRACT(epoch FROM (updated_at - created_at)) * 1000) as min_response_time,
      MAX(EXTRACT(epoch FROM (updated_at - created_at)) * 1000) as max_response_time,
      PERCENTILE_CONT(0.95) WITHIN GROUP (
        ORDER BY EXTRACT(epoch FROM (updated_at - created_at)) * 1000
      ) as p95_response_time,
      COUNT(*) as total_requests
    FROM audit_logs
    WHERE action IN ('api_call', 'login', 'data_access')
    AND created_at >= NOW() - INTERVAL '24 hours'
  `);

  // Database performance indicators
  const dbPerformance = await knex.raw(`
    -- This would need actual database monitoring, but for now return basic structure
    SELECT
      'connections' as metric,
      COUNT(*) as value
    FROM pg_stat_activity
    WHERE state IS NOT NULL
  `).catch(() => ({ rows: [{ metric: 'connections', value: 0 }] }));

  return {
    errorRates: errorRates.rows,
    responseTimes: responseTimes.rows[0] || {
      avg_response_time: 0,
      min_response_time: 0,
      max_response_time: 0,
      p95_response_time: 0,
      total_requests: 0
    },
    dbPerformance: dbPerformance.rows,
    systemHealth: {
      status: 'healthy',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    }
  };
}
