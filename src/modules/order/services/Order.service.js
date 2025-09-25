import db from '../../../models/index.cjs';
import { v4 as uuidv4 } from 'uuid';
import * as productService from '../../product/services/Product.service.js';


export async function createOrder(paymentData, paymentIntent, cartItems) {
    const transaction = await db.sequelize.transaction();
    try {
        // Validate cartItems - this remains required
        if (!Array.isArray(cartItems)) throw new Error('Cart items must be an array');
        if (cartItems.length === 0) throw new Error('Cart is empty');

        // Try to extract address from multiple possible sources
        const addressData = getAddressFromAnySource(paymentIntent);

        // Create the Order (address no longer required)
        const order = await db.Order.create({
            tracking_id: uuidv4(),
            customer_email: paymentData.customer.email,
            customer_phone: paymentData.customer.phone,
            total_amount: paymentData.amount / 100,
            currency: paymentData.currency,
            status: 'confirmed',
            paidAt: paymentData.paid_at,
            payment_channel: paymentData.channel,
            gateway_response: paymentData.gateway_response,
            delivery_eligible: !!addressData, // Will be true if address exists
        }, { transaction });

        // Create Address only if available (no error if missing)
        if (addressData) {
            await db.Address.create({
                order_id: order.id,
                customer_email: paymentData.customer.email,
                street_address: addressData.street_address,
                city: addressData.city,
                state: addressData.state,
                country: addressData.country,
            }, { transaction });
        }

        // Validate stock before processing items
        for (const item of cartItems) {
        await productService.checkStock(item.product, item.sizeId, item.quantity);
        }

        // Process order items (safe now, stock is available)
        const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product,
        size_id: item.sizeId || null,
        quantity: item.quantity,
        price: item.price,
        total_price: item.quantity * item.price,
        }));
        await db.OrderItem.bulkCreate(orderItems, { transaction });

        // Reduce stock (since we already checked availability)
        for (const item of cartItems) {
        if (item.sizeId) {
            const productSize = await db.ProductSize.findOne({
            where: { product_id: item.product, size_id: item.sizeId },
            transaction
            });
            if (productSize) {
            productSize.stock -= item.quantity;
            await productSize.save({ transaction });
            continue;
            }
        }
        const product = await db.Product.findByPk(item.product, { transaction });
        if (product) {
            product.stock -= item.quantity;
            await product.save({ transaction });
        }
        }



        // Set delivery status
        await db.DeliveryStatus.create({
            order_id: order.id,
            status: addressData ? 'pending' : 'ready_for_pickup',
            notes: addressData 
                ? 'Shipping address provided' 
                : 'No address - customer will pickup'
        }, { transaction });

        await transaction.commit();
        return { success: true, order_id: order.id, tracking_id: order.tracking_id };

    } catch (error) {
        await transaction.rollback();
        console.error('Order creation failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Helper function to flexibly get address from any source
function getAddressFromAnySource(paymentData) {
    // 1. Check Stripe shipping address first
    if (paymentData.shipping?.address) {
        return {
            street_address: paymentData.shipping.address.line1,
            city: paymentData.shipping.address.city,
            state: paymentData.shipping.address.state,
            country: paymentData.shipping.address.country
        };
    }

    // 2. Check metadata
    if (paymentData.metadata) {
        const fromMeta = {
            street_address: paymentData.metadata.address || paymentData.metadata.street_address,
            city: paymentData.metadata.city,
            state: paymentData.metadata.state,
            country: paymentData.metadata.country
        };
        if (fromMeta.street_address && fromMeta.city) return fromMeta;
    }

    // 3. Check billing address
    if (paymentData.billing_details?.address) {
        return {
            street_address: paymentData.billing_details.address.line1,
            city: paymentData.billing_details.address.city,
            state: paymentData.billing_details.address.state,
            country: paymentData.billing_details.address.country
        };
    }

    // Return null if no address found (no error thrown)
    return null;
}


export const getOrders = async (page, limit) => {
    const offset = (page - 1) * limit;

    const { rows: orders, count: totalOrderItems } = await db.Order.findAndCountAll({
        attributes: ['id', 'tracking_id', 'customer_email', 'customer_phone', 'total_amount', 'currency', 'status', 'paidAt', 'payment_channel', 'gateway_response', 'updatedAt', 'createdAt'],
        include: [
            { model: db.DeliveryStatus, as: 'delivery_status', attributes: ['status'] }
        ],
        limit,
        offset,
        distinct: true,
        order: [['updatedAt', 'DESC'], ['createdAt', 'DESC']]
    });

    const totalOrderPages = Math.ceil(totalOrderItems / limit);

    return { orders: orders, totalOrderPages: totalOrderPages, totalOrderItems: totalOrderItems, currentOrderPage: page }
}


export const getOrderById = async (id) => {

        const order = await db.Order.findByPk(id, {
        attributes: ['id', 'tracking_id', 'customer_email', 'customer_phone', 'total_amount', 'currency', 'status', 'paidAt', 'payment_channel', 'gateway_response', 'updatedAt', 'createdAt'],
        include: [
            { model: db.Address, as: 'address', attributes: ['street_address', 'city', 'state', 'country'] },
            { model: db.DeliveryStatus, as: 'delivery_status', attributes: ['status'] },
            {
                model: db.OrderItem,
                as: 'items',
                attributes: ['quantity', 'price', 'total_price'],
                include: [
                    { model: db.Product, as: 'product', attributes: ['id', 'name'] },
                    { model: db.Size, as: 'size', attributes: ['id', 'name'] } 
                ]
            },
        ],
    });


    if (!order) return null;
    return order;
}

export const getOrderByTrackingId = async (tracking_id) => {
    try {
        // Fetch order details
        const order = await db.Order.findOne({
        where: { tracking_id },
        attributes: ['tracking_id'],
        include: [
            {
                model: db.OrderItem,
                as: 'items',
                attributes: ['quantity', 'price'],
                include: [
                    { model: db.Product, as: 'product', attributes: ['name'] },
                    { model: db.Size, as: 'size', attributes: ['name'] }   // ✅ include size
                ]
            },
            { model: db.DeliveryStatus, as: 'delivery_status', attributes: ['status', 'notes', 'updatedAt'] },
        ],
    });

    const orderDetail = {
        status: order.status,
        items: order.items.map(item => ({
            name: item.product.name,
            size: item.size ? item.size.name : null,   // ✅ attach size
            quantity: item.quantity,
            price: item.price,
        })),
        delivery_status: order.delivery_status.map(status => ({
            status: status.status,
            updatedAt: status.updatedAt,
            notes: status.notes
        }))
    };


        return orderDetail;
    } catch (error) {
        console.error('Error tracking order:', error);
        throw new Error('Error fetching record: ' + error.message);

    }
}