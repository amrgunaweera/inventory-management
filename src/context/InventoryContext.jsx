import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeToProducts,
  subscribeToCategories,
  subscribeToOrders,
  addProduct as fsAddProduct,
  updateProduct as fsUpdateProduct,
  deleteProduct as fsDeleteProduct,
  addCategory as fsAddCategory,
  updateCategory as fsUpdateCategory,
  deleteCategory as fsDeleteCategory,
  addOrder as fsAddOrder,
  updateOrder as fsUpdateOrder,
  seedUserData,
  hasExistingProducts,
} from '../lib/firestoreService';
import { SEED_PRODUCTS, SEED_CATEGORIES, SEED_ORDERS } from '../utils/seedData';

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setProducts([]);
      setCategories([]);
      setOrders([]);
      setDbLoading(false);
      return;
    }

    // Auto-seed new users with demo data
    const seedIfNew = async () => {
      const hasProducts = await hasExistingProducts(user.uid);
      if (!hasProducts) {
        await seedUserData(user.uid, {
          products: SEED_PRODUCTS,
          categories: SEED_CATEGORIES,
          orders: SEED_ORDERS,
        });
      }
    };

    seedIfNew();

    // Set up real-time Firestore subscriptions
    const unsubProducts = subscribeToProducts(user.uid, (data) => {
      setProducts(data);
      setDbLoading(false);
    });
    const unsubCategories = subscribeToCategories(user.uid, setCategories);
    const unsubOrders = subscribeToOrders(user.uid, setOrders);

    // Clean up listeners on logout or uid change
    return () => {
      unsubProducts();
      unsubCategories();
      unsubOrders();
    };
  }, [user?.uid]);

  // ─── Products ───────────────────────────────────────────────────────────────

  const addProduct = async (product) => {
    const id = await fsAddProduct(user.uid, { ...product, status: product.status || 'active' });
    return { ...product, id };
  };

  const updateProduct = async (id, updates) => {
    await fsUpdateProduct(user.uid, id, updates);
  };

  const deleteProduct = async (id) => {
    await fsDeleteProduct(user.uid, id);
  };

  // ─── Categories ─────────────────────────────────────────────────────────────

  const addCategory = async (cat) => {
    const id = await fsAddCategory(user.uid, cat);
    return { ...cat, id };
  };

  const updateCategory = async (id, updates) => {
    await fsUpdateCategory(user.uid, id, updates);
  };

  const deleteCategory = async (id) => {
    await fsDeleteCategory(user.uid, id);
  };

  // ─── Orders ─────────────────────────────────────────────────────────────────

  const addOrder = async (order) => {
    const num = String(orders.length + 1).padStart(7, '0');
    const newOrder = {
      ...order,
      id: `ORD-${num}`,
      date: new Date().toISOString().split('T')[0],
    };
    await fsAddOrder(user.uid, newOrder);
    return newOrder;
  };

  const updateOrder = async (id, updates) => {
    await fsUpdateOrder(user.uid, id, updates);
  };

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const lowStockProducts = products.filter(
    (p) => p.stock <= p.minStock && p.status === 'active'
  );
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + (p.stock * p.cost || 0),
    0
  );
  const totalRevenue = orders
    .filter((o) => o.type === 'sale' && o.status === 'completed')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <InventoryContext.Provider
      value={{
        products,
        categories,
        orders,
        dbLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addOrder,
        updateOrder,
        lowStockProducts,
        totalInventoryValue,
        totalRevenue,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export const useInventory = () => useContext(InventoryContext);
