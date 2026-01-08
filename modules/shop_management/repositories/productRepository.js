/**
 * Product Repository
 * Handles database operations for shop products
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');
const storageService = require('../../../services/storageService');

class ProductRepository {
  /**
   * Get all products with pagination and filtering
   */
  async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 12,
        search,
        categoryId,
        isPublished,
        isFeatured,
        minPrice,
        maxPrice,
        stockStatus,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      const offset = (page - 1) * limit;

      // Build query
      let query = knex('shop_products as p')
        .leftJoin('shop_categories as c', 'p.category_id', 'c.id')
        .select(
          'p.*',
          'c.name as category_name',
          'c.slug as category_slug'
        );

      // Apply filters
      if (search) {
        query = query.where(function() {
          this.where('p.name', 'ilike', `%${search}%`)
            .orWhere('p.description', 'ilike', `%${search}%`)
            .orWhere('p.sku', 'ilike', `%${search}%`);
        });
      }

      if (categoryId) {
        query = query.where('p.category_id', categoryId);
      }

      if (typeof isPublished === 'boolean') {
        query = query.where('p.is_published', isPublished);
      }

      if (typeof isFeatured === 'boolean') {
        query = query.where('p.is_featured', isFeatured);
      }

      if (minPrice !== undefined) {
        query = query.where('p.price', '>=', minPrice);
      }

      if (maxPrice !== undefined) {
        query = query.where('p.price', '<=', maxPrice);
      }

      if (stockStatus) {
        query = query.where('p.stock_status', stockStatus);
      }

      // Get total count
      const countQuery = query.clone().clearSelect().count('* as count').first();
      const { count } = await countQuery;
      const total = parseInt(count);

      // Apply sorting
      const validSortFields = ['created_at', 'name', 'price', 'sales_count', 'view_count', 'rating_average'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      query = query.orderBy(`p.${sortField}`, sortOrder);

      // Apply pagination
      const products = await query.limit(limit).offset(offset);

      // Get images for each product
      for (const product of products) {
        product.images = await this.getProductImages(product.id);
        product.primary_image = product.images.find(img => img.is_primary)?.image_url || product.images[0]?.image_url || null;
      }

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in ProductRepository.getAll', { error: error.message });
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getById(id) {
    try {
      const product = await knex('shop_products as p')
        .leftJoin('shop_categories as c', 'p.category_id', 'c.id')
        .where('p.id', id)
        .select(
          'p.*',
          'c.name as category_name',
          'c.slug as category_slug'
        )
        .first();

      if (product) {
        // Get product images
        product.images = await this.getProductImages(id);
        product.primary_image = product.images.find(img => img.is_primary)?.image_url || product.images[0]?.image_url || null;
        
        // Get product tags
        product.tags = await this.getProductTags(id);
      }

      return product;
    } catch (error) {
      logger.error('Error in ProductRepository.getById', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Get product by slug
   */
  async getBySlug(slug) {
    try {
      const product = await knex('shop_products as p')
        .leftJoin('shop_categories as c', 'p.category_id', 'c.id')
        .where('p.slug', slug)
        .select(
          'p.*',
          'c.name as category_name',
          'c.slug as category_slug'
        )
        .first();

      if (product) {
        product.images = await this.getProductImages(product.id);
        product.primary_image = product.images.find(img => img.is_primary)?.image_url || product.images[0]?.image_url || null;
        product.tags = await this.getProductTags(product.id);
      }

      return product;
    } catch (error) {
      logger.error('Error in ProductRepository.getBySlug', { error: error.message, slug });
      throw error;
    }
  }

  /**
   * Get featured products
   */
  async getFeatured(limit = 10) {
    try {
      const products = await knex('shop_products as p')
        .leftJoin('shop_categories as c', 'p.category_id', 'c.id')
        .where('p.is_featured', true)
        .where('p.is_published', true)
        .select(
          'p.*',
          'c.name as category_name',
          'c.slug as category_slug'
        )
        .orderBy('p.created_at', 'desc')
        .limit(limit);

      for (const product of products) {
        product.images = await this.getProductImages(product.id);
        product.primary_image = product.images.find(img => img.is_primary)?.image_url || product.images[0]?.image_url || null;
      }

      return products;
    } catch (error) {
      logger.error('Error in ProductRepository.getFeatured', { error: error.message });
      throw error;
    }
  }

  /**
   * Get product images
   */
  async getProductImages(productId) {
    try {
      return await knex('shop_product_images')
        .where('product_id', productId)
        .orderBy('display_order', 'asc')
        .select('*');
    } catch (error) {
      logger.error('Error in ProductRepository.getProductImages', { error: error.message, productId });
      throw error;
    }
  }

  /**
   * Get product tags
   */
  async getProductTags(productId) {
    try {
      return await knex('shop_product_tags as spt')
        .join('tags as t', 'spt.tag_id', 't.id')
        .where('spt.product_id', productId)
        .select('t.id', 't.name', 't.slug');
    } catch (error) {
      logger.error('Error in ProductRepository.getProductTags', { error: error.message, productId });
      throw error;
    }
  }

  /**
   * Create product
   */
  async create(productData) {
    const trx = await knex.transaction();
    
    try {
      // Generate slug from name if not provided
      if (!productData.slug) {
        let baseSlug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Ensure slug is unique
        let slug = baseSlug;
        let counter = 1;
        while (await trx('shop_products').where('slug', slug).first()) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        productData.slug = slug;
      }

      // Validate SKU uniqueness if provided
      if (productData.sku) {
        const existing = await trx('shop_products').where('sku', productData.sku).first();
        if (existing) {
          throw new Error('SKU already exists');
        }
      }

      // Validate category if provided
      if (productData.category_id) {
        const category = await trx('shop_categories').where('id', productData.category_id).first();
        if (!category) {
          throw new Error('Category not found');
        }
      }

      const [product] = await trx('shop_products')
        .insert(productData)
        .returning('*');

      await trx.commit();
      return product;
    } catch (error) {
      await trx.rollback();
      logger.error('Error in ProductRepository.create', { error: error.message });
      throw error;
    }
  }

  /**
   * Update product
   */
  async update(id, productData) {
    try {
      // Check if product exists
      const existing = await knex('shop_products').where('id', id).first();
      if (!existing) {
        return null;
      }

      // Generate new slug if name is being updated
      if (productData.name && productData.name !== existing.name && !productData.slug) {
        let baseSlug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        let slug = baseSlug;
        let counter = 1;
        while (await knex('shop_products').where('slug', slug).whereNot('id', id).first()) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        productData.slug = slug;
      }

      // Validate SKU uniqueness if being updated
      if (productData.sku && productData.sku !== existing.sku) {
        const skuExists = await knex('shop_products')
          .where('sku', productData.sku)
          .whereNot('id', id)
          .first();
        
        if (skuExists) {
          throw new Error('SKU already exists');
        }
      }

      // Validate category if provided
      if (productData.category_id && productData.category_id !== existing.category_id) {
        const category = await knex('shop_categories').where('id', productData.category_id).first();
        if (!category) {
          throw new Error('Category not found');
        }
      }

      const [product] = await knex('shop_products')
        .where('id', id)
        .update({
          ...productData,
          updated_at: new Date()
        })
        .returning('*');

      return product;
    } catch (error) {
      logger.error('Error in ProductRepository.update', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Delete product
   */
  async delete(id) {
    try {
      // Check if product exists
      const existing = await knex('shop_products').where('id', id).first();
      if (!existing) {
        return false;
      }

      // Check if product has any orders
      const orderCount = await knex('shop_order_items')
        .where('product_id', id)
        .count('* as count')
        .first();

      if (parseInt(orderCount.count) > 0) {
        throw new Error('Cannot delete product with existing orders');
      }

      const deleted = await knex('shop_products').where('id', id).del();
      return deleted > 0;
    } catch (error) {
      logger.error('Error in ProductRepository.delete', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Add product image
   */
  async addImage(productId, imageData) {
    try {
      // Check if product exists
      const product = await knex('shop_products').where('id', productId).first();
      if (!product) {
        throw new Error('Product not found');
      }

      // Check image count (max 10)
      const { count } = await knex('shop_product_images')
        .where('product_id', productId)
        .count('* as count')
        .first();
      
      if (parseInt(count) >= 10) {
        throw new Error('Product can have a maximum of 10 images');
      }

      // If this is the first image or marked as primary, set as primary
      const isPrimary = imageData.isPrimary || imageData.is_primary || parseInt(count) === 0;

      // If setting as primary, remove primary flag from other images
      if (isPrimary) {
        await knex('shop_product_images')
          .where('product_id', productId)
          .update({ is_primary: false });
      }

      // Convert camelCase to snake_case for database insertion
      const insertData = {
        product_id: productId,
        image_url: imageData.imageUrl || imageData.image_url,
        alt_text: imageData.altText || imageData.alt_text || null,
        display_order: imageData.displayOrder || imageData.display_order || 0,
        is_primary: isPrimary
      };

      const [image] = await knex('shop_product_images')
        .insert(insertData)
        .returning('*');

      return image;
    } catch (error) {
      logger.error('Error in ProductRepository.addImage', { error: error.message, productId });
      throw error;
    }
  }

  /**
   * Delete product image
   */
  async deleteImage(productId, imageId) {
    try {
      // Check if image exists
      const image = await knex('shop_product_images')
        .where('id', imageId)
        .where('product_id', productId)
        .first();
      
      if (!image) {
        return false;
      }

      // Check if this is the last image (products must have at least 1 image)
      const { count } = await knex('shop_product_images')
        .where('product_id', productId)
        .count('* as count')
        .first();
      
      if (parseInt(count) <= 1) {
        throw new Error('Product must have at least 1 image');
      }

      // If deleting primary image, set another image as primary
      if (image.is_primary) {
        const nextImage = await knex('shop_product_images')
          .where('product_id', productId)
          .whereNot('id', imageId)
          .orderBy('display_order', 'asc')
          .first();
        
        if (nextImage) {
          await knex('shop_product_images')
            .where('id', nextImage.id)
            .update({ is_primary: true });
        }
      }

      // Delete from database
      const deleted = await knex('shop_product_images').where('id', imageId).del();
      
      // Delete from Cloudflare R2
      if (deleted > 0 && image.image_url) {
        try {
          const fileKey = storageService.extractFileKey(image.image_url);
          if (fileKey) {
            await storageService.deleteFile(fileKey);
            logger.info('Product image deleted from R2', { imageId, fileKey });
          }
        } catch (storageError) {
          // Log error but don't fail the operation if R2 deletion fails
          logger.error('Failed to delete image from R2', { 
            imageId, 
            imageUrl: image.image_url,
            error: storageError.message 
          });
        }
      }
      
      return deleted > 0;
    } catch (error) {
      logger.error('Error in ProductRepository.deleteImage', { error: error.message, imageId });
      throw error;
    }
  }

  /**
   * Set primary image
   */
  async setPrimaryImage(productId, imageId) {
    const trx = await knex.transaction();
    
    try {
      // Check if image exists and belongs to product
      const image = await trx('shop_product_images')
        .where('id', imageId)
        .where('product_id', productId)
        .first();
      
      if (!image) {
        await trx.rollback();
        return false;
      }

      // Remove primary flag from all images
      await trx('shop_product_images')
        .where('product_id', productId)
        .update({ is_primary: false });

      // Set new primary image
      await trx('shop_product_images')
        .where('id', imageId)
        .update({ is_primary: true });

      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      logger.error('Error in ProductRepository.setPrimaryImage', { error: error.message, productId, imageId });
      throw error;
    }
  }

  /**
   * Update stock quantity
   */
  async updateStock(productId, quantity, operation = 'set') {
    try {
      let query = knex('shop_products').where('id', productId);

      if (operation === 'increment') {
        query = query.increment('stock_quantity', quantity);
      } else if (operation === 'decrement') {
        query = query.decrement('stock_quantity', quantity);
      } else {
        query = query.update({ stock_quantity: quantity });
      }

      await query;

      // Update stock status
      const product = await this.getById(productId);
      let stockStatus = 'in_stock';
      
      if (product.stock_quantity <= 0) {
        stockStatus = product.allow_backorders ? 'on_backorder' : 'out_of_stock';
      }

      await knex('shop_products')
        .where('id', productId)
        .update({ stock_status: stockStatus });

      return await this.getById(productId);
    } catch (error) {
      logger.error('Error in ProductRepository.updateStock', { error: error.message, productId });
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(productId) {
    try {
      await knex('shop_products')
        .where('id', productId)
        .increment('view_count', 1);
    } catch (error) {
      logger.error('Error in ProductRepository.incrementViewCount', { error: error.message, productId });
      // Don't throw error for view count increment
    }
  }

  /**
   * Toggle publish status
   */
  async togglePublish(productId, isPublished) {
    try {
      const updateData = { is_published: isPublished };
      if (isPublished) {
        updateData.published_at = new Date()
      }

      const [product] = await knex('shop_products')
        .where('id', productId)
        .update(updateData)
        .returning('*');

      return product;
    } catch (error) {
      logger.error('Error in ProductRepository.togglePublish', { error: error.message, productId });
      throw error;
    }
  }

  /**
   * Toggle featured status
   */
  async toggleFeatured(productId, isFeatured) {
    try {
      const [product] = await knex('shop_products')
        .where('id', productId)
        .update({ is_featured: isFeatured })
        .returning('*');

      return product;
    } catch (error) {
      logger.error('Error in ProductRepository.toggleFeatured', { error: error.message, productId });
      throw error;
    }
  }
}

module.exports = new ProductRepository();
