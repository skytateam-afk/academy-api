/**
 * User Controller
 * Handles HTTP requests for user management
 */

const User = require('../models/User');
const { getUserPermissions } = require('../../../middleware/rbac');
const logger = require('../../../config/winston');
const storageService = require('../../../services/storageService');
const emailService = require('../../../services/emailService');
const notificationService = require('../../notifications/services/notificationService');

class UserController {
    /**
     * Get all users
     * GET /api/users
     */
    async getAll(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                search = '',
                role = null,
                is_active = null,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = req.query;

            const result = await User.getAll({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                role,
                is_active: is_active !== null ? is_active === 'true' : null,
                sort_by,
                sort_order
            });

            res.json({
                success: true,
                data: result.users,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error getting users', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error retrieving users',
                error: error.message
            });
        }
    }

    /**
     * Get user by ID
     * GET /api/users/:id
     */
    async getById(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Get user permissions
            const permissions = await getUserPermissions(id);

            res.json({
                success: true,
                data: {
                    ...user,
                    permissions
                }
            });
        } catch (error) {
            logger.error('Error getting user', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error retrieving user',
                error: error.message
            });
        }
    }

    /**
     * Create new user
     * POST /api/users
     */
    async create(req, res) {
        try {
            let {
                username,
                email,
                password,
                first_name,
                last_name,
                phone,
                date_of_birth,
                role_name = 'student'
            } = req.body;

            // Validate required fields (username and password are now optional, will be auto-generated)
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // Auto-generate password if not provided
            let generatedPassword = null;
            if (!password) {
                // Generate a secure random password (12 characters with mix of letters, numbers, and symbols)
                const crypto = require('crypto');
                generatedPassword = crypto.randomBytes(12).toString('base64').slice(0, 12);
                password = generatedPassword;
            } else {
                // Validate password strength if provided
                if (password.length < 8) {
                    return res.status(400).json({
                        success: false,
                        message: 'Password must be at least 8 characters long'
                    });
                }
            }

            const user = await User.create({
                username,
                email,
                password,
                first_name,
                last_name,
                phone,
                date_of_birth,
                role_name
            });

            // Send account created email with credentials (don't block response if it fails)
            if (generatedPassword) {
                emailService.sendAccountCreatedEmail({
                    email: user.email,
                    username: user.username,
                    password: generatedPassword,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    roleName: role_name
                }).catch(err => logger.error('Failed to send account created email', { error: err.message }));
            }

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: user
            });
        } catch (error) {
            logger.error('Error creating user', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error creating user'
            });
        }
    }

    /**
     * Update user
     * PUT /api/users/:id
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Remove fields that shouldn't be updated directly
            delete updates.password;
            delete updates.password_hash;
            delete updates.role_id;
            delete updates.email; // Email changes require verification

            const user = await User.update(id, updates);

            res.json({
                success: true,
                message: 'User updated successfully',
                data: user
            });
        } catch (error) {
            logger.error('Error updating user', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error updating user'
            });
        }
    }

    /**
     * Delete user
     * DELETE /api/users/:id
     */
    async delete(req, res) {
        try {
            const { id } = req.params;

            // Prevent self-deletion
            if (id === req.user.userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete your own account'
                });
            }

            const user = await User.findById(id);
            const deleted = await User.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Send account deleted email notification (don't block response if it fails)
            emailService.sendAccountDeletedEmail({
                email: user.email,
                username: user.username
            }).catch(err => logger.error('Failed to send account deleted email', { error: err.message }));

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting user', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error deleting user',
                error: error.message
            });
        }
    }

    /**
     * Update user role
     * PUT /api/users/:id/role
     */
    async updateRole(req, res) {
        try {
            const { id } = req.params;
            const { role_name } = req.body;

            if (!role_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Role name is required'
                });
            }

            // Prevent changing own role
            if (id === req.user.userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot change your own role'
                });
            }

            const user = await User.updateRole(id, role_name);

            // Send role changed notification (don't block response if it fails)
            notificationService.sendRoleChangedNotification(id, role_name)
                .catch(err => logger.error('Failed to send role changed notification', { error: err.message }));

            // Send role changed email notification (don't block response if it fails)
            emailService.sendRoleChangedEmail({
                email: user.email,
                username: user.username,
                newRole: role_name,
                oldRole: user.role
            }).catch(err => logger.error('Failed to send role changed email', { error: err.message }));

            res.json({
                success: true,
                message: 'User role updated successfully',
                data: user
            });
        } catch (error) {
            logger.error('Error updating user role', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error updating user role'
            });
        }
    }

    /**
     * Update user password
     * PUT /api/users/:id/password
     */
    async updatePassword(req, res) {
        try {
            const { id } = req.params;
            const { current_password, new_password } = req.body;

            if (!current_password || !new_password) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
            }

            // Validate new password strength
            if (new_password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 8 characters long'
                });
            }

            // Only allow users to change their own password or admins to change others
            if (id !== req.user.userId && !req.userPermissions?.includes('user.update')) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only change your own password'
                });
            }

            // Verify current password
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const userWithPassword = await User.findByUsername(user.username);
            const isValid = await User.verifyPassword(current_password, userWithPassword.password_hash);

            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            await User.updatePassword(id, new_password);

            res.json({
                success: true,
                message: 'Password updated successfully'
            });
        } catch (error) {
            logger.error('Error updating password', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error updating password',
                error: error.message
            });
        }
    }

    /**
     * Toggle user active status
     * PATCH /api/users/:id/toggle-status
     */
    async toggleStatus(req, res) {
        try {
            const { id } = req.params;

            // Prevent self-deactivation
            if (id === req.user.userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot deactivate your own account'
                });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const updated = await User.update(id, {
                is_active: !user.is_active
            });

            // Send account status changed notification (don't block response if it fails)
            notificationService.sendAccountStatusNotification(id, updated.is_active)
                .catch(err => logger.error('Failed to send account status notification', { error: err.message }));

            // Send account status changed email notification (don't block response if it fails)
            emailService.sendAccountStatusChangedEmail({
                email: user.email,
                username: user.username,
                isActive: updated.is_active
            }).catch(err => logger.error('Failed to send account status changed email', { error: err.message }));

            res.json({
                success: true,
                message: `User ${updated.is_active ? 'activated' : 'deactivated'} successfully`,
                data: updated
            });
        } catch (error) {
            logger.error('Error toggling user status', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error toggling user status',
                error: error.message
            });
        }
    }

    /**
     * Grant permission to user
     * POST /api/users/:id/permissions
     */
    async grantPermission(req, res) {
        try {
            const { id } = req.params;
            const { permission_name } = req.body;

            if (!permission_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Permission name is required'
                });
            }

            const user = await User.findById(id);
            await User.grantPermission(id, permission_name);

            // Send permission granted notification (don't block response if it fails)
            notificationService.sendPermissionGrantedNotification(id, permission_name)
                .catch(err => logger.error('Failed to send permission granted notification', { error: err.message }));

            // Send permission granted email notification (don't block response if it fails)
            emailService.sendPermissionGrantedEmail({
                email: user.email,
                username: user.username,
                permissionName: permission_name
            }).catch(err => logger.error('Failed to send permission granted email', { error: err.message }));

            res.json({
                success: true,
                message: 'Permission granted successfully'
            });
        } catch (error) {
            logger.error('Error granting permission', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error granting permission'
            });
        }
    }

    /**
     * Revoke permission from user
     * DELETE /api/users/:id/permissions/:permissionName
     */
    async revokePermission(req, res) {
        try {
            const { id, permissionName } = req.params;

            await User.revokePermission(id, permissionName);

            res.json({
                success: true,
                message: 'Permission revoked successfully'
            });
        } catch (error) {
            logger.error('Error revoking permission', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error revoking permission'
            });
        }
    }

    /**
     * Get user permissions
     * GET /api/users/:id/permissions
     */
    async getPermissions(req, res) {
        try {
            const { id } = req.params;

            const permissions = await getUserPermissions(id);

            res.json({
                success: true,
                data: permissions
            });
        } catch (error) {
            logger.error('Error getting user permissions', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error retrieving user permissions',
                error: error.message
            });
        }
    }

    /**
     * Upload user avatar
     * POST /api/users/:id/avatar
     */
    async uploadAvatar(req, res) {
        try {
            const { id } = req.params;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!storageService.validateFileType(req.file.mimetype, allowedTypes)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'
                });
            }

            // Upload to R2
            const uploadResult = await storageService.uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                'avatars',
                { userId: id }
            );

            // Update user avatar URL
            const user = await User.update(id, {
                avatar_url: uploadResult.fileUrl
            });

            res.json({
                success: true,
                message: 'Avatar uploaded successfully',
                data: {
                    avatar_url: user.avatar_url
                }
            });
        } catch (error) {
            logger.error('Error uploading avatar', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error uploading avatar',
                error: error.message
            });
        }
    }

    /**
     * Get public profile by username
     * GET /api/users/public/@:username
     */
    async getPublicProfile(req, res) {
        try {
            const { username } = req.params;

            const profile = await User.getPublicProfile(username);

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found or not public'
                });
            }

            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            logger.error('Error getting public profile', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error retrieving public profile',
                error: error.message
            });
        }
    }

    /**
     * Debug certificate query
     * GET /api/users/debug/:userId
     */
    async debugCertificates(req, res) {
        try {
            const { userId } = req.params;

            const { pool } = require('../../../config/database');
            // Try multiple queries to debug
            const certificatesResultNoFilter = await pool.query(`
                SELECT COUNT(*) as certificates
                FROM certificates c
                WHERE c.user_id = $1
            `, [userId]);

            const certificatesResultWithJoin = await pool.query(`
                SELECT c.*, co.is_published
                FROM certificates c
                LEFT JOIN courses co ON c.course_id = co.id
                WHERE c.user_id = $1
            `, [userId]);

            const certificatesResultFiltered = await pool.query(`
                SELECT COUNT(*) as certificates
                FROM certificates c
                LEFT JOIN courses co ON c.course_id = co.id
                WHERE c.user_id = $1 AND co.is_published
            `, [userId]);

            res.json({
                success: true,
                data: {
                    certificates_no_filter: parseInt(certificatesResultNoFilter.rows[0]?.certificates ?? 0),
                    certificates_with_filter: parseInt(certificatesResultFiltered.rows[0]?.certificates ?? 0),
                    raw_certificates: certificatesResultWithJoin.rows
                }
            });
        } catch (error) {
            logger.error('Error debugging certificates', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error debugging certificates',
                error: error.message
            });
        }
    }

    /**
     * Bulk import users from CSV
     * POST /api/users/bulk-import
     */
    async bulkImport(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Validate file type
            if (!req.file.originalname.endsWith('.csv')) {
                return res.status(400).json({
                    success: false,
                    message: 'Only CSV files are allowed'
                });
            }

            // Parse CSV file
            const csvData = req.file.buffer.toString('utf-8');
            const lines = csvData.split('\n').map(line => line.trim()).filter(line => line);

            if (lines.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'CSV file is empty or contains only headers'
                });
            }

            // Validate headers
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const requiredHeaders = ['email', 'first_name', 'last_name', 'phone'];
            
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required headers: ${missingHeaders.join(', ')}`
                });
            }

            // Get column indices
            const emailIndex = headers.indexOf('email');
            const firstNameIndex = headers.indexOf('first_name');
            const lastNameIndex = headers.indexOf('last_name');
            const phoneIndex = headers.indexOf('phone');

            const results = {
                success: 0,
                failed: 0,
                errors: []
            };

            const crypto = require('crypto');

            // Process each row
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line) continue;

                const columns = line.split(',').map(c => c.trim());
                
                const email = columns[emailIndex] || '';
                const first_name = columns[firstNameIndex] || '';
                const last_name = columns[lastNameIndex] || '';
                const phone = columns[phoneIndex] || '';

                // Validate email
                if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    results.failed++;
                    results.errors.push(`Row ${i + 1}: Invalid or missing email (${email || 'empty'})`);
                    continue;
                }

                try {
                    // Auto-generate password
                    const generatedPassword = crypto.randomBytes(12).toString('base64').slice(0, 12);

                    // Create user with role defaulted to 'student'
                    const user = await User.create({
                        email,
                        password: generatedPassword,
                        first_name: first_name || null,
                        last_name: last_name || null,
                        phone: phone || null,
                        role_name: 'student' // Always default to student for bulk import
                    });

                    // Send welcome email with credentials (non-blocking)
                    emailService.sendAccountCreatedEmail({
                        email: user.email,
                        username: user.username,
                        password: generatedPassword,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        roleName: 'student'
                    }).catch(err => logger.error('Failed to send welcome email', { 
                        error: err.message,
                        userId: user.id 
                    }));

                    results.success++;
                } catch (error) {
                    results.failed++;
                    let errorMessage = error.message;
                    
                    // Make error messages more user-friendly
                    if (errorMessage.includes('Email already exists')) {
                        errorMessage = `Email already exists: ${email}`;
                    } else if (errorMessage.includes('Username already exists')) {
                        errorMessage = `Username conflict for: ${email}`;
                    }
                    
                    results.errors.push(`Row ${i + 1}: ${errorMessage}`);
                }
            }

            logger.info('Bulk import completed', {
                success: results.success,
                failed: results.failed,
                total: lines.length - 1
            });

            res.json({
                success: true,
                message: `Bulk import completed: ${results.success} succeeded, ${results.failed} failed`,
                data: results
            });
        } catch (error) {
            logger.error('Error during bulk import', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error processing bulk import',
                error: error.message
            });
        }
    }
}

module.exports = new UserController();
