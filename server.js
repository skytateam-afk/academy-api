// Load environment variables first
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const { apiReference } = require('@scalar/express-api-reference');
const openApiSpec = require('./config/openapi');
// const requestLogger = require('./middleware/requestLogger');

// Import modules
const modules = require('./modules');
const lessonManagement = require('./modules/lesson_management');
const paymentRoutes = require('./routes/paymentRoutes'); // TODO: Move to payments module

// Extract routes from modules
const authRoutes = modules.auth.routes;
const { userRoutes, roleRoutes, permissionRoutes } = modules.userManagement.routes;
const { courseRoutes, categoryRoutes } = modules.courseManagement.routes;
const pathwayRoutes = modules.pathwayManagement.routes;
const { lessonRoutes, moduleRoutes } = lessonManagement.routes;
const notificationRoutes = modules.notifications.routes;
const dashboardRoutes = require('./modules/dashboard/routes/dashboardRoutes');
const announcementRoutes = modules.announcements.routes;
const promotionRoutes = modules.promotions.routes;
const libraryRoutes = modules.libraryManagement.routes;
const staffRoutes = modules.staffManagement.routes;
const classroomRoutes = modules.classroomManagement.routes;
const certificateRoutes = modules.certificates;
const parentRoutes = require('./modules/parents/routes/parentRoutes');
const subscriptionRoutes = require('./modules/subscription_management/routes/subscriptionRoutes');
const xpRoutes = require('./modules/xp_system/routes/xpRoutes');
const wishlistRoutes = require('./modules/wishlist/routes/wishlistRoutes');
const shopRoutes = require('./modules/shop_management/routes/shopRoutes');
const documentRoutes = require('./modules/document_management').routes;
const tagRoutes = modules.tagManagement;
const resultRoutes = require('./modules/results/result.routes');
const menuVisibilityRoutes = modules.menuVisibility;
const contactRoutes = modules.contactManagement;
const searchRoutes = modules.search;

const app = express();

const PORT = process.env.PORT

// Test endpoint BEFORE any middleware - for debugging
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for Scalar to work properly
}));

// CORS configuration - allow all during development
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGIN?.split(',') || []
        : ['https://academy.skyta.space','http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000', 'https://localhost:4000', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:4000'],
    credentials: true
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Disabled middleware temporarily
// app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Public branding endpoint for login page (no authentication required)
app.get('/api/public/branding', async (req, res) => {
    try {
        // Direct database query for minimal institution branding
        const knex = require('./config/knex');
        const result = await knex('institution_settings')
            .select('organization_name', 'logo_url', 'logo_dark_url')
            .limit(1)
            .first();

        const brandingData = {
            success: true,
            data: {
                institution_name: result?.organization_name || 'SchoolBox Admin',
                logo_url: result?.logo_url || null,
                logo_dark_url: result?.logo_dark_url || null
            }
        };

        console.log('Public branding endpoint called - returning branding data');
        res.json(brandingData);
    } catch (error) {
        console.warn('Branding endpoint error:', error.message);
        // Fallback branding data
        res.json({
            success: true,
            data: {
                institution_name: 'SchoolBox Admin',
                logo_url: null,
                logo_dark_url: null
            }
        });
    }
});

// Public shared document endpoints (no authentication required)
const documentController = require('./modules/document_management/controllers/documentController');
app.get('/shared/:token', documentController.getSharedDocument);
app.get('/shared/:token/download', documentController.downloadSharedDocument);

// API Documentation
app.use('/docs', apiReference({
    spec: {
        content: openApiSpec,
    },
    theme: 'purple',
    layout: 'modern',
    darkMode: true,
}));

// OpenAPI specification endpoint
app.get('/api/openapi.json', (req, res) => {
    res.json(openApiSpec);
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/pathways', pathwayRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api', lessonRoutes);
app.use('/api', moduleRoutes);
app.use('/api/settings', require('./modules/settings/routes'));
app.use('/api/library', libraryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/xp', xpRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/personalisations', require('./modules/user/routes/personalisationRoutes'));
app.use('/api/tags', tagRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/menu-visibility', menuVisibilityRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', modules.jobManagement.routes); // Mount Job Routes at /api to allow /api/jobs and /api/admin/jobs
app.use('/api/users', modules.userManagement.routes.workProfileRoutes); // Mount Work Profile Routes


// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl
    });

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
    console.log(`Attempting to start server on port ${PORT}...`);
    const server = app.listen(PORT, () => {
        console.log(`✅ Server successfully listening on port ${PORT}`);
        console.log(`🚀 SchoolBox API running on http://localhost:${PORT}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
        console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
        console.log(`🔐 Initialize database: npm run db:setup`);
    }).on('error', (err) => {
        console.error(`❌ Server failed to start on port ${PORT}`, { error: err.message, code: err.code });
        process.exit(1);
    });

    // Add connection tracking for debugging
    server.on('connection', (socket) => {
        console.log(`🔗 New connection from ${socket.remoteAddress}:${socket.remotePort}`);
    });

    server.on('listening', () => {
        console.log(`🎧 Server listening on ${PORT}`);
    });
}

module.exports = app;
