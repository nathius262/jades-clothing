import db from '../../../models/index.cjs';
import cloudinary from '../../../config/cloudinaryConfig.js';
import { getPublicIdFromUrl } from '../utils/utils.js';


export const findAll = async ({offset, limit}) => {
  try {
    

    // Fetch products with their relationships, and apply pagination
    const { rows: products, count: totalItems } = await db.Product.findAndCountAll({
        include: [
            {
                model: db.Category,
                as: 'categories',
                through: { attributes: [] },  // Exclude the join table attributes
            },
            {
                model: db.Image,
                as: 'images',
                attributes: ['url'],  // Only return image URLs
            },
        ],
        limit,
        offset,
        distinct: true,
        order: [['createdAt', 'DESC'], ['updatedAt', 'DESC']],
    });
    return {products, 
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      };
  } catch (error) {
    console.log(error)
    throw new Error('Error fetching records: ' + error.message);
  }
};
export const findById = async (id) => {
  try {
    const item = await db.Product.findByPk(id, {
      include: [
        { model: db.Category, as: 'categories', through: { attributes: [] } },
        { model: db.Image, as: 'images', attributes: ['url', 'id', 'is_primary'] },
        {
          model: db.Size,
          as: 'sizes',
          through: { attributes: ['price_override', 'stock'] } // expose pivot fields
        }
      ],
    });
    if (!item) throw new Error('Not found');
    return item;
  } catch (error) {
    console.log(error)
    throw new Error('Error fetching record: ' + error.message);
  }
};

export const create = async (data) => {
  const { name, short_description, description, price, stock, category_ids, images, sizes } = data;

  const transaction = await db.sequelize.transaction();

  try {
    const newProduct = await db.Product.create(
      { name, short_description, description, price, stock },
      { transaction }
    );

    // Handle many-to-many: categories
    if (category_ids && category_ids.length > 0) {
      const categories = await db.Category.findAll({ where: { id: category_ids } });
      await newProduct.addCategories(categories, { transaction });
    }

    // Handle many-to-many: sizes (with pivot fields)
    if (sizes && sizes.length > 0) {
      for (const s of sizes) {
        await db.ProductSize.create({
          product_id: newProduct.id,
          size_id: s.size_id,
          price_override: s.price_override || null,
          stock: s.stock || 0
        }, { transaction });
      }
    }

    // Handle images
    if (images && images.length > 0) {
      const imagePromises = images.map(imageUrl =>
        db.Image.create({ url: imageUrl, product_id: newProduct.id }, { transaction })
      );
      await Promise.all(imagePromises);
    }

    await transaction.commit();
    return newProduct;
  } catch (error) {
    await transaction.rollback();
    throw new Error('Error creating record: ' + error.message);
  }
};

export const update = async (id, data) => {
  const {
    name,
    description,
    short_description,
    price,
    stock,
    category_ids = [],
    primaryImageId,
    sizes = []
  } = data;

  const toArray = (val) => (Array.isArray(val) ? val : [val]);
  const parsedCategoryIds = toArray(category_ids).map(id => parseInt(id, 10));

  const transaction = await db.sequelize.transaction();

  try {
    const product = await db.Product.findByPk(id);
    if (!product) throw new Error('Product not found');

    // Update product fields
    await product.update({ name, short_description, description, price, stock }, { transaction });

    // Update categories
    if (parsedCategoryIds.length >= 0) {
      const categories = await db.Category.findAll({ where: { id: parsedCategoryIds } });
      await product.setCategories(categories, { transaction });
    }

    // Update sizes (clear existing and set new with pivot fields)
    await db.ProductSize.destroy({ where: { product_id: product.id }, transaction });
    if (sizes.length > 0) {
      for (const s of sizes) {
        await db.ProductSize.create({
          product_id: product.id,
          size_id: s.size_id,
          price_override: s.price_override || null,
          stock: s.stock || 0
        }, { transaction });
      }
    }

    // Update primary image
    if (primaryImageId) {
      await db.Image.update({ is_primary: false }, { where: { product_id: product.id }, transaction });
      await db.Image.update({ is_primary: true }, { where: { id: parseInt(primaryImageId, 10) }, transaction });
    }

    await transaction.commit();
    return product;
  } catch (error) {
    await transaction.rollback();
    throw new Error('Error updating record: ' + error.message);
  }
};

export const destroy = async (id) => {
  try {
    const product = await db.Product.findByPk(id, {
      include: [{ model: db.Image, as: 'images' }, { model: db.Size, as: 'sizes' }]
    });
    if (!product) return null;

    // Delete images from cloud + DB
    for (const image of product.images) {
      await cloudinary.uploader.destroy(getPublicIdFromUrl(image.url, { resource_type: 'image' }));
      await image.destroy();
    }

    // Clear product-sizes relation
    await product.setSizes([]);

    await product.destroy();
    return true;
  } catch (error) {
    throw new Error('Error deleting record: ' + error.message);
  }
};
