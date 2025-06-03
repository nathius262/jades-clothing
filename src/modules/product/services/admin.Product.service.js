import db from '../../../models/index.cjs';



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
        ],
    });
    if (!item) throw new Error('Not found');
    return item;
  } catch (error) {
    throw new Error('Error fetching record: ' + error.message);
  }
};

export const create = async (data) => {

  console.log(data)

  const { name, short_description, description, price, stock, category_ids, images } = data;

  try {

    const newProduct = await db.Product.create({ name, short_description, description, price, stock });

      // Step 2: Handle many-to-many relationships (categories, colors, sizes, collections, scrubs)
      if (category_ids && category_ids.length > 0) {
          const categories = await db.Category.findAll({ where: { id: category_ids } });
          await newProduct.addCategories(categories);
      }

      // Step 3: Handle multiple image uploads
        if (images && images.length > 0) {
            // Each image gets saved with the newly created product's ID as the foreign key
            const imagePromises = images.map(imageUrl => db.Image.create({ url: imageUrl, product_id: newProduct.id }));
            await Promise.all(imagePromises);
        }


    return newProduct;
  } catch (error) {
    console.log(error)
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
      primaryImageId
    } = data;


    // Convert string IDs to arrays if they're not already arrays
    const toArray = (val) => (Array.isArray(val) ? val : [val]);
  
    // Safely convert strings to arrays and then to integers
    const parsedCategoryIds = toArray(category_ids).map(id => parseInt(id, 10));

    const transactionOptions = {
        retry: {
          max: 5, // Number of retries before throwing an error
          match: [
            'SQLITE_BUSY' // Retry only if database is locked
          ],
          backoffBase: 1000, // Initial retry delay
          backoffExponent: 1.1 // Exponential backoff for retry delays
        }
      };
    
      const transaction = await db.sequelize.transaction(transactionOptions);
    
    
  try {
    const product = await db.Product.findByPk(id);
    
      if (!product) {
        throw new Error('Product not found');
      }
  
      // Update product basic details
      await product.update({ name, short_description, description, price, stock }, { transaction });
  
      // Handle many-to-many relationships with proper logging and error handling
      if (parsedCategoryIds.length >= 0) {
        const categories = await db.Category.findAll({ where: { id: parsedCategoryIds } });
        await product.setCategories(categories, { transaction });
      }
  

      // Handle primary image selection
      if (primaryImageId) {
        await db.Image.update({ is_primary: false }, { where: { id: product.id }, transaction });
        await db.Image.update({ is_primary: true }, { where: { id: parseInt(primaryImageId, 10) }, transaction });
      }
  
      // Commit the transaction if all operations were successful
      await transaction.commit();
    return product;
  } catch (error) {
    console.log(error)
    await transaction.rollback();
    throw new Error('Error updating record: ' + error.message);
  }
};

export const destroy = async (id) => {
  try {
    const product = await db.Product.findByPk(id, { include: db.Image });
        if (!product) return null;

        const images = await db.Image.findAll({ where: { id: product.id } });
        for (const image of images) {
            await cloudinary.uploader.destroy(getPublicIdFromUrl(image.url, { resource_type: 'image' }));
        }

        await db.Image.destroy({ where: { id: product.id } });
        await product.destroy();
        return true;
  } catch (error) {
    throw new Error('Error deleting record: ' + error.message);
  }
};
