import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeToProducts,
  subscribeToCategories,
  subscribeToOrders,
  subscribeToSuppliers,
  addProduct as fsAddProduct,
  updateProduct as fsUpdateProduct,
  deleteProduct as fsDeleteProduct,
  addCategory as fsAddCategory,
  updateCategory as fsUpdateCategory,
  deleteCategory as fsDeleteCategory,
  addOrder as fsAddOrder,
  updateOrder as fsUpdateOrder,
  addSupplier as fsAddSupplier,
  updateSupplier as fsUpdateSupplier,
  deleteSupplier as fsDeleteSupplier,
  seedOrgData,
  hasExistingProducts,
  addAuditLog,
} from '../lib/firestoreService';
import { SEED_PRODUCTS, SEED_CATEGORIES, SEED_ORDERS } from '../utils/seedData';

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const { user, hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);

  const orgId = user?.organizationId;

  useEffect(() => {
    if (!orgId) {
      setProducts([]);
      setCategories([]);
      setOrders([]);
      setSuppliers([]);
      setDbLoading(false);
      return;
    }

    // Auto-seed new organizations with demo data
    const seedIfNew = async () => {
      const hasProducts = await hasExistingProducts(orgId);
      if (!hasProducts) {
        await seedOrgData(orgId, {
          products: SEED_PRODUCTS,
          categories: SEED_CATEGORIES,
          orders: SEED_ORDERS,
        });
      }
    };

    seedIfNew();

    // Set up real-time Firestore subscriptions (org-scoped)
    const unsubProducts = subscribeToProducts(orgId, (data) => {
      setProducts(data);
      setDbLoading(false);
    });
    const unsubCategories = subscribeToCategories(orgId, setCategories);
    const unsubOrders = subscribeToOrders(orgId, setOrders);
    const unsubSuppliers = subscribeToSuppliers(orgId, setSuppliers);

    // Clean up listeners on logout or orgId change
    return () => {
      unsubProducts();
      unsubCategories();
      unsubOrders();
      unsubSuppliers();
    };
  }, [orgId]);

  // ─── Audit helper ───────────────────────────────────────────────────────────

  const logAction = async (action, details) => {
    if (!orgId) return;
    try {
      await addAuditLog(orgId, {
        action,
        details,
        performedBy: user?.name || user?.email || 'Unknown',
      });
    } catch (e) {
      console.warn('Audit log failed:', e);
    }
  };

  // ─── Products ───────────────────────────────────────────────────────────────

  const addProduct = async (product) => {
    if (!hasPermission('products.create')) throw new Error('Permission denied');
    const id = await fsAddProduct(orgId, { ...product, status: product.status || 'active' });
    await logAction('product.created', `Created product: ${product.name}`);
    return { ...product, id };
  };

  const updateProduct = async (id, updates) => {
    if (!hasPermission('products.edit')) throw new Error('Permission denied');
    await fsUpdateProduct(orgId, id, updates);
    await logAction('product.updated', `Updated product ID: ${id}`);
  };

  const deleteProduct = async (id) => {
    if (!hasPermission('products.delete')) throw new Error('Permission denied');
    await fsDeleteProduct(orgId, id);
    await logAction('product.deleted', `Deleted product ID: ${id}`);
  };

  // ─── Categories ─────────────────────────────────────────────────────────────

  const addCategory = async (cat) => {
    if (!hasPermission('categories.create')) throw new Error('Permission denied');
    const id = await fsAddCategory(orgId, cat);
    await logAction('category.created', `Created category: ${cat.name}`);
    return { ...cat, id };
  };

  const updateCategory = async (id, updates) => {
    if (!hasPermission('categories.edit')) throw new Error('Permission denied');
    await fsUpdateCategory(orgId, id, updates);
    await logAction('category.updated', `Updated category ID: ${id}`);
  };

  const deleteCategory = async (id) => {
    if (!hasPermission('categories.delete')) throw new Error('Permission denied');
    await fsDeleteCategory(orgId, id);
    await logAction('category.deleted', `Deleted category ID: ${id}`);
  };

  // ─── Orders ─────────────────────────────────────────────────────────────────

  const addOrder = async (order) => {
    const perm = order.type === 'sale' ? 'orders.create_sales' : 'orders.create_purchase';
    if (!hasPermission(perm)) throw new Error('Permission denied');
    const num = String(orders.length + 1).padStart(7, '0');
    const newOrder = {
      ...order,
      id: `ORD-${num}`,
      date: new Date().toISOString().split('T')[0],
      createdBy: user?.name || user?.email || 'Unknown',
    };
    await fsAddOrder(orgId, newOrder);
    await logAction('order.created', `Created order: ${newOrder.id}`);
    return newOrder;
  };

  const updateOrder = async (id, updates) => {
    if (!hasPermission('orders.edit')) throw new Error('Permission denied');
    await fsUpdateOrder(orgId, id, updates);
    await logAction('order.updated', `Updated order ID: ${id}`);
  };

  // ─── Suppliers ──────────────────────────────────────────────────────────────

  const addSupplier = async (supplier) => {
    if (!hasPermission('suppliers.create')) throw new Error('Permission denied');
    const id = await fsAddSupplier(orgId, supplier);
    await logAction('supplier.created', `Added supplier: ${supplier.name}`);
    return { ...supplier, id };
  };

  const updateSupplier = async (id, updates) => {
    if (!hasPermission('suppliers.edit')) throw new Error('Permission denied');
    await fsUpdateSupplier(orgId, id, updates);
    await logAction('supplier.updated', `Updated supplier ID: ${id}`);
  };

  const deleteSupplier = async (id) => {
    if (!hasPermission('suppliers.delete')) throw new Error('Permission denied');
    await fsDeleteSupplier(orgId, id);
    await logAction('supplier.deleted', `Deleted supplier ID: ${id}`);
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
        suppliers,
        dbLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addOrder,
        updateOrder,
        addSupplier,
        updateSupplier,
        deleteSupplier,
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
