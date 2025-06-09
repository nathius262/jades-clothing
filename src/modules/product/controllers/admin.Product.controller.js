import * as service from '../services/admin.Product.service.js';
import * as category from '../../category/services/admin.Category.service.js';
import db from '../../../models/index.cjs';

export const findAll = async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const data = await service.findAll({limit, offset});
    res.status(200).render('admins/product_list', {
      success: true,
      pageTitle: "Admin",
      products: data.products,
      currentPage:page,
      totalPages: data.totalPages,
      totalItems: data.totalItems
    });
  } catch (err) {
    console.log(err)
    res.status(500).render('errors/500', { error: err.message });
  }
};

export const findById = async (req, res) => {
  try {
    const categories = await category.findAll()
    const data = await service.findById(req.params.id);
    const productCategoryIds = new Set(data.categories.map(category => category.id));
    console.log(productCategoryIds)
    res.status(200).render('./admins/product_update', {
      success: true,
      pageTitle: "Update Record",
      product: data,
      categories,
      productCategoryIds
    });
  } catch (err) {
    res.status(404).render('errors/500', { error: err.message });
  }
};

export const create = async (req, res) => {
  try {

    const request_data = req.body

    if (req.files && Array.isArray(req.files)) {
      // Handle multiple files uploaded
      request_data.images = req.files.map(file => file.path);  // Extract Cloudinary URLs
    } else if (req.file) {
      // Handle a single file uploaded (in case multer handles single file upload differently)
      request_data.images = [req.file.path];  // Wrap it in an array for consistency
    } else {
      request_data.images = [];  // No files uploaded
    }

    const data = await service.create(request_data);
    res.status(201).json({ success: true, data, redirectTo: '/admin/product/' });
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const data = await service.update(req.params.id, req.body);
    res.status(200).json({ success: true, data, redirectTo: '/admin/product/'+req.params.id });
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message });
  }
};

export const destroy = async (req, res) => {
  try {
    const data = await service.destroy(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted successfully', data, redirectTo: '/admin/product/' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const renderCreate = async (req, res) => {
  const categories = await category.findAll();
  try {
    res.status(200).render('./admins/product_create', {
      categories: categories,
      pageTitle: "Create Product"
    });
  } catch (err) {
    res.status(500).render('errors/500', { error: err.message });
  }
};

export const uploadImages = async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await db.Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Handle uploaded files from `req.files`
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const imagePromises = files.map(file => {
      // You can upload to cloud storage here (e.g., Cloudinary) and get the URL back
      // const imageUrl = cloudinaryUploadFunction(file); // Example function
      return db.Image.create({
        url: file.path, // Or the cloud URL
        productId: product.id
      });
    });

    // Save the images in the database
    await Promise.all(imagePromises);

    // Fetch updated product images
    const updatedImages = await db.Image.findAll({ where: { productId } });

    res.status(200).json({ images: updatedImages });

  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'An error occurred while uploading images' });
  }
};

export const deleteImage = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the image in the database by its ID
    const image = await db.Image.findByPk(id);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Extract public_id from the image URL using your helper function
    const publicId = getPublicIdFromUrl(image.url, { resource_type: 'image' });

    // Delete the image from Cloudinary using the extracted public ID
    const cloudinaryResult = await cloudinary.uploader.destroy(publicId);

    if (cloudinaryResult.result !== 'ok') {
      return res.status(500).json({ error: 'Failed to delete image from Cloudinary' });
    }

    // Delete the image from the database
    await image.destroy();

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};