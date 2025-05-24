'use strict';
const { Model } = require('sequelize');
const generateUniqueSlug = require('../utils/slugHelper.cjs'); // Import the slug helper function

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {

      // One-to-many with Image
      Product.hasMany(models.Image, {
        foreignKey: 'productId',
        as: 'images'
      });

    }
  }

  Product.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      slug: {
        type: DataTypes.STRING,
        unique: true, // e.g. "gold-embroidered-agbada"
        allowNull: false
      },
      shortDescription: DataTypes.STRING(160), // For meta descriptions
      price: {
        type: DataTypes.DECIMAL(10, 2),
        validate: { min: 0 }
      },
      stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 }
      },

    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'products'
    }
  );

  // Use generateUniqueSlug from the helper file in hooks
  Product.beforeValidate(async (category) => {
    if (!category.slug) {
      category.slug = await generateUniqueSlug(category.name, Product);
    }
  });

  Product.beforeUpdate(async (product) => {
    if (product.changed('name')) {
      product.slug = await generateUniqueSlug(product.name, Product);
    }
  });

  return Product;
};
