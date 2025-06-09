import * as service from '../services/admin.Order.service.js';

export const findAll = async (req, res) => {


  try {
    const {page, limit, offset} = req.pagination;
    const data = await service.findAll({limit, offset});
    res.status(200).render('./admins/order_list', {
      success: true,
      pageTitle: "Admin",
      orders: data.orders,
      currentPage: page,
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
    const data = await service.findById(req.params.id);
    res.status(200).render('./admins/order_update', {
      success: true,
      pageTitle: "Update Record",
      order: data,
    });
  } catch (err) {
    console.log(err)
    res.status(404).render('errors/500', { error: err.message });
  }
};


export const update = async (req, res) => {
  try {
    const {status} = req.body
    const data = await service.update(req.params.id, status);
    res.status(200).json({ success: true, data, message:"update successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const destroy = async (req, res) => {
  try {
    const data = await service.destroy(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted successfully', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
