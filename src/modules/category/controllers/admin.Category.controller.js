import * as service from '../services/admin.Category.service.js';

export const findAll = async (req, res) => {
  try {
    const data = await service.findAll();
    res.status(200).render('admins/list', {
      success: true,
      pageTitle: "Admin",
      categories: data,
    });
  } catch (err) {
    res.status(500).render('error', { error: err.message });
  }
};

export const findById = async (req, res) => {
  try {
    const data = await service.findById(req.params.id);
    res.status(200).render('admins/update', {
      success: true,
      pageTitle: "Update Record",
      category: data,
    });
  } catch (err) {
    res.status(404).render('error', { error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const request_data = req.body;
    const image_url = req.files?.['image_url'] ? req.files['image_url'][0].path : "";
    request_data.image_url = image_url

    const data = await service.create(request_data);
    res.status(201).json({ success: true, data, redirectTo: '/admin/category/' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const request_data = req.body;
    const image_url = req.files?.['image_url'] ? req.files['image_url'][0].path : "";
    request_data.image_url = image_url

    const data = await service.update(req.params.id, request_data);
    res.status(200).json({ success: true, data, redirectTo: '/admin/category/'+req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const destroy = async (req, res) => {
  try {
    const data = await service.destroy(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted successfully', data, redirectTo: '/admin/category/' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const renderCreate = async (req, res) => {
  try {
    res.status(200).render('admins/create', {
      pageTitle: "Create Category"
    });
  } catch (err) {
    res.status(500).render('error', { error: err.message });
  }
};
