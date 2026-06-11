/**
 * roles.js
 * Central role definitions, permissions, and access control helpers for Smartventory RBAC.
 *
 * Roles:
 *   admin              — Full system control and configuration
 *   inventory_manager   — Responsible for overall inventory operations
 *   warehouse_staff     — Handles day-to-day stock movements
 *   purchasing_officer  — Manages procurement and supplier relationships
 *   sales_user          — Handles customer orders and sales-related inventory
 *   management          — Monitors business performance without modifying data
 */

// ─── Role Definitions ─────────────────────────────────────────────────────────

export const ROLES = {
  admin: {
    id: 'admin',
    label: 'Administrator',
    description: 'Full system control and configuration',
    color: 'rose',
    priority: 0,
  },
  inventory_manager: {
    id: 'inventory_manager',
    label: 'Inventory Manager',
    description: 'Responsible for overall inventory operations',
    color: 'brand',
    priority: 1,
  },
  warehouse_staff: {
    id: 'warehouse_staff',
    label: 'Warehouse Staff',
    description: 'Handles day-to-day stock movements',
    color: 'amber',
    priority: 2,
  },
  purchasing_officer: {
    id: 'purchasing_officer',
    label: 'Purchasing Officer',
    description: 'Manages procurement and supplier relationships',
    color: 'blue',
    priority: 3,
  },
  sales_user: {
    id: 'sales_user',
    label: 'Sales User',
    description: 'Handles customer orders and sales-related inventory',
    color: 'emerald',
    priority: 4,
  },
  management: {
    id: 'management',
    label: 'Management',
    description: 'Monitors business performance without modifying data',
    color: 'violet',
    priority: 5,
  },
};

// ─── Permission Map ───────────────────────────────────────────────────────────
// Each key is a permission string; value is the set of roles that have it.

const P = {
  // Dashboard
  'dashboard.view':            ['admin', 'inventory_manager', 'warehouse_staff', 'purchasing_officer', 'sales_user', 'management'],
  'dashboard.full':            ['admin', 'inventory_manager', 'management'],

  // Products
  'products.view':             ['admin', 'inventory_manager', 'warehouse_staff', 'purchasing_officer', 'sales_user', 'management'],
  'products.create':           ['admin', 'inventory_manager'],
  'products.edit':             ['admin', 'inventory_manager'],
  'products.delete':           ['admin', 'inventory_manager'],

  // Categories
  'categories.view':           ['admin', 'inventory_manager', 'warehouse_staff', 'purchasing_officer', 'sales_user', 'management'],
  'categories.create':         ['admin', 'inventory_manager'],
  'categories.edit':           ['admin', 'inventory_manager'],
  'categories.delete':         ['admin', 'inventory_manager'],

  // Orders — Sales
  'orders.view_sales':         ['admin', 'inventory_manager', 'sales_user', 'management'],
  'orders.create_sales':       ['admin', 'inventory_manager', 'sales_user'],

  // Orders — Purchase
  'orders.view_purchase':      ['admin', 'inventory_manager', 'purchasing_officer', 'management'],
  'orders.create_purchase':    ['admin', 'inventory_manager', 'purchasing_officer'],

  // Orders — All
  'orders.view_all':           ['admin', 'inventory_manager', 'management'],
  'orders.edit':               ['admin', 'inventory_manager'],

  // Stock Operations
  'stock.in':                  ['admin', 'inventory_manager', 'warehouse_staff'],
  'stock.out':                 ['admin', 'inventory_manager', 'warehouse_staff'],
  'stock.transfer_create':     ['admin', 'inventory_manager', 'warehouse_staff'],
  'stock.transfer_approve':    ['admin', 'inventory_manager'],
  'stock.adjustment':          ['admin', 'inventory_manager'],
  'stock.count':               ['admin', 'inventory_manager', 'warehouse_staff'],

  // Suppliers
  'suppliers.view':            ['admin', 'inventory_manager', 'purchasing_officer', 'management'],
  'suppliers.create':          ['admin', 'inventory_manager', 'purchasing_officer'],
  'suppliers.edit':            ['admin', 'inventory_manager', 'purchasing_officer'],
  'suppliers.delete':          ['admin'],

  // Warehouses
  'warehouses.view':           ['admin', 'inventory_manager', 'warehouse_staff', 'management'],
  'warehouses.manage':         ['admin'],

  // Reports & Analytics
  'reports.view':              ['admin', 'inventory_manager', 'management'],
  'reports.sales':             ['admin', 'inventory_manager', 'sales_user', 'management'],
  'reports.purchase':          ['admin', 'inventory_manager', 'purchasing_officer', 'management'],
  'reports.warehouse':         ['admin', 'inventory_manager', 'warehouse_staff', 'management'],
  'reports.export':            ['admin', 'inventory_manager', 'management'],

  // Alerts
  'alerts.view':               ['admin', 'inventory_manager', 'warehouse_staff', 'management'],

  // Team / User Management
  'team.view':                 ['admin'],
  'team.invite':               ['admin'],
  'team.edit_roles':           ['admin'],
  'team.remove':               ['admin'],

  // System Settings
  'settings.system':           ['admin'],
  'settings.personal':         ['admin', 'inventory_manager', 'warehouse_staff', 'purchasing_officer', 'sales_user', 'management'],

  // Billing
  'billing.view':              ['admin'],
  'billing.manage':            ['admin'],

  // Audit Log
  'audit.view':                ['admin'],

  // Export
  'export.csv':                ['admin', 'inventory_manager', 'management'],
};

