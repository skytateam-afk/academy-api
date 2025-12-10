/**
 * Shop Management Module Migration
 * Creates tables for products, categories, cart, orders, and order items
 */

exports.up = function(knex) {
  return knex.schema
    // Shop Categories
    .createTable('shop_categories', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name', 100).notNullable();
      table.string('slug', 100).notNullable().unique();
      table.text('description');
      table.uuid('parent_id').references('id').inTable('shop_categories').onDelete('SET NULL');
      table.string('icon_url');
      table.integer('display_order').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      table.index('slug');
      table.index('parent_id');
      table.index('is_active');
    })
    
    // Products
    .createTable('shop_products', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name', 255).notNullable();
      table.string('slug', 255).notNullable().unique();
      table.text('description');
      table.text('short_description');
      table.uuid('category_id').references('id').inTable('shop_categories').onDelete('SET NULL');
      table.string('sku', 100).unique();
      table.decimal('price', 10, 2).notNullable();
      table.decimal('compare_at_price', 10, 2); // Original price for showing discounts
      table.decimal('cost_price', 10, 2); // Cost for profit calculations
      table.string('currency', 3).defaultTo('USD');
      
      // Inventory
      table.integer('stock_quantity').defaultTo(0);
      table.boolean('track_inventory').defaultTo(true);
      table.boolean('allow_backorders').defaultTo(false);
      table.enum('stock_status', ['in_stock', 'out_of_stock', 'on_backorder']).defaultTo('in_stock');
      
      // Product details
      table.decimal('weight', 10, 2); // in kg
      table.jsonb('dimensions'); // {length, width, height, unit}
      table.boolean('is_physical').defaultTo(true);
      table.boolean('is_digital').defaultTo(false);
      table.string('digital_file_url');
      
      // SEO and metadata
      table.string('meta_title');
      table.text('meta_description');
      table.jsonb('metadata'); // Flexible metadata storage
      
      // Status and features
      table.boolean('is_published').defaultTo(false);
      table.boolean('is_featured').defaultTo(false);
      table.timestamp('published_at');
      
      // Stats
      table.integer('view_count').defaultTo(0);
      table.integer('sales_count').defaultTo(0);
      table.decimal('rating_average', 3, 2).defaultTo(0.00);
      table.integer('rating_count').defaultTo(0);
      
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      table.index('slug');
      table.index('category_id');
      table.index('sku');
      table.index('is_published');
      table.index(['is_published', 'stock_status']);
    })
    
    // Product Images (multiple images per product)
    .createTable('shop_product_images', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('product_id').notNullable().references('id').inTable('shop_products').onDelete('CASCADE');
      table.string('image_url').notNullable();
      table.string('alt_text');
      table.integer('display_order').defaultTo(0);
      table.boolean('is_primary').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.index('product_id');
      table.index(['product_id', 'is_primary']);
      table.index(['product_id', 'display_order']);
    })
    
    // Product Tags
    .createTable('shop_product_tags', table => {
      table.uuid('product_id').notNullable().references('id').inTable('shop_products').onDelete('CASCADE');
      table.uuid('tag_id').notNullable().references('id').inTable('tags').onDelete('CASCADE');
      table.primary(['product_id', 'tag_id']);
    })
    
    // Shopping Cart
    .createTable('shop_carts', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('session_id'); // For guest users
      table.timestamp('expires_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      table.index('user_id');
      table.index('session_id');
    })
    
    // Cart Items
    .createTable('shop_cart_items', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('cart_id').notNullable().references('id').inTable('shop_carts').onDelete('CASCADE');
      table.uuid('product_id').notNullable().references('id').inTable('shop_products').onDelete('CASCADE');
      table.integer('quantity').notNullable().defaultTo(1);
      table.decimal('price_at_addition', 10, 2).notNullable(); // Price when added to cart
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      table.unique(['cart_id', 'product_id']);
      table.index('cart_id');
      table.index('product_id');
    })
    
    // Orders
    .createTable('shop_orders', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('order_number').notNullable().unique();
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      
      // Order totals
      table.decimal('subtotal', 10, 2).notNullable();
      table.decimal('tax_amount', 10, 2).defaultTo(0);
      table.decimal('shipping_amount', 10, 2).defaultTo(0);
      table.decimal('discount_amount', 10, 2).defaultTo(0);
      table.decimal('total_amount', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('USD');
      
      // Customer information
      table.jsonb('billing_address');
      table.jsonb('shipping_address');
      table.string('customer_email');
      table.string('customer_phone');
      
      // Order status
      table.enum('status', [
        'pending',
        'processing',
        'paid',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
        'failed'
      ]).defaultTo('pending');
      
      table.enum('payment_status', [
        'pending',
        'paid',
        'failed',
        'refunded',
        'partially_refunded'
      ]).defaultTo('pending');
      
      table.enum('fulfillment_status', [
        'unfulfilled',
        'partially_fulfilled',
        'fulfilled',
        'cancelled'
      ]).defaultTo('unfulfilled');
      
      // Payment information
      table.string('payment_method'); // stripe, paystack
      table.string('payment_provider_id'); // Transaction ID from provider
      table.uuid('transaction_id').references('id').inTable('transactions').onDelete('SET NULL');
      table.timestamp('paid_at');
      
      // Tracking
      table.string('tracking_number');
      table.string('tracking_url');
      table.string('shipping_carrier');
      
      // Notes
      table.text('customer_notes');
      table.text('admin_notes');
      table.jsonb('metadata');
      
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      table.index('order_number');
      table.index('user_id');
      table.index('status');
      table.index('payment_status');
      table.index('created_at');
    })
    
    // Order Items
    .createTable('shop_order_items', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('order_id').notNullable().references('id').inTable('shop_orders').onDelete('CASCADE');
      table.uuid('product_id').notNullable().references('id').inTable('shop_products').onDelete('RESTRICT');
      table.string('product_name').notNullable(); // Snapshot at time of order
      table.string('product_sku');
      table.text('product_description');
      table.string('product_image_url');
      table.integer('quantity').notNullable();
      table.decimal('unit_price', 10, 2).notNullable();
      table.decimal('total_price', 10, 2).notNullable();
      table.jsonb('metadata'); // Product attributes at time of purchase
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.index('order_id');
      table.index('product_id');
    })
    
    // Product Reviews
    .createTable('shop_product_reviews', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('product_id').notNullable().references('id').inTable('shop_products').onDelete('CASCADE');
      table.uuid('order_id').references('id').inTable('shop_orders').onDelete('SET NULL');
      table.integer('rating').notNullable(); // 1-5
      table.text('review_text');
      table.boolean('is_verified_purchase').defaultTo(false);
      table.boolean('is_published').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      table.unique(['user_id', 'product_id']);
      table.index('product_id');
      table.index('rating');
      table.check('rating >= 1 AND rating <= 5');
    })
    
    // Shop Transactions (extends main transactions table for shop-specific data)
    .createTable('shop_transactions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('order_id').notNullable().references('id').inTable('shop_orders').onDelete('CASCADE');
      table.uuid('transaction_id').references('id').inTable('transactions').onDelete('SET NULL');
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('USD');
      table.enum('type', ['payment', 'refund', 'partial_refund']).defaultTo('payment');
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.index('order_id');
      table.index('transaction_id');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('shop_transactions')
    .dropTableIfExists('shop_product_reviews')
    .dropTableIfExists('shop_order_items')
    .dropTableIfExists('shop_orders')
    .dropTableIfExists('shop_cart_items')
    .dropTableIfExists('shop_carts')
    .dropTableIfExists('shop_product_tags')
    .dropTableIfExists('shop_product_images')
    .dropTableIfExists('shop_products')
    .dropTableIfExists('shop_categories');
};
