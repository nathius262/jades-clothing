'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const sizes = [
        { name: 'S', createdAt: new Date(), updatedAt: new Date() },
        { name: 'M', createdAt: new Date(), updatedAt: new Date() },
        { name: 'L', createdAt: new Date(), updatedAt: new Date() },
        { name: 'XL', createdAt: new Date(), updatedAt: new Date() },
        { name: 'XXL', createdAt: new Date(), updatedAt: new Date() }
      ];

      await queryInterface.bulkInsert('sizes', sizes, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkDelete(
        'sizes',
        { name: { [Sequelize.Op.in]: ['S', 'M', 'L', 'XL', 'XXL'] } },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
