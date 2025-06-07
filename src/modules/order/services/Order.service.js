import db from '../../../models/index.cjs';
import { v4 as uuidv4 } from 'uuid';

export async function createOrder(paymentData, cartItems) {
    const transaction = await db.sequelize.transaction();
    try {
        // Validate cartItems
        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            throw new Error('Invalid or empty cart items.');
        }

        // Extract address from metadata
        const addressData = {
            street_address: paymentData.metadata?.address || null,
            city: paymentData.metadata?.city || null,
            state: paymentData.metadata?.state || null,
            country: paymentData.metadata?.country || null,
        };

        // Validate extracted addressData
        if (!addressData.street_address || !addressData.city || !addressData.state || !addressData.country) {
            throw new Error('Invalid or incomplete address in metadata.');
        }

        // Create the Order
        const order = await db.Order.create({
            tracking_id: uuidv4(),
            customer_email: paymentData.customer.email,
            customer_phone: paymentData.phone || paymentData.metadata?.phone || null,
            total_amount: paymentData.amount / 100, // Convert kobo to NGN
            currency: paymentData.currency,
            status: 'confirmed',
            paidAt: paymentData.paid_at,
            payment_channel: paymentData.channel,
            gateway_response: paymentData.gateway_response,
            delivery_eligible: paymentData.amount / 100 > 1000,
        }, { transaction });

        // Create the Address
        await db.Address.create({
            order_id: order.id,
            customer_email: paymentData.customer.email, // Optional if tied to a user
            street_address: addressData.street_address,
            city: addressData.city,
            state: addressData.state,
            country: addressData.country,
        }, { transaction });

        // Validate and create OrderItems
        const orderItems = cartItems.map(item => {
            // Convert fields to numbers
            const productId = Number(item.product);
            const quantity = Number(item.quantity);
            const price = Number(item.price);

            // Validate numeric values
            if (
                isNaN(productId) ||
                isNaN(quantity) ||
                isNaN(price) ||
                !Number.isInteger(productId) ||
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                throw new Error(`Invalid cart item data: ${JSON.stringify(item)}`);
            }

            return {
                order_id: order.id,
                product_id: item.product,
                quantity: item.quantity,
                price: item.price,
                total_price: item.quantity * item.price,
            };
        });
        await db.OrderItem.bulkCreate(orderItems, { transaction });

        // Reduce Product Stock
        for (const item of cartItems) {
            const product = await db.Product.findByPk(item.product, { transaction });

            if (!product) {
                throw new Error(`Product with ID ${item.product} not found.`);
            }

            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product ID ${item.product}.`);
            }

            // Update stock
            product.stock -= item.quantity;
            await product.save({ transaction });
        }

        //Create initial DeliveryStatus
        await db.DeliveryStatus.create({
            order_id: order.id,
            status: 'pending', // Initial delivery status
            notes: 'Order has been created and is pending processing.',
        }, { transaction });

        // Commit the transaction
        await transaction.commit();
        return { success: true, order_id: order.id, tracking_id: order.tracking_id };
    } catch (error) {
        // Rollback on error
        await transaction.rollback();
        console.error('Error creating order:', error);
        return { success: false, error: error.message };
    }
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
        attributes: ['id', 'tracking_id', 'customerEmail', 'customer_phone', 'total_amount', 'currency', 'status', 'paidAt', 'payment_channel', 'gateway_response', 'updatedAt', 'createdAt'],

        include: [

            { model: db.Address, as: 'address', attributes: ['street_address', 'city', 'state', 'country'] },
            { model: db.DeliveryStatus, as: 'delivery_status', attributes: ['status'] },
            {
                model: db.OrderItem,
                as: 'items',
                attributes: ['quantity', 'price', 'total_price'],
                include: [
                    { model: db.Product, as: 'product', attributes: ['id', 'name'] },
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
                { model: db.OrderItem, as: 'items', attributes:['quantity', 'price'], include: [{ model: db.Product, as: 'product', attributes:['name', 'price'] }] },
                { model: db.DeliveryStatus, as: 'delivery_status', attributes: ['status', 'notes', 'updatedAt'] },
            ],
        });


        if (!order) {
            throw new Error('Not found');
        }

        const orderDetail = {
            status: order.status,
            items: order.items.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.price,
            })),
            delivery_status: order.delivery_status.map(status => ({
                status: status.status,
                updatedAt:status.updatedAt,
                notes:status.notes
            }))
        }

        return orderDetail;
    } catch (error) {
        console.error('Error tracking order:', error);
        throw new Error('Error fetching record: ' + error.message);

    }
}