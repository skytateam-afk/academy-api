/**
 * Certificate Controller
 * Handles certificate generation and retrieval
 */

const Certificate = require('../../../models/Certificate');
const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

/**
 * Generate or retrieve certificate for a course
 * Automatically generates if course is 100% complete and certificate doesn't exist
 */
exports.generateCertificate = async (req, res) => {
  const trx = await knex.transaction();

  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    // Check global certificate settings first
    const settingsService = require('../../settings/service');
    const institutionSettings = await settingsService.getInstitutionSettings();
    if (!institutionSettings.enable_certificates) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        message: 'Certificates are not enabled for this institution'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findByUserAndCourse(userId, courseId);
    if (existingCertificate) {
      await trx.commit();
      return res.status(200).json({
        success: true,
        message: 'Certificate already exists',
        certificate: existingCertificate
      });
    }

    // Calculate course completion percentage
    const modules = await trx('lessons')
      .join('lesson_modules', 'lessons.id', 'lesson_modules.lesson_id')
      .where('lessons.course_id', courseId)
      .select('lesson_modules.id');

    if (modules.length === 0) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        message: 'Course has no modules'
      });
    }

    const moduleIds = modules.map(m => m.id);
    const completedModules = await trx('module_progress')
      .whereIn('module_id', moduleIds)
      .where({ user_id: userId, is_completed: true })
      .count('* as count');

    const completionPercentage = (parseInt(completedModules[0].count) / modules.length) * 100;

    if (completionPercentage < 100) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        message: 'Course not yet completed',
        completion_percentage: completionPercentage
      });
    }

    // Get course and user details
    const course = await trx('courses')
      .where({ id: courseId })
      .first();

    const user = await trx('users')
      .where({ id: userId })
      .first();

    // Get institution settings (already fetched above)
    const institutionName = institutionSettings.organization_name || 'Skyta Academy';

    // Create certificate data
    const certificateData = {
      course_title: course.title,
      course_description: course.description,
      student_name: `${user.first_name} ${user.last_name}`,
      student_email: user.email,
      completion_date: new Date().toISOString(),
      total_modules: modules.length,
      institution_name: institutionName
    };

    logger.info('Generating certificate with data:', certificateData);

    // Generate certificate
    const certificate = await Certificate.create(userId, courseId, certificateData);

    await trx.commit();

    logger.info(`Certificate generated for user ${userId} for course ${courseId}`);

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      certificate
    });

  } catch (error) {
    await trx.rollback();
    logger.error('Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate',
      error: error.message
    });
  }
};

/**
 * Get certificate for current user and course
 */
exports.getCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const certificate = await Certificate.findByUserAndCourse(userId, courseId);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.status(200).json({
      success: true,
      certificate
    });

  } catch (error) {
    logger.error('Error retrieving certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificate',
      error: error.message
    });
  }
};

/**
 * Get certificates for a specific user (public endpoint for profiles)
 */
exports.getUserCertificatesById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists and is active
    const user = await knex('users')
      .where({ id: userId, is_active: true })
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const certificates = await knex('certificates')
      .select(
        'certificates.*',
        'courses.title as course_title',
        'courses.thumbnail_url',
        'courses.description as course_description'
      )
      .leftJoin('courses', 'certificates.course_id', 'courses.id')
      .where('certificates.user_id', userId)
      .where('courses.is_published', true) // Only show certificates for published courses
      .orderBy('certificates.issued_at', 'desc');

    res.status(200).json({
      success: true,
      certificates
    });

  } catch (error) {
    logger.error('Error retrieving user certificates by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificates',
      error: error.message
    });
  }
};

/**
 * Get certificates for current user
 */
exports.getUserCertificates = async (req, res) => {
  try {
    const userId = req.user.userId;

    const certificates = await knex('certificates')
      .select(
        'certificates.*',
        'courses.title as course_title',
        'courses.thumbnail_url',
        'courses.description as course_description'
      )
      .leftJoin('courses', 'certificates.course_id', 'courses.id')
      .where('certificates.user_id', userId)
      .where('courses.is_published', true) // Only show certificates for published courses
      .orderBy('certificates.issued_at', 'desc');

    res.status(200).json({
      success: true,
      certificates
    });

  } catch (error) {
    logger.error('Error retrieving user certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificates',
      error: error.message
    });
  }
};

