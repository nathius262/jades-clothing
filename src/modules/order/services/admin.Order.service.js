import db from '../../../models/index.cjs';



export const findAll = async ({limit, offset}) => {
  try {

    const {rows: orders, count:totalItems} =  await db.Order.findAndCountAll({
        include:[
          {model: db.DeliveryStatus, as: 'delivery_status', attributes: ['status']}
        ],
        limit,
        offset,
        distinct: true,
        order:[['updatedAt', 'DESC'], ['createdAt', 'DESC']]
    });
    return {orders, totalItems, totalPages: Math.ceil(totalItems / limit)};
  } catch (error) {
    throw new Error('Error fetching records: ' + error.message);
  }
};

export const findById = async (id) => {
  try {
    const item = await db.Order.findByPk(id, {
      include: [

        {model:db.Address, as:'address', attributes: ['street_address', 'city', 'state', 'country']},
        {model:db.DeliveryStatus, as:'delivery_status', attributes: ['status']},
        {
            model:db.OrderItem, 
            as:'items', 
            attributes: ['quantity', 'price', 'total_price'],
            include:[
              {model:db.Product, as:'product', attributes:['id', 'name']},
            ]
        },

      ],
    });
    if (!item) throw new Error('Not found');
    return item;
  } catch (error) {
    throw new Error('Error fetching record: ' + error.message);
  }
};

export const update = async (id, status) => {
  try {
    const item = await db.Order.findByPk(id, {
      include: [{ model: db.DeliveryStatus, as: 'delivery_status' }],
    });
    if (!item) throw new Error('Not found');

    // Check if delivery status exists
    const deliveryStatus = item.delivery_status;
    if (deliveryStatus && deliveryStatus.length > 0) {
      console.log(`Updating delivery status for ID: ${deliveryStatus[0].id}, New Status: ${status}`);
      
      // Update the delivery status
      const [updatedRows] = await db.DeliveryStatus.update(
        { status },
        { where: { id: deliveryStatus[0].id } }
      );

      if (updatedRows === 0) {
        console.error('DeliveryStatus update failed.');
        return res.status(500).json({ error: 'Failed to update delivery status.' });
      }
    } else {
      console.log(`No delivery status found for Order ID: ${id}`);
      return res.status(404).json({ error: 'Delivery status not found for this order.' });
    }

    // Re-fetch the order with updated delivery status for response
    const updatedOrder = await db.Order.findByPk(id, {
      include: [{ model: db.DeliveryStatus, as: 'delivery_status' }],
    });


    return await updatedOrder;
  } catch (error) {
    throw new Error('Error updating record: ' + error.message);
  }
};

export const destroy = async (id) => {
  try {
    const item = await db.Order.findByPk(id);
    if (!item) throw new Error('Not found');
    return await item.destroy();
  } catch (error) {
    throw new Error('Error deleting record: ' + error.message);
  }
};