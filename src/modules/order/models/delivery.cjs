'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DeliveryStatus extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      DeliveryStatus.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    }
  }
  DeliveryStatus.init({
    order_id: DataTypes.INTEGER,
    status: DataTypes.STRING,
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'DeliveryStatus',
    tableName: 'delivery_status'
  });
  return DeliveryStatus;
};