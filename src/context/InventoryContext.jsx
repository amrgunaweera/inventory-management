import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { SEED_PRODUCTS, SEED_CATEGORIES, SEED_ORDERS } from '../utils/seedData';

const InventoryContext = createContext(null);

let nextId = 100;
const genId = () => `item-${++nextId}-${Date.now()}`;

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState(() => storage.get('products', SEED_PRODUCTS));
  const [categories, setCategories] = useState(() => storage.get('categories', SEED_CATEGORIES));
  const [orders, setOrders] = useState(() => storage.get('orders', SEED_ORDERS));

  useEffect(() => { storage.set('products', products); }, [products]);
  useEffect(() => { storage.set('categories', categories); }, [categories]);
  useEffect(() => { storage.set('orders', orders); }, [orders]);

  // Products
  const addProduct = (product) => {
    const newProduct = { ...product, id: genId(), status: 'active' };
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };
  const updateProduct = (id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };
  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Categories
  const addCategory = (cat) => {
    const newCat = { ...cat, id: genId(), productCount: 0 };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };
  const updateCategory = (id, updates) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const deleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Orders
  const addOrder = (order) => {
    const num = String(orders.length + 1).padStart(7, '0');
    const newOrder = { ...order, id: `ORD-${num}`, date: new Date().toISOString().split('T')[0] };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };
  const updateOrder = (id, updates) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  // Derived
  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.status === 'active');
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
  const totalRevenue = orders
    .filter(o => o.type === 'sale' && o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <InventoryContext.Provider value={{
      products, categories, orders,
      addProduct, updateProduct, deleteProduct,
      addCategory, updateCategory, deleteCategory,
      addOrder, updateOrder,
      lowStockProducts, totalInventoryValue, totalRevenue,
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export const useInventory = () => useContext(InventoryContext);
