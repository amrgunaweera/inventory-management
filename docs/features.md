# Smartventory Features

## Core Features
1. **Authentication:** Secure user login and protected routes using Firebase Authentication. Supports automatic matching of email invitations for new organization members.
2. **Dashboard:** A comprehensive overview of inventory metrics, recent activity, and KPIs using interactive charts. Features role-based customization (e.g., Sales Users see sales-specific metrics, while Purchasing Officers see purchase-specific metrics).
3. **Products Management:** Add, edit, delete, and view product details including stock levels, pricing, and SKUs. Restrictive access based on roles.
4. **Categories:** Organize products into categories for easier management and filtering.
5. **Orders:** Track and manage incoming (purchase) and outgoing (sales) orders. Access is filtered by role: Sales Users manage sales orders, and Purchasing Officers manage purchase orders.
6. **Reports:** Generate and view detailed reports on inventory valuation, stock movements, and sales/purchase trends.
7. **Alerts:** Automated notifications for low stock, expiring items, or other critical inventory events.
8. **Export:** Ability to export inventory data, reports, and orders to CSV formats.
9. **Settings:** Manage application configurations, personal profile details, and organization-wide preferences.
10. **Billing & Subscription:** Organization-scoped subscription plan management, billing history, and billing settings.
11. **Team Management:** Admin-only dashboard to view organization members, edit member roles, revoke membership, and send new email invitations.
12. **Suppliers Management:** Track vendor profiles, contact details, supplied categories, and order relationships.
13. **Warehouses Management:** Manage multiple physical stock locations, transfer stock between warehouses, and track inventory per location (available on Business plan).
14. **Audit Logging:** System-wide immutable activity logs tracking all critical database operations (add, edit, delete of products, orders, and settings) for accountability.

---

## Role-Based Access Control (RBAC)

Smartventory features a granular Role-Based Access Control system to secure your organizational data and restrict actions.

### User Roles & Responsibilities

| Role | Role Key | Description / Responsibilities | Primary Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | Full system control, system configurations, and billing. | Org Settings, Team, Audit Logs, Billing |
| **Inventory Manager** | `inventory_manager` | Responsible for overall inventory, products, categories, and stock adjustment approvals. | Entire Inventory, Products, Categories |
| **Warehouse Staff** | `warehouse_staff` | Handles day-to-day stock movements (Stock-in, Stock-out, and stock transfers). | Stock movements, warehouse views |
| **Purchasing Officer** | `purchasing_officer` | Manages procurement, supplier relationships, and purchase orders. | Suppliers, Purchase Orders, Procurement |
| **Sales User** | `sales_user` | Processes customer sales orders and sales-related inventory. | Sales Orders, Sales Reports |
| **Management** | `management` | Read-only auditor view. Monitors business performance without modifying any data. | Reports, Dashboards, Read-only Views |

---

### Permissions Matrix

| Permission | Admin | Inventory Manager | Warehouse Staff | Purchasing Officer | Sales User | Management |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **View Dashboard** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Full Dashboard Stats** | ✓ | ✓ | - | - | - | ✓ |
| **Manage Products (CUD)** | ✓ | ✓ | - | - | - | - |
| **View Products** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Manage Categories (CUD)** | ✓ | ✓ | - | - | - | - |
| **Manage Sales Orders** | ✓ | ✓ | - | - | ✓ | - |
| **Manage Purchase Orders** | ✓ | ✓ | - | ✓ | - | - |
| **Stock In/Out/Transfer** | ✓ | ✓ | ✓ | - | - | - |
| **Stock Adjustments / Approvals**| ✓ | ✓ | - | - | - | - |
| **Manage Suppliers** | ✓ (All) | ✓ | - | ✓ | - | Read-only |
| **Manage Warehouses** | ✓ | Read-only | Read-only | - | - | Read-only |
| **View Reports** | ✓ | ✓ | - | - | - | ✓ |
| **Manage Team & Invites** | ✓ | - | - | - | - | - |
| **System Settings** | ✓ | - | - | - | - | - |
| **Billing & Subscriptions** | ✓ | - | - | - | - | - |
| **View Audit Logs** | ✓ | - | - | - | - | - |

---

## Technical Capabilities
- **Real-time Data:** Synchronization of multi-tenant inventory data using Firebase Firestore.
- **Responsive Design:** Optimized for desktop, tablet, and mobile viewing using Tailwind CSS.
- **Client-side Routing:** Fast and seamless navigation powered by React Router, integrated with `RoleRoute` protection.

