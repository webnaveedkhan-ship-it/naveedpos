const Order = require('../models/Order');
const Product = require('../models/Product');
const CustomerKhata = require('../models/CustomerKhata');
const memoryStore = require('../config/memoryStore');

const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `NPOS-${dateStr}-${rand}`;
};

// @desc    Process a new sale/order, handle Khata debt & atomically decrement stock
// @route   POST /api/orders
// @access  Private (Store Admin, Cashier)
const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      subtotal,
      taxRate = 0,
      taxAmount = 0,
      discountType = 'fixed',
      discountValue = 0,
      discountAmount = 0,
      grandTotal,
      paymentMethod = 'CASH',
      paymentDetails = {},
      customer = {},
      notes = '',
    } = req.body;

    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, message: 'No store tenant associated with user' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    const normalizedPaymentMethod = paymentMethod.toUpperCase();

    // 1. Validation for Khata (Udhar) Payment
    let khataCustomer = null;
    const isKhataSale = normalizedPaymentMethod === 'KHATA' || (normalizedPaymentMethod === 'SPLIT' && (paymentDetails.khataAmount || 0) > 0);
    const khataAmount = normalizedPaymentMethod === 'KHATA' ? Number(grandTotal) : Number(paymentDetails.khataAmount || 0);

    if (isKhataSale) {
      const khataId = customer.khataId;
      const phone = customer.phone?.trim();

      if (!khataId && !phone) {
        return res.status(400).json({
          success: false,
          message: 'Customer information (or selection from Khata ledger) is required for Khata / Udhar sales.',
        });
      }

      if (global.useMemoryStore) {
        khataCustomer = memoryStore.khatas.find(
          (k) => (khataId && k._id === khataId) || (phone && k.phone === phone && k.tenantId === tenantId)
        );

        if (!khataCustomer && customer.name && phone) {
          // Inline auto-create customer khata
          khataCustomer = {
            _id: `khata_${Date.now()}`,
            tenantId,
            name: customer.name.trim(),
            phone: phone,
            address: customer.address || '',
            creditLimit: 0,
            totalDebt: 0,
            status: 'active',
            transactions: [],
            createdAt: new Date(),
          };
          memoryStore.khatas.unshift(khataCustomer);
        }
      } else {
        if (khataId) {
          khataCustomer = await CustomerKhata.findOne({ _id: khataId, tenantId });
        } else if (phone) {
          khataCustomer = await CustomerKhata.findOne({ tenantId, phone });
          if (!khataCustomer && customer.name) {
            khataCustomer = await CustomerKhata.create({
              tenantId,
              name: customer.name.trim(),
              phone: phone,
              creditLimit: 0,
              totalDebt: 0,
            });
          }
        }
      }

      if (!khataCustomer) {
        return res.status(404).json({
          success: false,
          message: 'Selected Khata customer account not found in this store.',
        });
      }

      // Check credit limit
      if (khataCustomer.creditLimit > 0) {
        const potentialDebt = khataCustomer.totalDebt + khataAmount;
        if (potentialDebt > khataCustomer.creditLimit) {
          return res.status(400).json({
            success: false,
            message: `Credit Limit Exceeded! Customer limit is Rs. ${khataCustomer.creditLimit.toLocaleString()}. Current debt: Rs. ${khataCustomer.totalDebt.toLocaleString()}. Purchase would exceed limit by Rs. ${(potentialDebt - khataCustomer.creditLimit).toLocaleString()}.`,
          });
        }
      }
    }

    const orderNumber = generateOrderNumber();

    // 2. IN-MEMORY STORE PATH
    if (global.useMemoryStore) {
      // Stock check & decrement
      for (const item of items) {
        const prod = memoryStore.products.find((p) => p._id === item.product && p.tenantId === tenantId);
        if (!prod) {
          return res.status(404).json({ success: false, message: `Product "${item.title}" not found in catalog.` });
        }
        if (prod.stockQuantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for "${prod.title}". Requested: ${item.quantity}, Available: ${prod.stockQuantity}`,
          });
        }
      }

      for (const item of items) {
        const prod = memoryStore.products.find((p) => p._id === item.product);
        prod.stockQuantity -= item.quantity;
      }

      let previousDebt = 0;
      let balanceAfter = 0;

      // Process Khata Ledger entry if applicable
      if (isKhataSale && khataCustomer) {
        previousDebt = khataCustomer.totalDebt;
        balanceAfter = Number((previousDebt + khataAmount).toFixed(2));
        khataCustomer.totalDebt = balanceAfter;

        khataCustomer.transactions.unshift({
          _id: `tx_${Date.now()}`,
          type: 'UDHAR_GIVEN',
          amount: khataAmount,
          balanceAfter,
          orderId: `ord_${Date.now()}`,
          orderNumber,
          notes: `POS Udhar Sale (${items.length} items)`,
          date: new Date(),
          recordedBy: req.user._id,
          recordedByName: req.user.name,
        });
      }

      const computedSubtotal =
        subtotal !== undefined && !isNaN(Number(subtotal))
          ? Number(subtotal)
          : items.reduce(
              (sum, item) =>
                sum + (Number(item.subtotal) || Number(item.price || 0) * Number(item.quantity || 1)),
              0
            );
      const effectiveGrandTotal =
        grandTotal !== undefined && !isNaN(Number(grandTotal))
          ? Number(grandTotal)
          : Math.max(0, computedSubtotal - Number(discountAmount || 0));
      const totalCost = items.reduce(
        (sum, item) => sum + (Number(item.costPrice || 0) * Number(item.quantity || 1)),
        0
      );
      const netProfit = Math.round((effectiveGrandTotal - totalCost) * 100) / 100;

      const newOrder = {
        _id: `ord_${Date.now()}`,
        tenantId,
        orderNumber,
        cashier: req.user._id,
        cashierName: req.user.name,
        customer: {
          khataId: khataCustomer ? khataCustomer._id : null,
          name: customer.name || (khataCustomer ? khataCustomer.name : 'Walk-in Customer'),
          phone: customer.phone || (khataCustomer ? khataCustomer.phone : ''),
        },
        items,
        subtotal: computedSubtotal,
        taxRate: 0, // Zero Sales Tax
        taxAmount: 0,
        discountType,
        discountValue: Number(discountValue),
        discountAmount: Number(discountAmount),
        grandTotal: effectiveGrandTotal,
        total: effectiveGrandTotal,
        totalCost,
        netProfit,
        paymentMethod: normalizedPaymentMethod,
        paymentDetails: {
          ...paymentDetails,
          previousDebt,
          balanceAfter,
          khataAmount: isKhataSale ? khataAmount : 0,
        },
        status: 'completed',
        notes: notes || '',
        createdAt: new Date(),
      };

      memoryStore.orders.unshift(newOrder);

      return res.status(201).json({
        success: true,
        message: isKhataSale
          ? `Order ${orderNumber} completed and recorded as Udhar in Khata!`
          : `Order ${orderNumber} completed successfully.`,
        order: newOrder,
        customerKhata: khataCustomer,
      });
    }

    // 3. MONGODB ATOMIC PATH
    const decrementedProducts = [];
    for (const item of items) {
      const product = await Product.findOne({ _id: item.product, tenantId });
      if (!product) {
        return res.status(404).json({ success: false, message: `Product "${item.title}" not found in your store.` });
      }
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.title}". Requested: ${item.quantity}, Available: ${product.stockQuantity}`,
        });
      }
    }

    for (const item of items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, tenantId, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        for (const rolledBack of decrementedProducts) {
          await Product.findByIdAndUpdate(rolledBack.id, { $inc: { stockQuantity: rolledBack.quantity } });
        }
        return res.status(400).json({ success: false, message: 'Stock update conflict. Please try again.' });
      }
      decrementedProducts.push({ id: item.product, quantity: item.quantity });
    }

    let previousDebt = 0;
    let balanceAfter = 0;

    const computedSubtotal =
      subtotal !== undefined && !isNaN(Number(subtotal))
        ? Number(subtotal)
        : items.reduce(
            (sum, item) =>
              sum + (Number(item.subtotal) || Number(item.price || 0) * Number(item.quantity || 1)),
            0
          );
    const effectiveGrandTotal =
      grandTotal !== undefined && !isNaN(Number(grandTotal))
        ? Number(grandTotal)
        : Math.max(0, computedSubtotal - Number(discountAmount || 0));
    const totalCost = items.reduce(
      (sum, item) => sum + (Number(item.costPrice || 0) * Number(item.quantity || 1)),
      0
    );
    const netProfit = Math.round((effectiveGrandTotal - totalCost) * 100) / 100;

    const order = await Order.create({
      tenantId,
      orderNumber,
      cashier: req.user._id,
      cashierName: req.user.name,
      customer: {
        khataId: khataCustomer ? khataCustomer._id : null,
        name: customer.name || (khataCustomer ? khataCustomer.name : 'Walk-in Customer'),
        phone: customer.phone || (khataCustomer ? khataCustomer.phone : ''),
      },
      items: items.map((i) => ({
        product: i.product,
        title: i.title,
        sku: i.sku,
        price: Number(i.price),
        costPrice: Number(i.costPrice || 0),
        quantity: Number(i.quantity),
        subtotal: Number(i.subtotal || i.price * i.quantity),
      })),
      subtotal: computedSubtotal,
      taxRate: 0, // Zero Sales Tax
      taxAmount: 0,
      discountType,
      discountValue: Number(discountValue),
      discountAmount: Number(discountAmount),
      grandTotal: effectiveGrandTotal,
      totalCost,
      netProfit,
      paymentMethod: normalizedPaymentMethod,
      paymentDetails: {
        ...paymentDetails,
        khataAmount: isKhataSale ? khataAmount : 0,
      },
      status: 'completed',
      notes: notes || '',
    });

    // Update Customer Khata if Udhar
    if (isKhataSale && khataCustomer) {
      previousDebt = khataCustomer.totalDebt;
      balanceAfter = Number((previousDebt + khataAmount).toFixed(2));

      khataCustomer.totalDebt = balanceAfter;
      khataCustomer.transactions.unshift({
        type: 'UDHAR_GIVEN',
        amount: khataAmount,
        balanceAfter,
        orderId: order._id,
        orderNumber,
        notes: `POS Udhar Sale (${items.length} items)`,
        date: new Date(),
        recordedBy: req.user._id,
        recordedByName: req.user.name,
      });

      await khataCustomer.save();

      // Snapshot debt values on order
      order.paymentDetails.previousDebt = previousDebt;
      order.paymentDetails.balanceAfter = balanceAfter;
      await order.save();
    }

    res.status(201).json({
      success: true,
      message: isKhataSale
        ? `Order ${orderNumber} completed and recorded as Udhar in Khata!`
        : `Order ${orderNumber} completed successfully.`,
      order,
      customerKhata: khataCustomer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order history for tenant
// @route   GET /api/orders
// @access  Private (Store Admin, Cashier)
const getOrders = async (req, res, next) => {
  try {
    const { startDate, endDate, cashier, paymentMethod, search, page = 1, limit = 20 } = req.query;
    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      let filtered = memoryStore.orders.filter((o) => o.tenantId === tenantId);

      if (paymentMethod && paymentMethod !== 'all') {
        filtered = filtered.filter((o) => o.paymentMethod.toUpperCase() === paymentMethod.toUpperCase());
      }
      if (search && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter((o) => o.orderNumber.toLowerCase().includes(q));
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const skip = (pageNum - 1) * limitNum;
      const paginated = filtered.slice(skip, skip + limitNum);

      return res.status(200).json({
        success: true,
        count: paginated.length,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limitNum) || 1,
        currentPage: pageNum,
        orders: paginated,
      });
    }

    const query = { tenantId };
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod.toUpperCase();
    }
    if (search && search.trim() !== '') {
      query.orderNumber = new RegExp(search.trim(), 'i');
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    if (global.useMemoryStore) {
      const order = memoryStore.orders.find(
        (o) => (o._id === req.params.id || o.orderNumber === req.params.id) && o.tenantId === tenantId
      );
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      return res.status(200).json({ success: true, order });
    }

    let order = req.params.id.startsWith('NPOS-')
      ? await Order.findOne({ orderNumber: req.params.id, tenantId })
      : await Order.findOne({ _id: req.params.id, tenantId });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
};
