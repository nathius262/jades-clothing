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

export const findBySlug = async (slug) => {
  try {
     const item = await db.Product.findOne({
      where: { slug: slug },
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