/**
 * Verify certificate by certificate number (public)
 */
exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const certificate = await Certificate.findWithDetailsByCertificateNumber(certificateNumber);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      certificate: {
        certificate_number: certificate.certificate_number,
        issued_at: certificate.issued_at,
        student_name: `${certificate.first_name} ${certificate.last_name}`,
        course_title: certificate.course_title,
        certificate_data: certificate.certificate_data
      }
    });

  } catch (error) {
    logger.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify certificate',
      error: error.message
    });
  }
};

/**
 * Check if user can generate certificate (course 100% complete)
 */
exports.checkCertificateEligibility = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    console.log('=== checkCertificateEligibility START ===');
    console.log('userId:', userId, 'courseId:', courseId);

    // Check global certificate settings
    const settingsService = require('../../settings/service');
    const institutionSettings = await settingsService.getInstitutionSettings();
    if (!institutionSettings.enable_certificates) {
      console.log('Certificates are disabled in institution settings');
      return res.status(200).json({
        success: true,
        eligible: false,
        has_certificate: false,
        completion_percentage: 0,
        message: 'Certificates are not enabled for this institution'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findByUserAndCourse(userId, courseId);
    console.log('Existing certificate:', existingCertificate ? 'YES' : 'NO');
    if (existingCertificate) {
      return res.status(200).json({
        success: true,
        eligible: true,
        has_certificate: true,
        certificate: existingCertificate
      });
    }

    // Calculate course completion percentage
    const modules = await knex('lessons')
      .join('lesson_modules', 'lessons.id', 'lesson_modules.lesson_id')
      .where('lessons.course_id', courseId)
      .select('lesson_modules.id');

    console.log('Total modules in course:', modules.length);
    console.log('Module IDs:', modules.map(m => m.id));

    if (modules.length === 0) {
      console.log('Course has no modules');
      return res.status(200).json({
        success: true,
        eligible: false,
        has_certificate: false,
        completion_percentage: 0,
        message: 'Course has no modules'
      });
    }

    const moduleIds = modules.map(m => m.id);
    const completedModules = await knex('module_progress')
      .whereIn('module_id', moduleIds)
      .where({ user_id: userId, is_completed: true })
      .count('* as count');

    const completedCount = parseInt(completedModules[0].count);
    const completionPercentage = (completedCount / modules.length) * 100;

    console.log(`Completed modules: ${completedCount} / ${modules.length}`);
    console.log('Completion percentage:', completionPercentage);

    // Let's also query the actual completed modules to see which ones are marked as complete
    const completedModuleDetails = await knex('module_progress')
      .whereIn('module_id', moduleIds)
      .where({ user_id: userId, is_completed: true })
      .select('module_id', 'is_completed', 'quiz_score', 'quiz_passed', 'completed_at');

    console.log('Completed module details:', completedModuleDetails);

    const response = {
      success: true,
      eligible: completionPercentage >= 100,
      has_certificate: false,
      completion_percentage: completionPercentage,
      completed_modules: completedCount,
      total_modules: modules.length
    };

    console.log('Sending response:', response);
    console.log('=== checkCertificateEligibility END ===');

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error checking certificate eligibility:', error);
    console.error('=== checkCertificateEligibility ERROR ===', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check certificate eligibility',
      error: error.message
    });
  }
};

/**
 * Get certificate details by certificate number (public)
 */
Certificate.findWithDetailsByCertificateNumber = async (certificateNumber) => {
  const certificate = await knex('certificates')
    .select(
      'certificates.*',
      'users.first_name',
      'users.last_name',
      'users.email',
      'courses.title as course_title',
      'courses.description as course_description'
    )
    .leftJoin('users', 'certificates.user_id', 'users.id')
    .leftJoin('courses', 'certificates.course_id', 'courses.id')
    .where('certificates.certificate_number', certificateNumber)
    .first();

  return certificate;
};
