/**
 * Partner Service
 * Handles business logic for partnership inquiries
 */

const knex = require('../../config/knex');

class PartnerService {
    /**
     * Create a new partnership inquiry
     */
    async createPartner(data) {
        const { inquiry_type, full_name, organization, email_address, message } = data;

        if (!inquiry_type || !full_name || !organization || !email_address || !message) {
            throw new Error('All fields are required');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email_address)) {
            throw new Error('Invalid email format');
        }

        // Check for duplicate email (open inquiry)
        const existingPartner = await knex('partners')
            .where('email_address', email_address)
            .whereNot('status', 'replied') // Optional: allow new inquiry if previous one is resolved
            .first();

        if (existingPartner) {
            throw new Error('An active inquiry with this email address already exists.');
        }

        const [partner] = await knex('partners')
            .insert({
                inquiry_type,
                full_name,
                organization,
                email_address,
                message,
                status: 'new'
            })
            .returning('*');

        // Send emails asynchronously
        try {
            const emailService = require('../../services/emailService');
            // We use the returned partner object (partner)
            await Promise.all([
                emailService.sendPartnerConfirmationEmail(partner),
                emailService.sendPartnerAdminNotificationEmail(partner)
            ]);
        } catch (error) {
            console.error('Failed to send partnership emails:', error);
            // Don't throw error to client, as partnership was created
        }

        return partner;
    }

    /**
     * Get all partnership inquiries with pagination
     */
    async getPartners(params = {}) {
        const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = params;
        const offset = (page - 1) * limit;

        const validSortFields = ['id', 'inquiry_type', 'full_name', 'organization', 'email_address', 'status', 'created_at', 'updated_at'];
        const safeSortBy = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        const safeSortOrder = ['asc', 'desc'].includes(sort_order?.toLowerCase()) ? sort_order : 'desc';

        const query = knex('partners').select('*');

        // Get total count
        const [{ count }] = await knex('partners').count('id as count');
        const total = parseInt(count);

        // Get paginated results
        const partners = await query
            .orderBy(safeSortBy, safeSortOrder)
            .limit(limit)
            .offset(offset);

        return {
            partners,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                total_pages: Math.ceil(total / limit)
            }
        };
    }
}

module.exports = new PartnerService();
