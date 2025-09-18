'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'product_sizes',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          product_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'products',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          size_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          stock: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          price_override: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true, // null = use product's base price
            validate: { min: 0 }
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_sizes');
  },
};
