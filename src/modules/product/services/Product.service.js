import db from '../../../models/index.cjs';



export const findAll = async ({limit, offset}) => {
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
export const filterProducts = async (filters = {}) => {
  try {
    const {
      name,
      minPrice,
      maxPrice,
      description,
      short_description,
      categoryIds = [],
      limit = 10,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = filters;

    const where = {};
    
    // Text search conditions
    if (name || description || short_description) {
      where[db.Sequelize.Op.or] = [];
      
      if (name) {
        where[db.Sequelize.Op.or].push(
          db.sequelize.where(
            db.sequelize.fn('lower', db.sequelize.col('name')),
            {
              [db.Sequelize.Op.like]: `%${name.toLowerCase()}%`
            }
          )
        );
      }
      
      if (description) {
        where[db.Sequelize.Op.or].push(
          db.sequelize.where(
            db.sequelize.fn('lower', db.sequelize.col('description')),
            {
              [db.Sequelize.Op.like]: `%${description.toLowerCase()}%`
            }
          )
        );
      }

      if (short_description) {
        where[db.Sequelize.Op.or].push(
          db.sequelize.where(
            db.sequelize.fn('lower', db.sequelize.col('short_description')),
            {
              [db.Sequelize.Op.like]: `%${short_description.toLowerCase()}%`
            }
          )
        );
      }
    }
    
    // Price range filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price[db.Sequelize.Op.gte] = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price[db.Sequelize.Op.lte] = maxPrice;
      }
    }

    // Include conditions for associations
    const include = [
      { 
        model: db.Category, 
        as: 'categories', 
        through: { attributes: [] },
        ...(categoryIds.length ? { where: { id: categoryIds } } : {})
      },
      { 
        model: db.Image, 
        as: 'images', 
        attributes: ['url', 'id', 'is_primary'] 
      }
    ];

    // Sorting configuration
    const order = [[sortBy, sortOrder]];

    // Fetch products with filters
    const products = await db.Product.findAll({
      where,
      include,
      order,
      limit,
      offset,
      distinct: true
    });

    // Get total count for pagination
    const total = await db.Product.count({
      where,
      include: categoryIds.length ? include.slice(0, 1) : [],
      distinct: true
    });

    return {
      products,
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Filter products error:', error);
    throw new Error('Error filtering products: ' + error.message);
  }
};