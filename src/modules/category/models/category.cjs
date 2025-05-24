'use strict';
const { Model } = require('sequelize');
const generateUniqueSlug = require('../../product/utils/slugHelper.cjs'); // Import the slug helper function

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Many-to-Many relationship with Product
      Category.belongsToMany(models.Product, {
        through: 'ProductCategory',  // Junction table
        foreignKey: 'categoryId',
        as: 'products'               // Alias for related products
      });
    }
  }
  Category.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    slug: {
      type: DataTypes.STRING,
      unique: true,  // Ensures the slug is unique
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Category',
    tableName:'categories',
  });

  Category.beforeValidate(async (category) => {
    if (!category.slug) {
      category.slug = await generateUniqueSlug(category.name, Category);
    }
  });

  Category.beforeUpdate(async (category) => {
    if (category.changed('name')) {
      category.slug = await generateUniqueSlug(category.name, Category);
    }
  });
  
  return Category;
};