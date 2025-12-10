/**
 * Contact Management Service
 * Handles business logic for contact submissions
 */

const knex = require('../../config/knex');

class ContactService {
  /**
   * Submit a new contact form (public endpoint)
   */
  async submitContact(data, metadata = {}) {
    const { name, email, phone, subject, message } = data;

    // Validation
    if (!name || !email || !subject || !message) {
      throw new Error('Name, email, subject, and message are required');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const submission = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      subject: subject.trim(),
      message: message.trim(),
      status: 'new',
      ip_address: metadata.ipAddress || null,
      user_agent: metadata.userAgent || null,
    };

    const [created] = await knex('contact_submissions')
      .insert(submission)
      .returning('*');

    return created;
  }

  /**
   * List contact submissions (admin)
   */
  async listSubmissions(params = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      query,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = params;

    const offset = (page - 1) * limit;

    // Build query
    let queryBuilder = knex('contact_submissions')
      .select(
        'contact_submissions.*',
        knex.raw(`
          CASE 
            WHEN replied_by IS NOT NULL THEN 
              json_build_object(
                'id', u.id,
                'name', CONCAT(u.first_name, ' ', u.last_name),
                'email', u.email
              )
            ELSE NULL
          END as replied_by_user
        `)
      )
      .leftJoin('users as u', 'contact_submissions.replied_by', 'u.id');

    // Filters
    if (status) {
      queryBuilder.where('contact_submissions.status', status);
    }

    if (query) {
      queryBuilder.where(function() {
        this.where('name', 'ilike', `%${query}%`)
          .orWhere('email', 'ilike', `%${query}%`)
          .orWhere('subject', 'ilike', `%${query}%`)
          .orWhere('message', 'ilike', `%${query}%`);
      });
    }

    // Get total count (use a simpler query without joins for counting)
    let countQuery = knex('contact_submissions');
    
    if (status) {
      countQuery.where('status', status);
    }
    
    if (query) {
      countQuery.where(function() {
        this.where('name', 'ilike', `%${query}%`)
          .orWhere('email', 'ilike', `%${query}%`)
          .orWhere('subject', 'ilike', `%${query}%`)
          .orWhere('message', 'ilike', `%${query}%`);
      });
    }
    
    const [{ count }] = await countQuery.count('id as count');
    const total = parseInt(count);

    // Get paginated results
    const submissions = await queryBuilder
      .orderBy(`contact_submissions.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single submission by ID
   */
  async getSubmissionById(id) {
    const submission = await knex('contact_submissions')
      .select(
        'contact_submissions.*',
        knex.raw(`
          CASE 
            WHEN replied_by IS NOT NULL THEN 
              json_build_object(
                'id', u.id,
                'name', CONCAT(u.first_name, ' ', u.last_name),
                'email', u.email
              )
            ELSE NULL
          END as replied_by_user
        `)
      )
      .leftJoin('users as u', 'contact_submissions.replied_by', 'u.id')
      .where('contact_submissions.id', id)
      .first();

    if (!submission) {
      throw new Error('Contact submission not found');
    }

    return submission;
  }

  /**
   * Update submission status and notes (admin)
   */
  async updateSubmission(id, data, userId = null) {
    const { status, admin_notes } = data;

    const submission = await this.getSubmissionById(id);

    const updates = {};

    if (status) {
      if (!['new', 'read', 'replied', 'archived'].includes(status)) {
        throw new Error('Invalid status');
      }
      updates.status = status;

      // Auto-set replied_by and replied_at when status changes to 'replied'
      if (status === 'replied' && userId) {
        updates.replied_by = userId;
        updates.replied_at = knex.fn.now();
      }
    }

    if (admin_notes !== undefined) {
      updates.admin_notes = admin_notes;
    }

    updates.updated_at = knex.fn.now();

    await knex('contact_submissions')
      .where({ id })
      .update(updates);

    return this.getSubmissionById(id);
  }

  /**
   * Mark submission as read (admin)
   */
  async markAsRead(id) {
    const submission = await this.getSubmissionById(id);

    if (submission.status === 'new') {
      await knex('contact_submissions')
        .where({ id })
        .update({ 
          status: 'read',
          updated_at: knex.fn.now()
        });
    }

    return this.getSubmissionById(id);
  }

  /**
   * Mark submission as unread (admin)
   */
  async markAsUnread(id) {
    const submission = await this.getSubmissionById(id);

    if (submission.status === 'read' || submission.status === 'replied' || submission.status === 'archived') {
      await knex('contact_submissions')
        .where({ id })
        .update({ 
          status: 'new',
          updated_at: knex.fn.now()
        });
    }

    return this.getSubmissionById(id);
  }

  /**
   * Delete submission (admin)
   */
  async deleteSubmission(id) {
    await this.getSubmissionById(id); // Check if exists

    await knex('contact_submissions')
      .where({ id })
      .delete();

    return { message: 'Contact submission deleted successfully' };
  }

  /**
   * Get submission statistics (admin)
   */
  async getStatistics() {
    const stats = await knex('contact_submissions')
      .select(
        knex.raw('COUNT(*) as total'),
        knex.raw("COUNT(*) FILTER (WHERE status = 'new') as new_count"),
        knex.raw("COUNT(*) FILTER (WHERE status = 'read') as read_count"),
        knex.raw("COUNT(*) FILTER (WHERE status = 'replied') as replied_count"),
        knex.raw("COUNT(*) FILTER (WHERE status = 'archived') as archived_count"),
        knex.raw('COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL \'7 days\') as last_7_days'),
        knex.raw('COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL \'30 days\') as last_30_days')
      )
      .first();

    return {
      total: parseInt(stats.total),
      new: parseInt(stats.new_count),
      read: parseInt(stats.read_count),
      replied: parseInt(stats.replied_count),
      archived: parseInt(stats.archived_count),
      last_7_days: parseInt(stats.last_7_days),
      last_30_days: parseInt(stats.last_30_days),
    };
  }
}

module.exports = new ContactService();
