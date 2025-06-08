import dotenv from 'dotenv';
import * as productService from '../modules/product/services/Product.service.js';
import * as categoryService from '../modules/category/services/Category.service.js';
import db from '../models/index.cjs';



// Derive the equivalent of __dirname
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();


const page_logo = process.env.PAGELOGO

export const index_view = async (req, res) => {
    try {
        

        //console.log(result.rows)
        res.render('index', {
            pageTitle: "Home",
            pageLogo: page_logo
        });
    } catch (err) {
        res.status(500).render('./errors/500', { message: 'Internal Server Error', error: err.message });
    }
};

export const shop_view = async (req, res) => {
    try {
        const { page, limit, offset } = req.query;
        const products = await productService.findAll({limit, offset});
        const categories = await categoryService.findAll();

        res.render('shop', {
            pageTitle: "Shop",
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

export const detail_view = async (req, res) => {
    try {
        res.render('detail', {
            pageTitle: "detail"
        })
    } catch (err) {
        res.status(500).render('./errors/500', { message: 'Internal Server Error', error: err.message });
        
    }
};

export const about_view = async (req, res) => {
    try {
        res.status(200).render('about', {pageTitle: "About"})
    } catch (error) {
        res.status(500).render('errors/500', {error: error.message})
    }
}

export const contact_view = async (req, res) => {
    try {
        res.status(200).render('contact', {pageTitle: "Contact"})
    } catch (error) {
        res.status(500).render('errors/500', {error: error.message})
    }
}

export const privacy_policy_view = async (req, res) => {
    try {
        res.status(200).render('privacy_policy', {pageTitle: "Privacy-Policy"})
    } catch (error) {
        res.status(500).render('errors/500', {error: error.message})
    }
}

export const terms_condition_view = async (req, res) => {
    try {
        res.status(200).render('terms_condition', {pageTitle: "Terms and Conditions"})
    } catch (error) {
        res.status(500).render('errors/500', {error: error.message})
    }
}

export const searchProducts = async (req, res) => {
  try {
    const { 
      searchTerm,
      name,
      min_price,
      max_price,
      description,
      short_description,
      categories,
      page = 1,
      per_page = 10,
      sort_by,
      sort_order
    } = req.query;

    // Validate and parse inputs
    const numericPage = Math.max(1, parseInt(page));
    const numericPerPage = Math.max(1, Math.min(100, parseInt(per_page)));
    
    // Prepare filters
    const filters = {
      ...(searchTerm && { name: searchTerm, description:searchTerm, short_description:searchTerm }), // Changed to match service expectation
      ...(name && { name }),
      ...(min_price && { minPrice: parseFloat(min_price) }),
      ...(max_price && { maxPrice: parseFloat(max_price) }),
      ...(description && { description }),
      ...(short_description && { short_description }),
      ...(categories && { 
        categoryIds: categories.split(',').map(id => parseInt(id.trim())) 
      }),
      limit: numericPerPage,
      offset: (numericPage - 1) * numericPerPage,
      ...(sort_by && { sortBy: sort_by }),
      ...(sort_order && { sortOrder: sort_order.toUpperCase() })
    };

    console.log(filters)

    const result = await productService.filterProducts(filters);

    // Get all categories for the filter dropdown
    const allCategories = await db.Category.findAll();

    // Build query string helper
    const buildQueryString = (params) => {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value);
          }
        }
      }
      return queryParams.toString();
    };

    const totalPages = Math.ceil(result.total / numericPerPage);

    console.log(result)

    res.render('search', {
      products: result.products,
      totalItems: result.total,
      totalPages: totalPages,
      currentPage: numericPage,
      searchQuery: searchTerm || name,
      categories: allCategories,
      currentFilters: {
        searchTerm,
        min_price,
        max_price,
        categories: categories ? categories.split(',') : [],
        sort_by,
        sort_order
      },
      viewMode: req.query.view || 'grid',
      startItem: (numericPage - 1) * numericPerPage + 1,
      endItem: Math.min(numericPage * numericPerPage, result.total),
      queryString: buildQueryString(req.query),
      prevPageQuery: buildQueryString({ ...req.query, page: numericPage - 1 }),
      nextPageQuery: buildQueryString({ ...req.query, page: numericPage + 1 }),
      pageNumbers: Array.from({ length: totalPages }, (_, i) => ({
        number: i + 1,
        query: buildQueryString({ ...req.query, page: i + 1 })
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).render('search', {
      error: 'Error performing search',
      products: [],
      totalItems: 0,
      categories: await db.Category.findAll()
    });
  }
};