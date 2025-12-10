/**
 * Shop Analytics Controller
 */

const knex = require('../../../config/knex');

/**
 * @desc    Get shop analytics
 * @route   GET /api/shop/analytics
 * @access  Private (Admin)
 */
exports.getAnalytics = async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        // Calculate date range based on period
        const now = new Date();
        let startDate = new Date();
        let compareStartDate = new Date();
        
        switch (period) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                compareStartDate.setDate(now.getDate() - 14);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                compareStartDate.setDate(now.getDate() - 60);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                compareStartDate.setDate(now.getDate() - 180);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                compareStartDate.setFullYear(now.getFullYear() - 2);
                break;
            case 'all':
                startDate = new Date(0); // Beginning of time
                compareStartDate = new Date(0);
                break;
            default:
                startDate.setDate(now.getDate() - 30);
                compareStartDate.setDate(now.getDate() - 60);
        }

        // Get revenue by currency for current period (ONLY PAID ORDERS)
        const revenueByCurrency = await knex('shop_orders')
            .where('created_at', '>=', startDate)
            .where('payment_status', 'paid')
            .select('currency')
            .sum('total_amount as total')
            .count('* as order_count')
            .groupBy('currency');

        // Get current period stats (ONLY PAID ORDERS for revenue)
        const currentStats = await knex('shop_orders')
            .where('created_at', '>=', startDate)
            .where('payment_status', 'paid')
            .select(
                knex.raw('COUNT(*) as total_orders'),
                knex.raw('COALESCE(SUM(total_amount), 0) as total_revenue'),
                knex.raw('COALESCE(AVG(total_amount), 0) as average_order_value')
            )
            .first();

        // Get comparison period stats (ONLY PAID ORDERS)
        const compareStats = await knex('shop_orders')
            .where('created_at', '>=', compareStartDate)
            .where('created_at', '<', startDate)
            .where('payment_status', 'paid')
            .select(
                knex.raw('COUNT(*) as total_orders'),
                knex.raw('COALESCE(SUM(total_amount), 0) as total_revenue'),
                knex.raw('COALESCE(AVG(total_amount), 0) as average_order_value')
            )
            .first();

        // Get revenue over time (ONLY PAID ORDERS - daily for last 30 days, otherwise weekly)
        const groupByFormat = period === '7d' || period === '30d' 
            ? "DATE(created_at)"
            : "DATE_TRUNC('week', created_at)";
        
        const revenueOverTime = await knex('shop_orders')
            .where('created_at', '>=', startDate)
            .where('payment_status', 'paid')
            .select(
                knex.raw(`${groupByFormat} as date`),
                'currency',
                knex.raw('COALESCE(SUM(total_amount), 0) as revenue'),
                knex.raw('COUNT(*) as orders')
            )
            .groupBy(knex.raw(groupByFormat))
            .groupBy('currency')
            .orderBy('date', 'asc');

        // Calculate percentage changes
        const revenueChange = compareStats.total_revenue > 0
            ? ((currentStats.total_revenue - compareStats.total_revenue) / compareStats.total_revenue) * 100
            : 0;

        const ordersChange = compareStats.total_orders > 0
            ? ((currentStats.total_orders - compareStats.total_orders) / compareStats.total_orders) * 100
            : 0;

        const aovChange = compareStats.average_order_value > 0
            ? ((currentStats.average_order_value - compareStats.average_order_value) / compareStats.average_order_value) * 100
            : 0;

        // Get total products sold (ONLY FROM PAID ORDERS)
        const productsSold = await knex('shop_order_items')
            .join('shop_orders', 'shop_order_items.order_id', 'shop_orders.id')
            .where('shop_orders.created_at', '>=', startDate)
            .where('shop_orders.payment_status', 'paid')
            .select(
                knex.raw('SUM(quantity) as total_quantity'),
                knex.raw('COUNT(DISTINCT product_id) as unique_products')
            )
            .first();

        // Get orders by status (ALL ORDERS for status distribution)
        const ordersByStatusRaw = await knex('shop_orders')
            .where('created_at', '>=', startDate)
            .select('status')
            .count('* as count')
            .groupBy('status');

        // Get total orders count for percentage (ALL ORDERS)
        const totalOrdersCount = await knex('shop_orders')
            .where('created_at', '>=', startDate)
            .count('* as count')
            .first();

        const totalOrdersForPercentage = parseInt(totalOrdersCount.count) || 1;
        const ordersByStatus = ordersByStatusRaw.map(item => ({
            status: item.status,
            count: parseInt(item.count),
            percentage: ((parseInt(item.count) / totalOrdersForPercentage) * 100).toFixed(1)
        }));

        // Get top selling products with currency info (ONLY FROM PAID ORDERS)
        const topProducts = await knex('shop_order_items')
            .join('shop_orders', 'shop_order_items.order_id', 'shop_orders.id')
            .join('shop_products', 'shop_order_items.product_id', 'shop_products.id')
            .where('shop_orders.created_at', '>=', startDate)
            .where('shop_orders.payment_status', 'paid')
            .select(
                'shop_products.id',
                'shop_products.name',
                'shop_orders.currency',
                knex.raw('SUM(shop_order_items.quantity) as quantity'),
                knex.raw('SUM(shop_order_items.total_price) as revenue')
            )
            .groupBy('shop_products.id', 'shop_products.name', 'shop_orders.currency')
            .orderBy('revenue', 'desc')
            .limit(10);

        // Get recent orders with currency
        const recentOrders = await knex('shop_orders')
            .select(
                'id',
                'order_number',
                'total_amount',
                'currency',
                'status as order_status',
                'created_at'
            )
            .orderBy('created_at', 'desc')
            .limit(10);

        // Get cart statistics
        const cartStats = await knex('shop_carts')
            .select(knex.raw('COUNT(*) as total_carts'))
            .first();

        // Calculate conversion rate
        const conversionRate = cartStats.total_carts > 0
            ? ((currentStats.total_orders / cartStats.total_carts) * 100).toFixed(1)
            : 0;

        // Get product statistics
        const productStats = await knex('shop_products')
            .select(
                knex.raw('COUNT(*) as total_products'),
                knex.raw('COUNT(*) FILTER (WHERE is_published = true) as active_products'),
                knex.raw('COUNT(*) FILTER (WHERE stock_quantity > 0 AND stock_quantity < 10) as low_stock_products')
            )
            .first();

        res.json({
            success: true,
            data: {
                totalRevenue: parseFloat(currentStats.total_revenue) || 0,
                revenueChange: parseFloat(revenueChange.toFixed(1)),
                totalOrders: parseInt(currentStats.total_orders) || 0,
                ordersChange: parseFloat(ordersChange.toFixed(1)),
                averageOrderValue: parseFloat(currentStats.average_order_value) || 0,
                aovChange: parseFloat(aovChange.toFixed(1)),
                totalProductsSold: parseInt(productsSold.total_quantity) || 0,
                uniqueProductsSold: parseInt(productsSold.unique_products) || 0,
                revenueByCurrency: revenueByCurrency.map(r => ({
                    currency: r.currency || 'USD',
                    total: parseFloat(r.total) || 0,
                    orderCount: parseInt(r.order_count) || 0
                })),
                revenueOverTime: revenueOverTime.map(r => ({
                    date: r.date,
                    revenue: parseFloat(r.revenue) || 0,
                    orders: parseInt(r.orders) || 0,
                    currency: r.currency || 'USD'
                })),
                ordersByStatus,
                topProducts: topProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    quantity: parseInt(p.quantity),
                    revenue: parseFloat(p.revenue),
                    currency: p.currency || 'USD'
                })),
                recentOrders: recentOrders.map(o => ({
                    id: o.id,
                    orderNumber: o.order_number,
                    totalAmount: parseFloat(o.total_amount),
                    orderStatus: o.order_status,
                    createdAt: o.created_at,
                    currency: o.currency || 'USD'
                })),
                conversionRate: parseFloat(conversionRate),
                totalCartCreated: parseInt(cartStats.total_carts) || 0,
                activeProducts: parseInt(productStats.active_products) || 0,
                totalProducts: parseInt(productStats.total_products) || 0,
                lowStockProducts: parseInt(productStats.low_stock_products) || 0
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve analytics'
        });
    }
};
