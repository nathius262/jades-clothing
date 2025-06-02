'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Image extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            // One-to-many with products
            Image.belongsTo(models.Product, {
                foreignKey: 'product_id',
                as: 'product'  // Alias for related product
            });
        }
    }
    Image.init({
        url: DataTypes.STRING,
        alt_text: DataTypes.STRING,
        is_primary: DataTypes.BOOLEAN
    }, {
        sequelize,
        modelName: 'Image',
        tableName: 'images'
    });
    return Image;
};