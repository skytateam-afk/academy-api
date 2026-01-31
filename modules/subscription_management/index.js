/**
 * Subscription Management Module
 * Handles subscription tiers and user subscriptions
 */

const subscriptionRoutes = require('./routes/subscriptionRoutes');

module.exports = {
    routes: subscriptionRoutes,
    basePath: '/subscriptions'
};
