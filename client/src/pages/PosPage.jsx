import React, { useState, useEffect, useCallback } from 'react';
import ProductGrid from '../components/pos/ProductGrid';
import CartPane from '../components/pos/CartPane';
import PaymentModal from '../components/pos/PaymentModal';
import ReceiptModal from '../components/pos/ReceiptModal';
import QuickAddProductModal from '../components/pos/QuickAddProductModal';
import CashDrawerModal from '../components/pos/CashDrawerModal';
import MobileBottomSheet from '../components/common/MobileBottomSheet';
import { productService } from '../services/api';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/currency';
import { ShoppingCart, ArrowRight } from 'lucide-react';

const PosPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const { addToCart, totalItemCount, grandTotal } = useCart();

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts({ all: 'true' });
      if (res.data.success) {
        setProducts(res.data.products);

        // Extract distinct categories
        const distinct = Array.from(
          new Set(res.data.products.map((p) => p.category).filter(Boolean))
        );
        setCategories(['All', ...distinct]);
      }
    } catch (err) {
      console.error('Failed to load POS catalog:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleOrderSuccess = (order) => {
    setCompletedOrder(order);
    setIsReceiptOpen(true);
    fetchCatalog();
  };

  const handleProductCreated = (newProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
    if (newProduct.category && !categories.includes(newProduct.category)) {
      setCategories((prev) => [...prev, newProduct.category]);
    }
    if (newProduct.stockQuantity > 0) {
      addToCart(newProduct, 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative">
      {/* Visual Product Grid */}
      <ProductGrid
        products={products}
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        loading={loading}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenCashDrawer={() => setIsCashDrawerOpen(true)}
        onOpenMobileCart={() => setIsMobileCartOpen(true)}
      />

      {/* Desktop Cart Pane (Visible on lg and larger) */}
      <div className="hidden lg:block h-full">
        <CartPane onOpenPayment={() => setIsPaymentOpen(true)} />
      </div>

      {/* Floating Checkout Action Bar (Visible only on Mobile < lg) */}
      {totalItemCount > 0 && (
        <div className="lg:hidden fixed bottom-16 inset-x-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-4 py-2.5 flex items-center justify-between z-30 shadow-2xl">
          <div
            onClick={() => setIsMobileCartOpen(true)}
            className="flex items-center space-x-2.5 cursor-pointer active:opacity-80"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in cart
              </div>
              <div className="text-sm font-black text-white">
                Total: {formatCurrency(grandTotal)}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsPaymentOpen(true)}
            className="py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition flex items-center space-x-1.5 min-tap"
          >
            <span>Charge / Bill</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Cart Bottom Sheet */}
      <MobileBottomSheet
        isOpen={isMobileCartOpen}
        onClose={() => setIsMobileCartOpen(false)}
        title="Current Order Cart"
        subtitle={`${totalItemCount} items • ${formatCurrency(grandTotal)}`}
      >
        <div className="-m-5">
          <CartPane
            onOpenPayment={() => {
              setIsMobileCartOpen(false);
              setIsPaymentOpen(true);
            }}
          />
        </div>
      </MobileBottomSheet>

      {/* Quick Add Product Modal */}
      <QuickAddProductModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onProductCreated={handleProductCreated}
      />

      {/* Day-End Cash Drawer Reconciliation (Sham ka Hisaab) */}
      <CashDrawerModal
        isOpen={isCashDrawerOpen}
        onClose={() => setIsCashDrawerOpen(false)}
      />

      {/* Payment Processing Modal (Renders as mobile bottom sheet on phones) */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onOrderCompleted={handleOrderSuccess}
      />

      {/* Thermal Receipt Print Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={completedOrder}
      />
    </div>
  );
};

export default PosPage;
