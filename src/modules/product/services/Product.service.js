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

        // include the pivot model and the size model
        {
          model: db.ProductSize,
          as: 'productSizes',
          attributes: ['id', 'size_id', 'stock', 'price_override'],
          include: [
            { model: db.Size, as: 'size', attributes: ['id', 'name'] }
          ]
        }
      ]
    });

    return item;
  } catch (err) {
    throw new Error('Error fetching record: ' + err.message);
  }
};


export const filterProducts = async (filters = {}) => {
  try {
    const {
      search = null,
      name = null,
      description = null,
      short_description = null,
      minPrice = null,
      maxPrice = null,
      categoryIds = [],
      order = null,       // Sequelize order array, e.g. [['price', 'ASC']]
      limit = 12,
      offset = 0
    } = filters;

    const { Op } = db.Sequelize;
    const where = {};

    // ---------- TEXT SEARCH (only if there is something) ----------
    const orConditions = [];

    if (search) {
      orConditions.push(
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { short_description: { [Op.iLike]: `%${search}%` } }
      );
    }

    if (name) orConditions.push({ name: { [Op.iLike]: `%${name}%` } });
    if (description) orConditions.push({ description: { [Op.iLike]: `%${description}%` } });
    if (short_description) orConditions.push({ short_description: { [Op.iLike]: `%${short_description}%` } });

    if (orConditions.length > 0) {
      where[Op.or] = orConditions;
    }

    // ---------- PRICE RANGE ----------
    if (minPrice !== null || maxPrice !== null) {
      where.price = {};
      if (minPrice !== null && !Number.isNaN(minPrice)) where.price[Op.gte] = minPrice;
      if (maxPrice !== null && !Number.isNaN(maxPrice)) where.price[Op.lte] = maxPrice;
    }

    // ---------- ASSOCIATIONS ----------
    // Only attach WHERE on categories if we have valid categoryIds
    const include = [
      {
        model: db.Category,
        as: "categories",
        through: { attributes: [] },
        ...(categoryIds && categoryIds.length ? { where: { id: categoryIds } } : {})
      },
      {
        model: db.Image,
        as: "images",
        attributes: ["id", "url", "is_primary"]
      }
    ];

    // ---------- SORTING (use provided order or fallback) ----------
    const finalOrder = Array.isArray(order) && order.length ? order : [["createdAt", "DESC"]];

    // ---------- QUERY ----------
    const products = await db.Product.findAll({
      where,
      include,
      order: finalOrder,
      limit,
      offset,
      distinct: true
    });

    // Count (only include category join when filtering by categories)
    const countInclude = (categoryIds && categoryIds.length) ? [include[0]] : [];
    const total = await db.Product.count({
      where,
      include: countInclude,
      distinct: true
    });

    return {
      products,
      total,
      totalPages: Math.ceil(total / limit)
    };
  } catch (err) {
    console.error("Filter products error:", err);
    throw new Error("Error filtering products: " + err.message);
  }
};



export const checkStock = async (productId, sizeId, quantity) => {
  if (sizeId) {
    const productSize = await db.ProductSize.findOne({
      where: { product_id: productId, size_id: sizeId }
    });
    if (!productSize || productSize.stock < quantity) {
      throw new Error('Insufficient stock for selected size');
    }
  } else {
    const product = await db.Product.findByPk(productId);
    if (!product || product.stock < quantity) {
      throw new Error('Insufficient stock');
    }
  }
};
