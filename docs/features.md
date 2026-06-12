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
| **Super Admin** | `super_admin` | Controls the entire platform and all stores. Bypasses all store-level security restrictions. | Platform-wide |
| **Store Owner** | `store_owner` | Manages their own store and staff. Full control over their organization's data, billing, and settings. | Single Store (Full Access) |
| **Store Sales Person** | `store_sales_person` | Handles daily sales and stock operations. Cannot access settings, billing, or advanced reports. | Single Store (Operations) |

---

### Developer Demo Accounts

To facilitate rapid testing and verification of role capabilities, the login screen includes a **Quick Sign-In** panel. Clicking any role button automatically logs you in. If the account doesn't exist yet, it is registered on-the-fly under a shared tenant workspace named **Demo Corporation**.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `demo.superadmin@smartventory.com` | `demoPassword123` |
| **Store Owner** | `demo.owner@smartventory.com` | `demoPassword123` |
| **Store Sales Person** | `demo.sales@smartventory.com` | `demoPassword123` |

---

### Permissions Matrix

| Permission | Super Admin | Store Owner | Store Sales Person |
| :--- | :---: | :---: | :---: |
| **View Dashboard** | ✓ | ✓ | ✓ |
| **Manage Products & Categories** | ✓ | ✓ | - |
| **Manage Sales Orders** | ✓ | ✓ | ✓ |
| **Manage Purchase Orders** | ✓ | ✓ | - |
| **Stock In/Out/Transfer/Count** | ✓ | ✓ | ✓ |
| **Stock Adjustments / Approvals**| ✓ | ✓ | - |
| **Manage Suppliers** | ✓ | ✓ | - |
| **Manage Warehouses** | ✓ | ✓ | Read-only |
| **View Financial Reports** | ✓ | ✓ | - |
| **Manage Team & Invites** | ✓ | ✓ | - |
| **System Settings & Billing** | ✓ | ✓ | - |
| **View Audit Logs** | ✓ | ✓ | - |

---

## Technical Capabilities
- **Real-time Data:** Synchronization of multi-tenant inventory data using Firebase Firestore.
- **Responsive Design:** Optimized for desktop, tablet, and mobile viewing using Tailwind CSS.
- **Client-side Routing:** Fast and seamless navigation powered by React Router, integrated with `RoleRoute` protection.

