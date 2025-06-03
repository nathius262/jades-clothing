'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tracking_id: {
        type: Sequelize.STRING
      },
      customer_email: {
        type: Sequelize.STRING
      },
      customer_phone: {
        type: Sequelize.STRING
      },
      total_amount: {
        type: Sequelize.DECIMAL
      },
      currency: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      paidAt: {
        type: Sequelize.DATE
      },
      payment_channel: {
        type: Sequelize.STRING
      },
      gateway_response: {
        type: Sequelize.STRING
      },
      delivery_eligible: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};