import * as service from '../services/Product.service.js';
import * as categoryService from '../../category/services/Category.service.js';


export const findAll = async (req, res) => {
  try {
          const { page, limit, offset } = req.query;
          const products = await service.findAll({limit, offset});
          const categories = await categoryService.findAll();
  
          res.render('./list', {
              pageTitle: "Products Listing",
              products: products.products,
              categories,
              currentPage:page,
              totalPage: products.totalPages,
              totalItems: products.totalItems
          })
      } catch (err) {
          console.log(err)
          res.status(500).render('./errors/500', { message: 'Internal Server Error', error: err.message });
          
      }
};

export const findBySlug = async (req, res) => {
  try {
    const data = await service.findBySlug(req.params.slug);
    res.status(200).render('./detail', {
      success: true,
      pageTitle: "Details",
      product: data,
    });
  } catch (err) {
    res.status(500).render('./errors/500', { error: err.message });
  }
};