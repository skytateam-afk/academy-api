const policyService = require('../services/policyService');

class PolicyController {
    /**
     * Accept policy
     * @route POST /legal/accept-policy
     */
    async acceptPolicy(req, res) {
        try {
            const { policy_version } = req.body;
            const userId = req.user.userId; // Extract from authenticated token
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');

            if (!policy_version) {
                return res.status(400).json({
                    success: false,
                    message: 'policy_version is required'
                });
            }

            const record = await policyService.acceptPolicy(userId, policy_version, ipAddress, userAgent);

            res.status(201).json({
                success: true,
                message: 'Policy accepted successfully',
                data: record
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to accept policy',
                error: error.message
            });
        }
    }
}

module.exports = new PolicyController();
