/**
 * Certificate Model
 * Represents course completion certificates
 */

const knex = require('../config/knex');

class Certificate {
  /**
   * Generate unique certificate number
   */
  static generateCertificateNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${year}${month}-${random}`;
  }

  /**
   * Check if user has certificate for a course
   */
  static async exists(userId, courseId) {
    const certificate = await knex('certificates')
      .where({ user_id: userId, course_id: courseId })
      .first();
    return !!certificate;
  }

  /**
   * Create a new certificate
   */
  static async create(userId, courseId, certificateData = {}) {
    const certificateNumber = this.generateCertificateNumber();
    
    const [certificate] = await knex('certificates')
      .insert({
        user_id: userId,
        course_id: courseId,
        certificate_number: certificateNumber,
        issued_at: new Date(),
        certificate_data: certificateData
      })
      .returning('*');
    
    return certificate;
  }

  /**
   * Get certificate by ID
   */
  static async findById(id) {
    const certificate = await knex('certificates')
      .where({ id })
      .first();
    return certificate;
  }

  /**
   * Get certificate by certificate number
   */
  static async findByCertificateNumber(certificateNumber) {
    const certificate = await knex('certificates')
      .where({ certificate_number: certificateNumber })
      .first();
    return certificate;
  }

  /**
   * Get certificate for user and course
   */
  static async findByUserAndCourse(userId, courseId) {
    const certificate = await knex('certificates')
      .where({ user_id: userId, course_id: courseId })
      .first();
    return certificate;
  }

  /**
   * Get all certificates for a user
   */
  static async findByUser(userId) {
    const certificates = await knex('certificates')
      .where({ user_id: userId })
      .orderBy('issued_at', 'desc');
    return certificates;
  }

  /**
   * Get certificate with related data (user, course)
   */
  static async findWithDetails(certificateId) {
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
      .where('certificates.id', certificateId)
      .first();
    
    return certificate;
  }

  /**
   * Delete a certificate
   */
  static async delete(id) {
    return await knex('certificates')
      .where({ id })
      .del();
  }
}

module.exports = Certificate;
