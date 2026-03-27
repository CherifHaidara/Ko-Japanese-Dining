const db = require('./db');

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

const DEMO_ORDERS = [
  {
    order_id: 1,
    customer_name: 'Alice Chen',
    customer_email: 'alice@example.com',
    items: [
      { name: 'Tonkotsu Ramen', price: 17 },
      { name: 'Edamame', price: 5 }
    ],
    total: '22.00',
    status: 'pending',
    notes: null,
    created_at: '2026-03-27T16:20:40.000Z',
    updated_at: '2026-03-27T16:20:40.000Z'
  },
  {
    order_id: 2,
    customer_name: 'Marcus Lee',
    customer_email: 'marcus@example.com',
    items: [
      { name: 'Dragon Roll', price: 15 },
      { name: 'Miso Soup', price: 4 }
    ],
    total: '19.00',
    status: 'confirmed',
    notes: null,
    created_at: '2026-03-27T16:20:40.000Z',
    updated_at: '2026-03-27T16:20:40.000Z'
  },
  {
    order_id: 3,
    customer_name: 'Sara Kim',
    customer_email: 'sara@example.com',
    items: [
      { name: 'Sashimi Deluxe', price: 38 }
    ],
    total: '38.00',
    status: 'ready',
    notes: null,
    created_at: '2026-03-27T16:20:40.000Z',
    updated_at: '2026-03-27T16:20:40.000Z'
  }
];

let memoryOrders = DEMO_ORDERS.map((order) => ({ ...order }));

function isRecoverableDbError(error) {
  const recoverableCodes = new Set([
    'ECONNREFUSED',
    'ER_ACCESS_DENIED_ERROR',
    'ER_BAD_DB_ERROR',
    'ER_NO_SUCH_TABLE',
    'PROTOCOL_CONNECTION_LOST'
  ]);

  return recoverableCodes.has(error?.code);
}

function getFallbackMessage(error) {
  if (error?.code === 'ER_NO_SUCH_TABLE') {
    return 'Showing demo orders because the orders table is missing on this machine.';
  }

  return 'Showing demo orders because the local database is unavailable on this machine.';
}

function getMemoryOrders() {
  return memoryOrders
    .slice()
    .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));
}

async function listOrders() {
  try {
    const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    return { orders: rows, source: 'database', message: null };
  } catch (error) {
    if (!isRecoverableDbError(error)) {
      throw error;
    }

    return {
      orders: getMemoryOrders(),
      source: 'demo',
      message: getFallbackMessage(error)
    };
  }
}

async function updateOrderStatus(orderId, status) {
  if (!status || !STATUS_FLOW.includes(status)) {
    const error = new Error(`Invalid status. Must be one of: ${STATUS_FLOW.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE order_id = ?',
      [orderId]
    );

    if (rows.length === 0) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      throw error;
    }

    const currentStatus = rows[0].status;
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const newIndex = STATUS_FLOW.indexOf(status);

    if (status !== 'cancelled' && newIndex < currentIndex) {
      const error = new Error(`Cannot move order backwards from "${currentStatus}" to "${status}".`);
      error.statusCode = 400;
      throw error;
    }

    await db.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, orderId]
    );

    return {
      order_id: Number(orderId),
      previous_status: currentStatus,
      new_status: status,
      source: 'database',
      message: null
    };
  } catch (error) {
    if (!isRecoverableDbError(error)) {
      throw error;
    }

    const order = memoryOrders.find((entry) => entry.order_id === Number(orderId));

    if (!order) {
      const notFound = new Error('Order not found.');
      notFound.statusCode = 404;
      throw notFound;
    }

    const currentIndex = STATUS_FLOW.indexOf(order.status);
    const newIndex = STATUS_FLOW.indexOf(status);

    if (status !== 'cancelled' && newIndex < currentIndex) {
      const backwardsError = new Error(`Cannot move order backwards from "${order.status}" to "${status}".`);
      backwardsError.statusCode = 400;
      throw backwardsError;
    }

    const previousStatus = order.status;
    order.status = status;
    order.updated_at = new Date().toISOString();

    return {
      order_id: Number(orderId),
      previous_status: previousStatus,
      new_status: status,
      source: 'demo',
      message: getFallbackMessage(error)
    };
  }
}

module.exports = {
  listOrders,
  updateOrderStatus
};
