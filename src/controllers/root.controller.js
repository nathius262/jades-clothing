import dotenv from 'dotenv';
import * as productService from '../modules/product/services/Product.service.js';
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
    const limit = 6
    const offset = (1 - 1) * limit;

    const products = await productService.findAll({ offset, limit })

    //console.log(result.rows)
    res.render('index', {
      pageTitle: "Home",
      pageLogo: page_logo,
      products: products.products
    });
  } catch (err) {
    console.log(err)
    res.status(500).render('./errors/500', { message: 'Internal Server Error', error: err.message });
  }
};

export const about_view = async (req, res) => {
  try {
    res.status(200).render('about', { pageTitle: "About" })
  } catch (error) {
    res.status(500).render('errors/500', { error: error.message })
  }
}

export const contact_view = async (req, res) => {
  try {
    res.status(200).render('contact', { pageTitle: "Contact" })
  } catch (error) {
    res.status(500).render('errors/500', { error: error.message })
  }
}

export const privacy_policy_view = async (req, res) => {
  try {
    res.status(200).render('privacy_policy', { pageTitle: "Privacy-Policy" })
  } catch (error) {
    res.status(500).render('errors/500', { error: error.message })
  }
}

export const terms_condition_view = async (req, res) => {
  try {
    res.status(200).render('terms_condition', { pageTitle: "Terms and Conditions" })
  } catch (error) {
    res.status(500).render('errors/500', { error: error.message })
  }
}

export const searchProducts = async (req, res) => {
  try {
    const {
      searchTerm = "",
      min_price = "",
      max_price = "",
      categories = "",
      sort = "",         // combined value e.g. "price:asc"
      page = "1",
      per_page = "12",
      view = "grid"
    } = req.query;

    // Pagination
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, Math.min(100, parseInt(per_page, 10) || 12));
    const offset = (pageNumber - 1) * perPage;

    // Categories → array of ints
    const categoryIds = categories
      ? categories.split(",").map(c => parseInt(c.trim(), 10)).filter(n => !Number.isNaN(n))
      : [];

    // ---------------------------------------------------------------------
    // SORTING (NEW + CLEAN)
    // ---------------------------------------------------------------------
    let sort_by = "";
    let sort_order = "";

    if (sort.includes(":")) {
      const [field, direction] = sort.split(":");
      sort_by = (field || "").trim().toLowerCase();
      sort_order = (direction || "").trim().toLowerCase();
    }

    // Default
    let order = [["createdAt", "DESC"]];
    let resolvedSortOrder = sort_order || "desc";

    const ALLOWED = ["price", "createdat", "name"];

    if (ALLOWED.includes(sort_by)) {
      order = [[sort_by, resolvedSortOrder.toUpperCase()]];
    }

    // ---------------------------------------------------------------------

    const filters = {
      search: searchTerm || null,
      minPrice: min_price ? parseFloat(min_price) : null,
      maxPrice: max_price ? parseFloat(max_price) : null,
      categoryIds,
      order,
      limit: perPage,
      offset
    };

    const { products, total } = await productService.filterProducts(filters);
    const totalPages = Math.ceil(total / perPage);
    const allCategories = await db.Category.findAll();

    // Query Builder
    const buildQuery = (params) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === "") continue;
        if (k === "categories" && Array.isArray(v)) {
          if (v.length === 0) continue;
          qs.append(k, v.join(","));
        } else {
          qs.append(k, v);
        }
      }
      return qs.toString();
    };

    const baseQuery = { ...req.query };

    // Pagination
    const paginationLinks = {
      prev: pageNumber > 1 ? buildQuery({ ...baseQuery, page: pageNumber - 1 }) : null,
      next: pageNumber < totalPages ? buildQuery({ ...baseQuery, page: pageNumber + 1 }) : null,
      pages: Array.from({ length: totalPages }, (_, i) => ({
        number: i + 1,
        query: buildQuery({ ...baseQuery, page: i + 1 })
      }))
    };

    const selectedCategory = categoryIds.length ? String(categoryIds[0]) : "";

    // Render
    res.render("search", {
      products,
      totalItems: total,
      totalPages,
      currentPage: pageNumber,
      categories: allCategories,
      viewMode: view,
      startItem: offset + 1,
      endItem: Math.min(offset + perPage, total),

      // Template filters
      currentFilters: {
        searchTerm,
        categories: selectedCategory,
        min_price,
        max_price,
        sort_by,
        sort_order: resolvedSortOrder
      },

      pageTitle: "Search Results",
      pagination: paginationLinks,
      queryString: buildQuery(req.query)
    });

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).render("search", {
      error: "Error performing search",
      products: [],
      totalItems: 0,
      categories: await db.Category.findAll()
    });
  }
};



export const sitemap_view = async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../../src/views/sitemap.xml'));
  } catch (error) {
    console.error('Error serving sitemap:', error);
    res.status(500).send('Internal Server Error');
  }
};

export const robots_view = async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../../src/views/robots.txt'));
  } catch (error) {
    console.error('Error serving robots.txt:', error);
    res.status(500).send('Internal Server Error');
  }
};