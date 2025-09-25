'use strict';
const { Model } = require('sequelize');
const generateUniqueSlug = require('../../../utils/generate_slug.cjs'); // Import the slug helper function

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {

      Product.belongsToMany(models.Category, {
        through: 'product_categories',
        foreignKey: 'product_id',
        as: 'categories'
      });

      // One-to-many with Image
      Product.hasMany(models.Image, {
        foreignKey: 'product_id',
        as: 'images'
      });

      Product.belongsToMany(models.Size, {
        through: models.ProductSize,
        foreignKey: 'product_id',
        as: 'sizes'
      });

      Product.hasMany(models.ProductSize, {
        as: 'productSizes',
        foreignKey: 'product_id'
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
      short_description: DataTypes.STRING(160), // For meta descriptions
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
  Product.beforeValidate(async (product) => {
    if (!product.slug) {
      product.slug = await generateUniqueSlug(product.name, Product);
    }
  });

  Product.beforeUpdate(async (product) => {
    if (product.changed('name')) {
      product.slug = await generateUniqueSlug(product.name, Product);
    }
  });

  return Product;
};
