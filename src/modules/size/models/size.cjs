'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Size extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Size.belongsToMany(models.Product, {
        through: models.ProductSize,
        foreignKey: 'size_id',
        as: 'products'
      });

      Size.hasMany(models.ProductSize, {
        as: 'productSizes',
        foreignKey: 'size_id'
      });
    }
  }
  Size.init({
    name: {
        type: DataTypes.STRING,
        unique:true,
        allowNull: false
      },
  }, {
    sequelize,
    modelName: 'Size',
    tableName: 'sizes',
  });
  return Size;
};