/**
 * Migration: Create Shop Management System
 * Creates shop products, orders, cart, and related tables
 */

exports.up = async function(knex) {
  // Create shop_products table
  await knex.schema.createTable('shop_products', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.text('description');
    table.text('short_description');
    table.uuid('category_id').references('id').inTable('shop_categories').onDelete('SET NULL');
    table.string('sku', 100).unique();
    table.decimal('price', 10, 2).notNullable();
    table.decimal('compare_at_price', 10, 2);
    table.decimal('cost_price', 10, 2);
    table.string('currency', 3).defaultTo('USD');
    table.integer('stock_quantity').defaultTo(0);
    table.boolean('track_inventory').defaultTo(true);
    table.boolean('allow_backorders').defaultTo(false);
    table.text('stock_status').defaultTo('in_stock')
      .checkIn(['in_stock', 'out_of_stock', 'on_backorder']);
    table.decimal('weight', 10, 2);
    table.jsonb('dimensions');
    table.boolean('is_physical').defaultTo(true);
    table.boolean('is_digital').defaultTo(false);
    table.string('digital_file_url', 255);
    table.string('meta_title', 255);
    table.text('meta_description');
    table.jsonb('metadata');
    table.boolean('is_published').defaultTo(false);
    table.boolean('is_featured').defaultTo(false);
    table.timestamp('published_at');
    table.integer('view_count').defaultTo(0);
    table.integer('sales_count').defaultTo(0);
    table.decimal('rating_average', 3, 2).defaultTo(0);
    table.integer('rating_count').defaultTo(0);
    table.integer('low_stock_threshold').defaultTo(0);
    table.timestamp('created_at').defaultTo(new Date());
    table.timestamp('updated_at').defaultTo(new Date())

    table.index('category_id', 'shop_products_category_id_index');
    table.index('is_published', 'shop_products_is_published_index');
    table.index(['is_published', 'stock_status'], 'shop_products_is_published_stock_status_index');
    table.index('sku', 'shop_products_sku_index');
    table.index('slug', 'shop_products_slug_index');
  });

  // Create shop_product_images table
  await knex.schema.createTable('shop_product_images', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('product_id').notNullable().references('id').inTable('shop_products').onDelete('CASCADE');
    table.string('image_url', 255).notNullable();
    table.string('alt_text', 255);
    table.integer('display_order').defaultTo(0);
    table.boolean('is_primary').defaultTo(false);
    table.timestamp('created_at').defaultTo(new Date())

    table.index('product_id', 'shop_product_images_product_id_index');
    table.index(['product_id', 'display_order'], 'shop_product_images_product_id_display_order_index');
    table.index(['product_id', 'is_primary'], 'shop_product_images_product_id_is_primary_index');
  });

  // Create shop_product_tags table
  await knex.schema.createTable('shop_product_tags', (table) => {
    table.uuid('product_id').notNullable().references('id').inTable('shop_products').onDelete('CASCADE');
    table.uuid('tag_id').notNullable().references('id').inTable('tags').onDelete('CASCADE');

    table.primary(['product_id', 'tag_id']);
  });

  // Create shop_product_reviews table
  await knex.schema.createTable('shop_product_reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('id').inTable('shop_products').onDelete('CASCADE');
    table.uuid('order_id');
    table.integer('rating').notNullable().checkBetween([1, 5]);
    table.text('review_text');
    table.boolean('is_verified_purchase').defaultTo(false);
    table.boolean('is_published').defaultTo(true);
    table.timestamp('created_at').defaultTo(new Date())
    table.timestamp('updated_at').defaultTo(new Date())

    table.unique(['user_id', 'product_id'], { indexName: 'shop_product_reviews_user_id_product_id_unique' });
    table.index('product_id', 'shop_product_reviews_product_id_index');
    table.index('rating', 'shop_product_reviews_rating_index');
  });

  // Create shop_carts table
  await knex.schema.createTable('shop_carts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('session_id', 255);
    table.timestamp('expires_at');
    table.timestamp('created_at').defaultTo(new Date())
    table.timestamp('updated_at').defaultTo(new Date())

    table.index('session_id', 'shop_carts_session_id_index');
    table.index('user_id', 'shop_carts_user_id_index');
  });

  // Create shop_cart_items table
  await knex.schema.createTable('shop_cart_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('cart_id').notNullable().references('id').inTable('shop_carts').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('id').inTable('shop_products').onDelete('CASCADE');
    table.integer('quantity').defaultTo(1).notNullable();
    table.decimal('price_at_addition', 10, 2).notNullable();
    table.timestamp('created_at').defaultTo(new Date())
    table.timestamp('updated_at').defaultTo(new Date())

    table.unique(['cart_id', 'product_id'], { indexName: 'shop_cart_items_cart_id_product_id_unique' });
    table.index('cart_id', 'shop_cart_items_cart_id_index');
    table.index('product_id', 'shop_cart_items_product_id_index');
  });

  // Create shop_orders table
  await knex.schema.createTable('shop_orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('order_number', 255).notNullable().unique();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('tax_amount', 10, 2).defaultTo(0);
    table.decimal('shipping_amount', 10, 2).defaultTo(0);
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.decimal('total_amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.jsonb('billing_address');
    table.jsonb('shipping_address');
    table.string('customer_email', 255);
    table.string('customer_phone', 255);
    table.text('status').defaultTo('pending')
      .checkIn(['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed']);
    table.text('payment_status').defaultTo('pending')
      .checkIn(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']);
    table.text('fulfillment_status').defaultTo('unfulfilled')
      .checkIn(['unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled']);
    table.string('payment_method', 255);
    table.string('payment_provider_id', 255);
    table.uuid('transaction_id').references('id').inTable('transactions').onDelete('SET NULL');
    table.timestamp('paid_at');
    table.string('tracking_number', 255);
    table.string('tracking_url', 255);
    table.string('shipping_carrier', 255);
    table.text('customer_notes');
    table.text('admin_notes');
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(new Date())
    table.timestamp('updated_at').defaultTo(new Date())

    table.index('created_at', 'shop_orders_created_at_index');
    table.index('order_number', 'shop_orders_order_number_index');
    table.index('payment_status', 'shop_orders_payment_status_index');
    table.index('status', 'shop_orders_status_index');
    table.index('user_id', 'shop_orders_user_id_index');
  });

  // Add foreign key to shop_product_reviews
  await knex.schema.alterTable('shop_product_reviews', (table) => {
    table.foreign('order_id').references('id').inTable('shop_orders').onDelete('SET NULL');
  });

  // Add foreign key to transactions
  await knex.schema.alterTable('transactions', (table) => {
    table.foreign('order_id').references('id').inTable('shop_orders').onDelete('SET NULL');
  });

  // Create shop_order_items table
  await knex.schema.createTable('shop_order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('order_id').notNullable().references('id').inTable('shop_orders').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('id').inTable('shop_products').onDelete('RESTRICT');
    table.string('product_name', 255).notNullable();
    table.string('product_sku', 255);
    table.text('product_description');
    table.string('product_image_url', 255);
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('total_price', 10, 2).notNullable();
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(new Date())

    table.index('order_id', 'shop_order_items_order_id_index');
    table.index('product_id', 'shop_order_items_product_id_index');
  });

  // Create shop_transactions table
  await knex.schema.createTable('shop_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('order_id').notNullable().references('id').inTable('shop_orders').onDelete('CASCADE');
    table.uuid('transaction_id').references('id').inTable('transactions').onDelete('SET NULL');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.text('type').defaultTo('payment')
      .checkIn(['payment', 'refund', 'partial_refund']);
    table.text('notes');
    table.timestamp('created_at').defaultTo(new Date())

    table.index('order_id', 'shop_transactions_order_id_index');
    table.index('transaction_id', 'shop_transactions_transaction_id_index');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('shop_transactions');
  await knex.schema.dropTableIfExists('shop_order_items');
  
  // Remove foreign keys
  await knex.schema.alterTable('transactions', (table) => {
    table.dropForeign('order_id');
  });
  await knex.schema.alterTable('shop_product_reviews', (table) => {
    table.dropForeign('order_id');
  });
  
  await knex.schema.dropTableIfExists('shop_orders');
  await knex.schema.dropTableIfExists('shop_cart_items');
  await knex.schema.dropTableIfExists('shop_carts');
  await knex.schema.dropTableIfExists('shop_product_reviews');
  await knex.schema.dropTableIfExists('shop_product_tags');
  await knex.schema.dropTableIfExists('shop_product_images');
  await knex.schema.dropTableIfExists('shop_products');
};
