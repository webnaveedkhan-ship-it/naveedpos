import React, { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [taxRate, setTaxRate] = useState(0); // Zero sales tax / GST rule
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
  const [discountValue, setDiscountValue] = useState(0);
  const [cartAlert, setCartAlert] = useState(null);

  const showAlert = (message, type = 'error') => {
    setCartAlert({ message, type });
    setTimeout(() => {
      setCartAlert(null);
    }, 3500);
  };

  // Add product to cart with strict Stock Guard & Multi-Unit Support
  const addToCart = (product, quantityToAdd = 1, pricingMode = 'unit') => {
    if (!product || product.stockQuantity <= 0) {
      showAlert(`"${product?.title || 'Item'}" is currently out of stock!`, 'error');
      return false;
    }

    const isCarton = pricingMode === 'carton' && Number(product.cartonPrice) > 0;
    const effectiveUnitPrice = isCarton ? Number(product.cartonPrice) : Number(product.price);
    const parsedQty = parseFloat(quantityToAdd) || 1;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.product === product._id && item.pricingMode === pricingMode
      );

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = Math.round((currentQty + parsedQty) * 100) / 100;

        // Stock Guard check
        const totalStockUnitsRequired = isCarton
          ? newQty * (Number(product.cartonSize) || 1)
          : newQty;

        if (totalStockUnitsRequired > product.stockQuantity) {
          showAlert(
            `Stock Limit Reached: Cannot add more than ${product.stockQuantity} units of "${product.title}".`,
            'error'
          );
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: Number((newQty * effectiveUnitPrice).toFixed(2)),
        };
        return updated;
      } else {
        const totalStockUnitsRequired = isCarton
          ? parsedQty * (Number(product.cartonSize) || 1)
          : parsedQty;

        if (totalStockUnitsRequired > product.stockQuantity) {
          showAlert(
            `Stock Limit: Only ${product.stockQuantity} available for "${product.title}".`,
            'error'
          );
          return prevItems;
        }

        return [
          ...prevItems,
          {
            product: product._id,
            title: product.title,
            sku: product.sku,
            price: Number(product.price),
            costPrice: Number(product.costPrice || 0),
            unitPrice: effectiveUnitPrice,
            stockQuantity: product.stockQuantity,
            unitType: product.unitType || 'piece',
            allowFractional: Boolean(product.allowFractional),
            cartonSize: Number(product.cartonSize) || 1,
            cartonPrice: Number(product.cartonPrice) || 0,
            pricingMode: isCarton ? 'carton' : 'unit',
            quantity: parsedQty,
            subtotal: Number((parsedQty * effectiveUnitPrice).toFixed(2)),
          },
        ];
      }
    });

    return true;
  };

  // Update item quantity directly (handles fractional decimals like 0.25, 0.5, 1.75 kg)
  const updateQuantity = (productId, newQuantity, mode = null) => {
    const qty = parseFloat(newQuantity);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(productId, mode);
      return;
    }

    setCartItems((prevItems) => {
      return prevItems.map((item) => {
        const matches = mode ? item.product === productId && item.pricingMode === mode : item.product === productId;
        if (matches) {
          const isCarton = item.pricingMode === 'carton';
          const unitsNeeded = isCarton ? qty * (item.cartonSize || 1) : qty;

          if (unitsNeeded > item.stockQuantity) {
            showAlert(
              `Stock Guard: Only ${item.stockQuantity} units available for "${item.title}".`,
              'error'
            );
            const maxQty = isCarton ? Math.floor(item.stockQuantity / (item.cartonSize || 1)) : item.stockQuantity;
            return {
              ...item,
              quantity: maxQty,
              subtotal: Number((maxQty * item.unitPrice).toFixed(2)),
            };
          }

          const roundedQty = Math.round(qty * 1000) / 1000;
          return {
            ...item,
            quantity: roundedQty,
            subtotal: Number((roundedQty * item.unitPrice).toFixed(2)),
          };
        }
        return item;
      });
    });
  };

  // Increment item (handles step: e.g. +0.25 for loose kg, or +1 for pieces)
  const incrementItem = (productId, step = null, mode = null) => {
    const item = cartItems.find((i) => (mode ? i.product === productId && i.pricingMode === mode : i.product === productId));
    if (item) {
      const actualStep = step !== null ? step : (item.allowFractional ? 0.25 : 1);
      const newQty = Math.round((item.quantity + actualStep) * 1000) / 1000;
      updateQuantity(productId, newQty, item.pricingMode);
    }
  };

  // Decrement item
  const decrementItem = (productId, step = null, mode = null) => {
    const item = cartItems.find((i) => (mode ? i.product === productId && i.pricingMode === mode : i.product === productId));
    if (item) {
      const actualStep = step !== null ? step : (item.allowFractional ? 0.25 : 1);
      const newQty = Math.round((item.quantity - actualStep) * 1000) / 1000;
      if (newQty <= 0) {
        removeFromCart(productId, item.pricingMode);
      } else {
        updateQuantity(productId, newQty, item.pricingMode);
      }
    }
  };

  // Toggle item pricing mode between Single Piece/Unit and Carton
  const togglePricingMode = (productId) => {
    setCartItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.product === productId && item.cartonPrice > 0) {
          const nextMode = item.pricingMode === 'carton' ? 'unit' : 'carton';
          const nextPrice = nextMode === 'carton' ? item.cartonPrice : item.price;
          return {
            ...item,
            pricingMode: nextMode,
            unitPrice: nextPrice,
            subtotal: Number((item.quantity * nextPrice).toFixed(2)),
          };
        }
        return item;
      });
    });
  };

  // Remove single item
  const removeFromCart = (productId, mode = null) => {
    setCartItems((prev) =>
      prev.filter((item) => {
        if (mode) {
          return !(item.product === productId && item.pricingMode === mode);
        }
        return item.product !== productId;
      })
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
    setDiscountValue(0);
  };

  // Live Cart Calculations (Zero Sales Tax / GST: Grand Total = Subtotal - Discount)
  const { subtotal, taxAmount, discountAmount, grandTotal, totalItemCount } = useMemo(() => {
    const rawSubtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

    let calculatedDiscount = 0;
    if (discountType === 'percentage') {
      calculatedDiscount = (rawSubtotal * (Number(discountValue) || 0)) / 100;
    } else {
      calculatedDiscount = Number(discountValue) || 0;
    }
    calculatedDiscount = Math.min(rawSubtotal, Math.max(0, calculatedDiscount));

    const finalTotal = Math.max(0, rawSubtotal - calculatedDiscount);
    const count = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return {
      subtotal: Number(rawSubtotal.toFixed(2)),
      taxAmount: 0,
      taxRate: 0,
      discountAmount: Number(calculatedDiscount.toFixed(2)),
      grandTotal: Number(finalTotal.toFixed(2)),
      totalItemCount: count,
    };
  }, [cartItems, discountType, discountValue]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        incrementItem,
        decrementItem,
        togglePricingMode,
        clearCart,
        subtotal,
        taxRate,
        setTaxRate,
        taxAmount,
        discountType,
        setDiscountType,
        discountValue,
        setDiscountValue,
        discountAmount,
        grandTotal,
        totalItemCount,
        cartAlert,
        showAlert,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
