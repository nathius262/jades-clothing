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
                attributes: ['url', 'is_primary'],  // Only return image URLs
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
      where: { slug },
      include: [
        { 
          model: db.Category, 
          as: 'categories', 
          through: { attributes: [] } 
        },
        {
          model: db.Size,
          as: 'sizes',
          through: { attributes: ['price_override', 'stock'] } // expose pivot fields
        },
        { 
          model: db.Image, 
          as: 'images', 
          attributes: ['url', 'id', 'is_primary'] 
        }
      ],
    });

    if (!item) throw new Error('Not found');

    // Get related products by categories (excluding current product)
    const categoryIds = item.categories.map(cat => cat.id);
    
    const relatedProducts = await db.Product.findAll({
      where: {
        id: { [db.Sequelize.Op.ne]: item.id }, // Exclude current product
        '$categories.id$': { // Filter by shared categories
          [db.Sequelize.Op.in]: categoryIds
        }
      },
      include: [
        {
          model: db.Category,
          as: 'categories',
          through: { attributes: [] },
          where: { id: { [db.Sequelize.Op.in]: categoryIds } }
        },
        {
          model: db.Image,
          as: 'images',
          attributes: ['url', 'id', 'is_primary'],
          // Remove the where clause for is_primary and handle ordering instead
          required: false,
          order: [
            // Primary images first, then order by id to get consistent "first" image
            ['is_primary', 'DESC'],
            ['id', 'ASC']
          ],
          limit: 1 // Only get one image per product
        }
      ],
      limit: 4,
      distinct: true, // This ensures distinct products in the result
      order: db.Sequelize.literal('RANDOM()'),
      subQuery: false
    });

    return {
      ...item.toJSON(),
      relatedProducts
    };

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