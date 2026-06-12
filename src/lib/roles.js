/**
 * roles.js
 * Central role definitions, permissions, and access control helpers for Smartventory RBAC.
 *
 * Roles:
 *   super_admin          — Controls the entire platform and all stores
 *   store_owner          — Manages their own store and staff
 *   store_sales_person   — Handles daily sales and stock operations
 */

// ─── Role Definitions ─────────────────────────────────────────────────────────

export const ROLES = {
  super_admin: {
    id: 'super_admin',
    label: 'Super Admin',
    description: 'Controls the entire platform and all stores',
    color: 'rose',
    priority: 0,
  },
  store_owner: {
    id: 'store_owner',
    label: 'Store Owner',
    description: 'Manages their own store and staff',
    color: 'brand',
    priority: 1,
  },
  store_sales_person: {
    id: 'store_sales_person',
    label: 'Store Sales Person',
    description: 'Handles daily sales and stock operations',
    color: 'emerald',
    priority: 2,
  },
};

// ─── Permission Map ───────────────────────────────────────────────────────────
// Each key is a permission string; value is the set of roles that have it.
// Note: super_admin implicitly has ALL permissions (handled in hasPermission helper)

const P = {
  // Dashboard
  'dashboard.view':            ['store_owner', 'store_sales_person'],
  'dashboard.full':            ['store_owner'],

  // Products
  'products.view':             ['store_owner', 'store_sales_person'],
  'products.create':           ['store_owner'],
  'products.edit':             ['store_owner'],
  'products.delete':           ['store_owner'],

  // Categories
  'categories.view':           ['store_owner', 'store_sales_person'],
  'categories.create':         [],
  'categories.edit':           [],
  'categories.delete':         [],

  // Orders — Sales
  'orders.view_sales':         ['store_owner', 'store_sales_person'],
  'orders.create_sales':       ['store_owner', 'store_sales_person'],

  // Orders — Purchase
  'orders.view_purchase':      ['store_owner'],
  'orders.create_purchase':    ['store_owner'],

  // Orders — All
  'orders.view_all':           ['store_owner', 'store_sales_person'],
  'orders.edit':               ['store_owner'],

  // Stock Operations
  'stock.in':                  ['store_owner', 'store_sales_person'],
  'stock.out':                 ['store_owner', 'store_sales_person'],
  'stock.transfer_create':     ['store_owner', 'store_sales_person'],
  'stock.transfer_approve':    ['store_owner'],
  'stock.adjustment':          ['store_owner', 'store_sales_person'],
  'stock.count':               ['store_owner', 'store_sales_person'],

  // Suppliers
  'suppliers.view':            ['store_owner'],
  'suppliers.create':          ['store_owner'],
  'suppliers.edit':            ['store_owner'],
  'suppliers.delete':          ['store_owner'],

  // Warehouses
  'warehouses.view':           ['store_owner', 'store_sales_person'],
  'warehouses.manage':         ['store_owner'],

  // Reports & Analytics
  'reports.view':              ['store_owner'],
  'reports.sales':             ['store_owner'],
  'reports.purchase':          ['store_owner'],
  'reports.warehouse':         ['store_owner'],
  'reports.export':            ['store_owner'],

  // Alerts
  'alerts.view':               ['store_owner'],

  // Team / User Management
  'team.view':                 ['store_owner'],
  'team.invite':               ['store_owner'],
  'team.edit_roles':           ['store_owner'],
  'team.remove':               ['store_owner'],

  // System Settings
  'settings.system':           ['store_owner'],
  'settings.personal':         ['store_owner', 'store_sales_person'],

  // Billing
  'billing.view':              ['store_owner', 'store_sales_person'],
  'billing.manage':            ['store_owner'],

  // Audit Log
  'audit.view':                ['store_owner'],

  // Export
  'export.csv':                ['store_owner'],

  // Platform Administration
  'platform.dashboard.view':   [], // Only super_admin via override
  'platform.users.manage':     [], // Only super_admin via override
  'platform.stores.manage':    [], // Only super_admin via override
};

// ─── Permission Helpers ───────────────────────────────────────────────────────

export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  if (role === 'super_admin') {
    // Super Admin manages platform settings, users, and stores
    if (permission.startsWith('platform.') || permission.startsWith('categories.')) {
      return true;
    }
    // They can view store data (read-only) for platform monitoring
    if (permission.endsWith('.view') || permission === 'orders.view_all' || permission === 'reports.view' || permission === 'settings.personal') {
      return true;
    }
    return false;
  }

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
  if (role === 'super_admin') return Object.keys(P); // Returns all keys
  
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
  if (role === 'super_admin') return true;
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
  '/platform/dashboard': ['platform.dashboard.view'],
  '/platform/users': ['platform.users.manage'],
  '/platform/stores': ['platform.stores.manage'],
};

export function canAccessRoute(role, route, planId = 'free') {
  if (!role || !route) return false;
  if (role === 'super_admin') {
    if (route === '/platform/dashboard' || route === '/platform/users' || route === '/platform/stores' || route === '/products' || route === '/settings' || route === '/categories') return true;
    return false;
  }

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
  if (role === 'super_admin') return '/platform/dashboard';
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
    super_admin:        'bg-rose-500/15 text-rose-600 border-rose-200',
    store_owner:        'bg-brand-500/15 text-brand-600 border-brand-200',
    store_sales_person: 'bg-emerald-500/15 text-emerald-600 border-emerald-200',
  };
  return colorMap[roleId] || 'bg-slate-500/15 text-slate-600 border-slate-200';
}

/**
 * Get sidebar color classes for role display on dark backgrounds.
 */
export function getRoleSidebarClasses(roleId) {
  const colorMap = {
    super_admin:        'bg-rose-500/20 text-rose-300',
    store_owner:        'bg-brand-500/20 text-brand-300',
    store_sales_person: 'bg-emerald-500/20 text-emerald-300',
  };
  return colorMap[roleId] || 'bg-slate-500/20 text-slate-300';
}
