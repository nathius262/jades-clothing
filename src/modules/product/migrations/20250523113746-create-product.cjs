'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      short_description: {
       type: Sequelize.STRING(160)
      },
      description: {
        type: Sequelize.TEXT
      },
      price: { 
        type: Sequelize.DECIMAL(10,2), 
        validate: { min: 0 } 
      },
      stock: {
        type: Sequelize.INTEGER
      },
      slug: {
        type: Sequelize.DataTypes.STRING, 
        unique:true, 
        allowNull:false
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
    await queryInterface.dropTable('products');
  }
};