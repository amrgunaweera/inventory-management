# Smartventory (Inventory Management System)

A modern, responsive, and real-time inventory management system built with React, Tailwind CSS, and Firebase.

## Brief Overview
Smartventory is a multi-tenant, role-based inventory management platform designed for organizations with collaborative teams. It supports multiple users with granular role privileges, physical warehouse locations, vendor management, real-time audit logging, automated low-stock notifications, and organization-wide subscription billing.

## Features Available
- **Multi-Tenant Organization Model:** Share product databases, warehouses, alerts, and orders securely within your company workspace.
- **Role-Based Access Control (RBAC):** Define granular access privileges using 6 pre-configured roles (Administrator, Inventory Manager, Warehouse Staff, Purchasing Officer, Sales User, Management).
- **Dashboard Analytics:** Role-tailored dashboards showcasing relevant key performance indicators.
- **Product & Category Management:** Complete catalog management with customizable category taxonomies.
- **Order Tracking:** Manage inbound purchase orders and outbound sales orders with role restrictions.
- **Warehouses & Locations:** Track inventory quantities and transfer stock across multiple warehouses.
- **Supplier Directory:** Register and monitor suppliers and associated products.
- **Audit Logs:** Immutable, organization-wide transaction tracing for all critical resource updates.
- **Alerts System:** Automated notifications for low stock, order completions, and structural changes.
- **Data Export:** Secure exports of inventory levels and transaction histories to CSV formats.
- **Billing:** Scalable organization-wide plan management (Free, Pro, Business).

For detailed documentation, please refer to:
- [System Features & Roles](docs/features.md)
- [Technical Architecture & Security](docs/special-notes.md)

## Quick Start
```bash
npm install
npm run dev
```
