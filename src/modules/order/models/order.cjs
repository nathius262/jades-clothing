'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
      Order.hasMany(models.DeliveryStatus, { foreignKey: 'order_id', as: 'delivery_status' });
      Order.hasOne(models.Address, { foreignKey: 'order_id', as: 'address' });
    }
  }
  Order.init({
    tracking_id: DataTypes.STRING,
    customer_email: DataTypes.STRING,
    customer_phone: DataTypes.STRING,
    total_amount: DataTypes.DECIMAL,
    currency: DataTypes.STRING,
    status: DataTypes.STRING,
    paidAt: DataTypes.DATE,
    payment_channel: DataTypes.STRING,
    gateway_response: DataTypes.STRING,
    delivery_eligible: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders'
  });
  return Order;
};