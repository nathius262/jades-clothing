'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductSize extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of DataTypes lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ProductSize.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
      });

      ProductSize.belongsTo(models.Size, {
        foreignKey: 'size_id',
        as: 'size'
      });
    }

  }
  ProductSize.init({
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    size_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sizes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    price_override: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true, // null = use product's base price
      validate: { min: 0 }
    },
  }, {
    sequelize,
    modelName: 'ProductSize',
    tableName: 'product_sizes'
  });
  return ProductSize;
};