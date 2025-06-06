'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Address extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Address.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    }
  }
  Address.init({
    order_id: DataTypes.INTEGER,
    customer_email: DataTypes.STRING,
    street_address: DataTypes.TEXT,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    country: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Address',
    tableName: 'addresses'
  });
  return Address;
};