const staffRepository = require('../repositories/staffRepository');
const { validateStaffData } = require('../validators/staffValidator');
const userRepository = require('../../auth/repositories/userRepository');
const emailService = require('../../../services/emailService');
const { generateUniqueUsername } = require('../../../utils/usernameGenerator');
const crypto = require('crypto');
const logger = require('../../../config/winston');

class StaffController {
  /**
   * Get all staff members
   * GET /api/staff
   */
  async getAllStaff(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        department,
        employment_status,
        employment_type,
        search
      } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        department,
        employment_status,
        employment_type,
        search
      };

      const [staff, total] = await Promise.all([
        staffRepository.getAllStaff(filters),
        staffRepository.getStaffCount(filters)
      ]);

      res.json({
        success: true,
        data: staff,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff member by ID
   * GET /api/staff/:id
   */
  async getStaffById(req, res, next) {
    try {
      const { id } = req.params;
      const staff = await staffRepository.getStaffById(id);

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      res.json({
        success: true,
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff member by staff ID
   * GET /api/staff/by-staff-id/:staffId
   */
  async getStaffByStaffId(req, res, next) {
    try {
      const { staffId } = req.params;
      const staff = await staffRepository.getStaffByStaffId(staffId);

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      res.json({
        success: true,
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new staff member
   * POST /api/staff
   */
  async createStaff(req, res, next) {
    try {
      const staffData = req.body;

      // Validate data
      const validation = validateStaffData(staffData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Check if email already exists in staff
      const existingStaff = await staffRepository.getStaffByEmail(staffData.email);
      if (existingStaff) {
        return res.status(409).json({
          success: false,
          message: 'Staff member with this email already exists'
        });
      }

      // Add audit fields
      staffData.created_by = req.user?.id;
      staffData.updated_by = req.user?.id;

      const staff = await staffRepository.createStaff(staffData);

      // Auto-create user account if email doesn't have one
      let userCreated = false;
      let generatedPassword = null;
      
      try {
        // Check if user account already exists with this email
        const existingUser = await userRepository.findByEmail(staffData.email);
        
        if (!existingUser) {
          // Generate unique username
          const username = await generateUniqueUsername(async (username) => {
            const existingUser = await userRepository.findByUsername(username);
            return existingUser !== null;
          });

          // Generate secure random password
          generatedPassword = crypto.randomBytes(12).toString('base64').slice(0, 12);

          // Determine role based on department/position (default to instructor)
          const staffRole = staffData.department?.toLowerCase().includes('admin') ? 'admin' : 'instructor';
          const roleId = await userRepository.getDefaultRoleId(); // Gets 'user' role, we'll need to get correct role

          // Create user account
          await userRepository.create({
            username,
            email: staffData.email,
            password: generatedPassword,
            first_name: staffData.first_name,
            last_name: staffData.last_name,
            phone: staffData.phone,
            role_id: roleId,
            institution_id: req.user?.institution_id || null
          });

          userCreated = true;
          logger.info('User account created for staff member', {
            staffId: staff.id,
            email: staffData.email,
            username
          });

          // Send credentials email
          await emailService.sendAccountCreatedEmail({
            email: staffData.email,
            username,
            password: generatedPassword,
            firstName: staffData.first_name,
            lastName: staffData.last_name,
            roleName: staffRole
          });

          logger.info('Credentials email sent to staff member', {
            staffId: staff.id,
            email: staffData.email
          });
        } else {
          logger.info('User account already exists for staff member', {
            staffId: staff.id,
            email: staffData.email,
            userId: existingUser.id
          });
        }
      } catch (userError) {
        // Log error but don't fail staff creation
        logger.error('Failed to create user account for staff member', {
          staffId: staff.id,
          email: staffData.email,
          error: userError.message
        });
      }

      res.status(201).json({
        success: true,
        message: userCreated 
          ? 'Staff member created successfully. User account created and credentials sent via email.'
          : 'Staff member created successfully. User account already exists for this email.',
        data: staff,
        user_created: userCreated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update staff member
   * PUT /api/staff/:id
   */
  async updateStaff(req, res, next) {
    try {
      const { id } = req.params;
      const staffData = req.body;

      // Check if staff exists
      const existing = await staffRepository.getStaffById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      // Check email uniqueness if email is being updated
      if (staffData.email && staffData.email !== existing.email) {
        const emailExists = await staffRepository.getStaffByEmail(staffData.email);
        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'Email already in use by another staff member'
          });
        }
      }

      // Add audit field
      staffData.updated_by = req.user?.id;

      const staff = await staffRepository.updateStaff(id, staffData);

      res.json({
        success: true,
        message: 'Staff member updated successfully',
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update custom fields
   * PATCH /api/staff/:id/custom-fields
   */
  async updateCustomFields(req, res, next) {
    try {
      const { id } = req.params;
      const { custom_fields } = req.body;

      const staff = await staffRepository.updateCustomFields(id, custom_fields);

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      res.json({
        success: true,
        message: 'Custom fields updated successfully',
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update metadata
   * PATCH /api/staff/:id/metadata
   */
  async updateMetadata(req, res, next) {
    try {
      const { id } = req.params;
      const { metadata } = req.body;

      const staff = await staffRepository.updateMetadata(id, metadata);

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      res.json({
        success: true,
        message: 'Metadata updated successfully',
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete staff member
   * DELETE /api/staff/:id
   */
  async deleteStaff(req, res, next) {
    try {
      const { id } = req.params;

      const staff = await staffRepository.deleteStaff(id);

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      res.json({
        success: true,
        message: 'Staff member deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update employment status
   * PATCH /api/staff/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'on-leave', 'suspended', 'terminated', 'retired'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid employment status'
        });
      }

      const staff = await staffRepository.updateStaffStatus(id, status);

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      res.json({
        success: true,
        message: 'Employment status updated successfully',
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff by department
   * GET /api/staff/department/:department
   */
  async getByDepartment(req, res, next) {
    try {
      const { department } = req.params;
      const staff = await staffRepository.getStaffByDepartment(department);

      res.json({
        success: true,
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get department statistics
   * GET /api/staff/statistics/departments
   */
  async getDepartmentStats(req, res, next) {
    try {
      const stats = await staffRepository.getDepartmentStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employment statistics
   * GET /api/staff/statistics/employment
   */
  async getEmploymentStats(req, res, next) {
    try {
      const stats = await staffRepository.getEmploymentStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming reviews
   * GET /api/staff/upcoming-reviews
   */
  async getUpcomingReviews(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const staff = await staffRepository.getUpcomingReviews(parseInt(days));

      res.json({
        success: true,
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update staff
   * POST /api/staff/bulk-update
   */
  async bulkUpdate(req, res, next) {
    try {
      const { staff_ids, update_data } = req.body;

      if (!staff_ids || !Array.isArray(staff_ids) || staff_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid staff IDs'
        });
      }

      // Add audit field
      update_data.updated_by = req.user?.id;

      await staffRepository.bulkUpdateStaff(staff_ids, update_data);

      res.json({
        success: true,
        message: `${staff_ids.length} staff members updated successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate new staff ID
   * GET /api/staff/generate-id
   */
  async generateStaffId(req, res, next) {
    try {
      const staffId = await staffRepository.generateStaffId();

      res.json({
        success: true,
        data: { staff_id: staffId }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export staff to CSV
   * GET /api/staff/export/csv
   */
  async exportToCSV(req, res, next) {
    try {
      const { department, employment_status } = req.query;
      
      const filters = { department, employment_status };
      const staff = await staffRepository.getAllStaff(filters);

      // Generate CSV
      const headers = [
        'Staff ID', 'First Name', 'Middle Name', 'Last Name', 'Email', 'Phone',
        'Department', 'Position', 'Employment Type', 'Status', 'Hire Date',
        'Date of Birth', 'Gender', 'State of Origin', 'NIN', 'BVN'
      ];

      const rows = staff.map(s => [
        s.staff_id,
        s.first_name,
        s.middle_name || '',
        s.last_name,
        s.email,
        s.phone || '',
        s.department,
        s.position,
        s.employment_type,
        s.employment_status,
        s.hire_date || '',
        s.date_of_birth || '',
        s.gender || '',
        s.state_of_origin || '',
        s.nin || '',
        s.bvn || ''
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="staff_export_${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StaffController();
