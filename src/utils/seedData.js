// Seed demo data for initial load
export const SEED_PRODUCTS = [
  { id: '1', name: 'Wireless Earbuds Pro', sku: 'WEP-001', category: 'Electronics', price: 79.99, cost: 35.00, stock: 142, minStock: 20, status: 'active' },
  { id: '2', name: 'Bamboo Phone Stand', sku: 'BPS-002', category: 'Accessories', price: 24.99, cost: 8.00, stock: 8, minStock: 15, status: 'active' },
  { id: '3', name: 'Organic Cotton Tote', sku: 'OCT-003', category: 'Bags', price: 18.99, cost: 5.50, stock: 230, minStock: 30, status: 'active' },
  { id: '4', name: 'Artisan Soy Candle', sku: 'ASC-004', category: 'Home & Living', price: 32.00, cost: 9.00, stock: 4, minStock: 10, status: 'active' },
  { id: '5', name: 'Handmade Leather Wallet', sku: 'HLW-005', category: 'Accessories', price: 65.00, cost: 22.00, stock: 57, minStock: 10, status: 'active' },
  { id: '6', name: 'Cold Brew Kit', sku: 'CBK-006', category: 'Kitchen', price: 44.99, cost: 15.00, stock: 31, minStock: 10, status: 'active' },
  { id: '7', name: 'Macramé Wall Hanging', sku: 'MWH-007', category: 'Home & Living', price: 55.00, cost: 18.00, stock: 19, minStock: 5, status: 'active' },
  { id: '8', name: 'Stainless Steel Tumbler', sku: 'SST-008', category: 'Kitchen', price: 29.99, cost: 10.00, stock: 0, minStock: 20, status: 'inactive' },
  { id: '9', name: 'Natural Face Serum', sku: 'NFS-009', category: 'Beauty', price: 48.00, cost: 16.00, stock: 88, minStock: 15, status: 'active' },
  { id: '10', name: 'Recycled Notebook Set', sku: 'RNS-010', category: 'Stationery', price: 16.99, cost: 4.00, stock: 175, minStock: 25, status: 'active' },
];

export const SEED_CATEGORIES = [
  { id: 'cat-1', name: 'Electronics', description: 'Tech gadgets and devices', color: '#6366f1', productCount: 1 },
  { id: 'cat-2', name: 'Accessories', description: 'Fashion and lifestyle accessories', color: '#f59e0b', productCount: 2 },
  { id: 'cat-3', name: 'Bags', description: 'Bags, totes and carriers', color: '#10b981', productCount: 1 },
  { id: 'cat-4', name: 'Home & Living', description: 'Home décor and lifestyle', color: '#ec4899', productCount: 2 },
  { id: 'cat-5', name: 'Kitchen', description: 'Kitchen and dining', color: '#f97316', productCount: 2 },
  { id: 'cat-6', name: 'Beauty', description: 'Skincare and wellness', color: '#8b5cf6', productCount: 1 },
  { id: 'cat-7', name: 'Stationery', description: 'Office and art supplies', color: '#06b6d4', productCount: 1 },
];

export const SEED_ORDERS = [
  { id: 'ORD-2024001', type: 'sale', customer: 'Alice Johnson', items: [{ productId: '1', name: 'Wireless Earbuds Pro', qty: 2, price: 79.99 }], total: 159.98, status: 'completed', date: '2024-12-01' },
  { id: 'ORD-2024002', type: 'sale', customer: 'Bob Martinez', items: [{ productId: '3', name: 'Organic Cotton Tote', qty: 5, price: 18.99 }, { productId: '10', name: 'Recycled Notebook Set', qty: 3, price: 16.99 }], total: 145.92, status: 'completed', date: '2024-12-02' },
  { id: 'ORD-2024003', type: 'purchase', customer: 'Supplier Co.', items: [{ productId: '2', name: 'Bamboo Phone Stand', qty: 50, price: 8.00 }], total: 400.00, status: 'pending', date: '2024-12-03' },
  { id: 'ORD-2024004', type: 'sale', customer: 'Carol White', items: [{ productId: '5', name: 'Handmade Leather Wallet', qty: 1, price: 65.00 }, { productId: '9', name: 'Natural Face Serum', qty: 2, price: 48.00 }], total: 161.00, status: 'completed', date: '2024-12-04' },
  { id: 'ORD-2024005', type: 'sale', customer: 'Dan Lee', items: [{ productId: '6', name: 'Cold Brew Kit', qty: 2, price: 44.99 }], total: 89.98, status: 'processing', date: '2024-12-05' },
  { id: 'ORD-2024006', type: 'sale', customer: 'Eva Green', items: [{ productId: '4', name: 'Artisan Soy Candle', qty: 3, price: 32.00 }, { productId: '7', name: 'Macramé Wall Hanging', qty: 1, price: 55.00 }], total: 151.00, status: 'completed', date: '2024-12-06' },
  { id: 'ORD-2024007', type: 'sale', customer: 'Frank Brown', items: [{ productId: '1', name: 'Wireless Earbuds Pro', qty: 1, price: 79.99 }], total: 79.99, status: 'cancelled', date: '2024-12-07' },
  { id: 'ORD-2024008', type: 'sale', customer: 'Grace Kim', items: [{ productId: '9', name: 'Natural Face Serum', qty: 1, price: 48.00 }, { productId: '3', name: 'Organic Cotton Tote', qty: 2, price: 18.99 }], total: 85.98, status: 'completed', date: '2024-12-08' },
];

export const SEED_SALES_TREND = [
  { month: 'Jul', revenue: 3200, orders: 24 },
  { month: 'Aug', revenue: 4100, orders: 31 },
  { month: 'Sep', revenue: 3800, orders: 28 },
  { month: 'Oct', revenue: 5200, orders: 40 },
  { month: 'Nov', revenue: 6800, orders: 52 },
  { month: 'Dec', revenue: 5400, orders: 42 },
];
