import db from '../../../models/index.cjs';
import { getPublicIdFromUrl } from '../../product/utils/utils.js';



export const findAll = async () => {
  try {
    return await db.Category.findAll();
  } catch (error) {
    throw new Error('Error fetching records: ' + error.message);
  }
};

export const findById = async (id) => {
  try {
    const item = await db.Category.findByPk(id);
    if (!item) throw new Error('Not found');
    return item;
  } catch (error) {
    throw new Error('Error fetching record: ' + error.message);
  }
};

export const create = async (data) => {

  try {
    return await db.Category.create(data);
  } catch (error) {
    throw new Error('Error creating record: ' + error.message);
  }
};

export const update = async (id, data) => {

  let {
    name, 
    description,
    image_url
  } = data;

  const transactionOptions = {
    retry: {
      max:5,
      match:[
        'SQLITE_BUSY'
      ],
      backoffBase:1000,
      backoffExponent:1.1
    }
  };

  const transaction = await db.sequelize.transaction(transactionOptions);
  try {
    const item = await db.Category.findByPk(id);
    if (!item) throw new Error('Not found');

    // Check if new image is uploaded and delete the old one from Cloudinary
    if (image_url && item.image_url) {
      console.log("deleting old image")
      await cloudinary.uploader.destroy(getPublicIdFromUrl(item.image_url, { resource_type: 'image' }));
    }

    if(image_url == ""){
      image_url = item.image_url
    }

    await item.update({name, description, image_url});

    await transaction.commit();

    return item
  } catch (error) {
    console.error('Error updating data:', error);
    await transaction.rollback();
    throw new Error('Error updating record: ' + error.message);
  }
};

export const destroy = async (id) => {
  try {
    const item = await db.Category.findByPk(id);
    if (!item) throw new Error('Not found');
    if(item.image_url){
      await cloudinary.uploader.destroy(getPublicIdFromUrl(color.image_url, { resource_type: 'image' }));

      }
    return await item.destroy();
  } catch (error) {
    throw new Error('Error deleting record: ' + error.message);
  }
};
