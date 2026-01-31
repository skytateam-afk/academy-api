/**
 * Partner Controller
 * Handles incoming requests for partnership inquiries
 */

const partnerService = require('./partner.service');

class PartnerController {
    /**
     * Create a new partnership inquiry
     */
    async createPartner(req, res) {
        try {
            const partner = await partnerService.createPartner(req.body);
            res.status(201).json({
                success: true,
                message: 'Partnership inquiry submitted successfully',
                data: partner
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get all partnership inquiries
     */
    async getPartners(req, res) {
        try {
            const result = await partnerService.getPartners(req.query);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve partnership inquiries',
                error: error.message
            });
        }
    }
}

module.exports = new PartnerController();
