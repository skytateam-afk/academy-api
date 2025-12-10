const jobController = require('./controllers/jobController');
const jobService = require('./services/jobService');
const jobRoutes = require('./routes/jobRoutes');

module.exports = {
    controllers: {
        jobController
    },
    services: {
        jobService
    },
    routes: jobRoutes
};
