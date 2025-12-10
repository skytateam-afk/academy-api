const knex = require('../../../config/knex');

class Staff {
  /**
   * Get all staff members with optional filters
   */
  static async getAll(filters = {}) {
    let query = knex('staff')
      .select('*')
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc');

    // Apply filters
    if (filters.department) {
      query = query.where('department', filters.department);
    }

    if (filters.employment_status) {
      query = query.where('employment_status', filters.employment_status);
    }

    if (filters.employment_type) {
      query = query.where('employment_type', filters.employment_type);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('first_name', 'ilike', `%${filters.search}%`)
          .orWhere('last_name', 'ilike', `%${filters.search}%`)
          .orWhere('email', 'ilike', `%${filters.search}%`)
          .orWhere('staff_id', 'ilike', `%${filters.search}%`)
          .orWhere('position', 'ilike', `%${filters.search}%`);
      });
    }

    // Pagination
    if (filters.page && filters.limit) {
      const offset = (filters.page - 1) * filters.limit;
      query = query.limit(filters.limit).offset(offset);
    }

    return await query;
  }

  /**
   * Get total count for pagination
   */
  static async getCount(filters = {}) {
    let query = knex('staff')
      .count('* as count')
      .whereNull('deleted_at');

    if (filters.department) {
      query = query.where('department', filters.department);
    }

    if (filters.employment_status) {
      query = query.where('employment_status', filters.employment_status);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('first_name', 'ilike', `%${filters.search}%`)
          .orWhere('last_name', 'ilike', `%${filters.search}%`)
          .orWhere('email', 'ilike', `%${filters.search}%`)
          .orWhere('staff_id', 'ilike', `%${filters.search}%`);
      });
    }

    const result = await query.first();
    return parseInt(result.count);
  }

  /**
   * Get staff member by ID
   */
  static async getById(id) {
    return await knex('staff')
      .where('id', id)
      .whereNull('deleted_at')
      .first();
  }

  /**
   * Get staff member by staff ID
   */
  static async getByStaffId(staffId) {
    return await knex('staff')
      .where('staff_id', staffId)
      .whereNull('deleted_at')
      .first();
  }

  /**
   * Get staff member by email
   */
  static async getByEmail(email) {
    return await knex('staff')
      .where('email', email)
      .whereNull('deleted_at')
      .first();
  }

  /**
   * Create new staff member
   */
  static async create(staffData) {
    // Generate staff ID if not provided
    if (!staffData.staff_id) {
      staffData.staff_id = await this.generateStaffId();
    }

    const [staff] = await knex('staff')
      .insert(staffData)
      .returning('*');

    return staff;
  }

  /**
   * Update staff member
   */
  static async update(id, staffData) {
    const [staff] = await knex('staff')
      .where('id', id)
      .whereNull('deleted_at')
      .update({
        ...staffData,
        updated_at: knex.fn.now()
      })
      .returning('*');

    return staff;
  }

  /**
   * Update custom fields (merge with existing)
   */
  static async updateCustomFields(id, customFields) {
    const staff = await this.getById(id);
    if (!staff) return null;

    const existingCustomFields = staff.custom_fields || {};
    const mergedCustomFields = { ...existingCustomFields, ...customFields };

    return await this.update(id, { custom_fields: mergedCustomFields });
  }

  /**
   * Update metadata (merge with existing)
   */
  static async updateMetadata(id, metadata) {
    const staff = await this.getById(id);
    if (!staff) return null;

    const existingMetadata = staff.metadata || {};
    const mergedMetadata = { ...existingMetadata, ...metadata };

    return await this.update(id, { metadata: mergedMetadata });
  }

  /**
   * Soft delete staff member
   */
  static async delete(id) {
    const [staff] = await knex('staff')
      .where('id', id)
      .whereNull('deleted_at')
      .update({
        deleted_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('*');

    return staff;
  }

  /**
   * Update employment status
   */
  static async updateStatus(id, status) {
    return await this.update(id, { employment_status: status });
  }

  /**
   * Get staff by department
   */
  static async getByDepartment(department) {
    return await knex('staff')
      .where('department', department)
      .whereNull('deleted_at')
      .where('employment_status', 'active')
      .orderBy('last_name');
  }

  /**
   * Get department statistics
   */
  static async getDepartmentStats() {
    return await knex('staff')
      .select('department')
      .count('* as count')
      .whereNull('deleted_at')
      .where('employment_status', 'active')
      .groupBy('department')
      .orderBy('count', 'desc');
  }

  /**
   * Get employment statistics
   */
  static async getEmploymentStats() {
    return {
      by_status: await knex('staff')
        .select('employment_status')
        .count('* as count')
        .whereNull('deleted_at')
        .groupBy('employment_status'),
      by_type: await knex('staff')
        .select('employment_type')
        .count('* as count')
        .whereNull('deleted_at')
        .where('employment_status', 'active')
        .groupBy('employment_type'),
      total: await knex('staff').whereNull('deleted_at').count('* as count').first()
    };
  }

  /**
   * Generate unique staff ID
   */
  static async generateStaffId() {
    const year = new Date().getFullYear();
    const prefix = `STF${year}`;
    
    // Get the last staff ID for this year
    const lastStaff = await knex('staff')
      .where('staff_id', 'like', `${prefix}%`)
      .orderBy('staff_id', 'desc')
      .first();

    if (lastStaff) {
      const lastNumber = parseInt(lastStaff.staff_id.slice(-4));
      const newNumber = (lastNumber + 1).toString().padStart(4, '0');
      return `${prefix}${newNumber}`;
    }

    return `${prefix}0001`;
  }

  /**
   * Get staff members whose contracts/probation are ending soon
   */
  static async getUpcomingReviews(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await knex('staff')
      .whereNull('deleted_at')
      .where('employment_status', 'active')
      .where(function() {
        this.where('confirmation_date', '<=', futureDate)
          .andWhere('confirmation_date', '>', new Date())
          .orWhere('last_appraisal_date', '<=', new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)));
      });
  }

  /**
   * Bulk update staff records
   */
  static async bulkUpdate(staffIds, updateData) {
    return await knex('staff')
      .whereIn('id', staffIds)
      .whereNull('deleted_at')
      .update({
        ...updateData,
        updated_at: knex.fn.now()
      });
  }
}

module.exports = Staff;
