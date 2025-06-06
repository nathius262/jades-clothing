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

const index_view = async (req, res) => {
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

const shop_view = async (req, res) => {
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

const detail_view = async (req, res) => {
    try {
        res.render('detail', {
            pageTitle: "detail"
        })
    } catch (err) {
        res.status(500).render('./errors/500', { message: 'Internal Server Error', error: err.message });
        
    }
};


const checkout_view = async (req, res) => {
    try {
        // Get cart from cookies or initialize empty cart
        let cart = [];

        try {
            if (!req.session.cart || !req.session.jades_cart) cart = JSON.parse(req.cookies.jades_cart) || JSON.parse(req.cookies.cart)
            else if (!req.cookies.jades_cart) cart = req.session.jades_cart || req.session.cart
            else cart = [];
        } catch (error) {
            console.log(error)
            cart = [];
        }

        

        // Fetch product details for each item in cart
        const cartItems = await Promise.all(cart.map(async (item) => {
            const product = await productService.findById(item.product);
            return {
                id: item.product,
                quantity: item.quantity,
                price: product.price,
                name: product.name,
                images: product.images,
                description: product.description,
                itemTotal: item.quantity * product.price
            };
        }));
        
        // Calculate totals
        const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cartItems.reduce((sum, item) => sum + item.itemTotal, 0);

        res.render('checkout', {
            pageTitle: "Checkout",
            cartItems,
            totalQty,
            totalPrice,
        });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).render('./errors/500', { 
            message: 'Internal Server Error', 
            error: err.message 
        });
    }
};


export {index_view, shop_view, detail_view, checkout_view}