// ─── Permission Helpers ───────────────────────────────────────────────────────

/**
 * Check if a role has a specific permission.
 * @param {string} role - One of the ROLES keys (e.g. 'admin', 'sales_user')
 * @param {string} permission - A permission string from the P map (e.g. 'products.create')
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  const allowed = P[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

/**
 * Get all permissions for a given role.
 * @param {string} role
 * @returns {string[]}
 */
export function getPermissionsForRole(role) {
  if (!role) return [];
  return Object.entries(P)
    .filter(([, roles]) => roles.includes(role))
    .map(([perm]) => perm);
}

/**
 * Check if a role can access any of the given permissions.
 * @param {string} role
 * @param {string[]} permissions
 * @returns {boolean}
 */
export function hasAnyPermission(role, permissions) {
  return permissions.some((p) => hasPermission(role, p));
}

// ─── Route Access Map ─────────────────────────────────────────────────────────
// Maps route paths to the permission(s) required. If multiple permissions are
// listed, having ANY one of them grants access.

const ROUTE_PERMISSIONS = {
  '/dashboard':    ['dashboard.view'],
  '/products':     ['products.view'],
  '/categories':   ['categories.view'],
  '/orders':       ['orders.view_all', 'orders.view_sales', 'orders.view_purchase'],
  '/reports':      ['reports.view', 'reports.sales', 'reports.purchase', 'reports.warehouse'],
  '/alerts':       ['alerts.view'],
  '/export':       ['export.csv'],
  '/settings':     ['settings.system', 'settings.personal'],
  '/billing':      ['billing.view'],
  '/team':         ['team.view'],
  '/suppliers':    ['suppliers.view'],
  '/warehouses':   ['warehouses.view'],
  '/audit-log':    ['audit.view'],
};

/**
 * Check if a role can access a given route.
 * @param {string} role
 * @param {string} route - The route path (e.g. '/products')
 * @returns {boolean}
 */
export function canAccessRoute(role, route) {
  if (!role || !route) return false;
  const required = ROUTE_PERMISSIONS[route];
  if (!required) return true; // Unknown routes default to accessible (caught by router)
  return hasAnyPermission(role, required);
}

/**
 * Get the first accessible route for a role (used for redirect after login).
 * @param {string} role
 * @returns {string}
 */
export function getDefaultRoute(role) {
  const preferredRoutes = ['/dashboard', '/products', '/orders', '/reports'];
  for (const route of preferredRoutes) {
    if (canAccessRoute(role, route)) return route;
  }
  return '/dashboard';
}

// ─── Role Display Helpers ─────────────────────────────────────────────────────

/**
 * Get the color classes for a role (for badges, pills, etc).
 */
export function getRoleColorClasses(roleId) {
  const colorMap = {
    admin:              'bg-rose-500/15 text-rose-600 border-rose-200',
    inventory_manager:  'bg-indigo-500/15 text-indigo-600 border-indigo-200',
    warehouse_staff:    'bg-amber-500/15 text-amber-600 border-amber-200',
    purchasing_officer: 'bg-blue-500/15 text-blue-600 border-blue-200',
    sales_user:         'bg-emerald-500/15 text-emerald-600 border-emerald-200',
    management:         'bg-violet-500/15 text-violet-600 border-violet-200',
  };
  return colorMap[roleId] || 'bg-slate-500/15 text-slate-600 border-slate-200';
}

/**
 * Get sidebar color classes for role display on dark backgrounds.
 */
export function getRoleSidebarClasses(roleId) {
  const colorMap = {
    admin:              'bg-rose-500/20 text-rose-300',
    inventory_manager:  'bg-brand-500/20 text-brand-300',
    warehouse_staff:    'bg-amber-500/20 text-amber-300',
    purchasing_officer: 'bg-blue-500/20 text-blue-300',
    sales_user:         'bg-emerald-500/20 text-emerald-300',
    management:         'bg-violet-500/20 text-violet-300',
  };
  return colorMap[roleId] || 'bg-slate-500/20 text-slate-300';
}
