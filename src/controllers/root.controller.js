import dotenv from 'dotenv';
import * as productService from '../modules/product/services/Product.service.js';
import * as categoryService from '../modules/category/services/Category.service.js';


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