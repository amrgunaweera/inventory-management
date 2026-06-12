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
  subscribeToAllOrganizations,
} from '../lib/firestoreService';
import { SEED_PRODUCTS, SEED_CATEGORIES, SEED_ORDERS } from '../utils/seedData';

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const { user, hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [dbLoading, setDbLoading] = useState(true);

  const orgId = user?.organizationId;
  const role = user?.role;

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setCategories([]);
      setOrders([]);
      setSuppliers([]);
      setAllStores([]);
      setDbLoading(false);
      return;
    }

    const unsubCategories = subscribeToCategories(setCategories);

    if (role === 'super_admin') {
      setDbLoading(true);
      let activeUnsubs = [];

      const unsubOrgs = subscribeToAllOrganizations((orgs) => {
        const storesList = orgs.map(org => ({
          ...org,
          type: org.type || (org.name?.toLowerCase().includes('wholesale') || org.name?.toLowerCase().includes('corp') ? 'Wholesale' : org.name?.toLowerCase().includes('warehouse') ? 'Warehouse' : 'Retail')
        }));
        setAllStores(storesList);

        if (orgs.length === 0) {
          setProducts([]);
          setDbLoading(false);
          return;
        }

        // Clean up previous product subscriptions
        activeUnsubs.forEach(unsub => unsub());
        activeUnsubs = [];

        // Track products by orgId to merge them
        const tempProducts = {};

        orgs.forEach(org => {
          const unsubProducts = subscribeToProducts(org.id, (orgProducts) => {
            tempProducts[org.id] = orgProducts.map(p => ({
              ...p,
              orgId: org.id,
              orgName: org.name || 'Unnamed Store',
              orgType: org.type || (org.name?.toLowerCase().includes('wholesale') || org.name?.toLowerCase().includes('corp') ? 'Wholesale' : org.name?.toLowerCase().includes('warehouse') ? 'Warehouse' : 'Retail')
            }));

            // Merge and update state
            const merged = Object.values(tempProducts).flat();
            // Sort by createdAt desc in memory
            merged.sort((a, b) => {
              const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
              const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
              return timeB - timeA;
            });
            setProducts(merged);
            setDbLoading(false);
          });
          activeUnsubs.push(unsubProducts);
        });
      });

      return () => {
        unsubOrgs();
        activeUnsubs.forEach(unsub => unsub());
        unsubCategories();
      };
    } else {
      // Normal non-admin user flow
      if (!orgId) {
        setProducts([]);
        setCategories([]);
        setOrders([]);
        setSuppliers([]);
        setDbLoading(false);
        return;
      }

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

      const unsubProducts = subscribeToProducts(orgId, (data) => {
        setProducts(data);
        setDbLoading(false);
      });
      const unsubOrders = subscribeToOrders(orgId, setOrders);
      const unsubSuppliers = subscribeToSuppliers(orgId, setSuppliers);

      return () => {
        unsubProducts();
        unsubCategories();
        unsubOrders();
        unsubSuppliers();
      };
    }
  }, [orgId, role, user]);

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
    const id = await fsAddCategory(cat);
    await logAction('category.created', `Created category: ${cat.name}`);
    return { ...cat, id };
  };

  const updateCategory = async (id, updates) => {
    if (!hasPermission('categories.edit')) throw new Error('Permission denied');
    await fsUpdateCategory(id, updates);
    await logAction('category.updated', `Updated category ID: ${id}`);
  };

  const deleteCategory = async (id) => {
    if (!hasPermission('categories.delete')) throw new Error('Permission denied');
    await fsDeleteCategory(id);
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
        allStores,
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
