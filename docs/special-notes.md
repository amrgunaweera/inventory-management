# Special Notes & Considerations

## Tech Stack
- **Frontend Framework:** React 19 (via Vite)
- **Styling:** Tailwind CSS 3.4
- **Icons:** `@tabler/icons-react`
- **Charts:** `recharts`
- **Backend/BaaS:** Firebase (Auth, Firestore, Hosting)

## Development Setup
- The application uses `npm run dev` to start the Vite development server.
- The entry point is `src/main.jsx`, which renders the `App` component wrapped in several context providers (`AuthProvider`, `SubscriptionProvider`, `InventoryProvider`).

## Authentication & Routing
- **`PrivateRoute`**: Checks if the user is authenticated in Firebase Auth. Redirects to `/login` if not.
- **`RoleRoute`**: Wraps routes that require specific permissions (mapped in `src/lib/roles.js`). If the authenticated user's current role does not have the required permission, they are redirected to the `/access-denied` page.
- **Loading & State**: While user profiles and roles are fetched, the application displays a full-screen loading spinner.

## UI Gating & Component Protection
- **`RoleGate`**: A React wrapper component that renders its children only if the user has the required permission(s). You can specify single or multiple permissions, or allow access if they have *any* of the listed permissions.
- **`hasPermission(role, permission)` Hook/Helper**: Used to conditionally disable buttons, hide table columns, or block actions inline inside JSX files.
- **Dynamic Dashboards**: Components like the dashboard customize visual KPIs (e.g. Sales Users see Sales metrics, Purchasing Officers see Purchase metrics) and hide features using the helper hooks.

## Multi-Tenant Architecture & Data Model

The application isolates data using a hierarchical Firestore structure scoped to an **Organization**. This prevents cross-tenant data leaks and supports shared collaborative workspaces.

### Firestore Path Layout

```
├── users/{uid}                             # User profile details
│   └── currentOrgId                        # ID of the user's active organization
│
└── organizations/{orgId}                   # Root organization document
    │   ├── name                            # Organization name
    │   └── subscriptionPlan                # Billing plan details (Free, Pro, Business)
    │
    ├── members/{uid}                       # Subcollection of members
    │   └── role                            # Member role (admin, inventory_manager, etc.)
    │
    ├── invitations/{inviteId}              # Active email invites to join the organization
    │
    ├── products/{id}                       # Products belonging to the organization
    ├── categories/{id}                     # Product categories
    ├── orders/{id}                         # Sales and Purchase orders
    ├── suppliers/{id}                      # Vendor registry
    ├── warehouses/{id}                     # Warehouses / Physical storage locations
    └── auditLog/{id}                       # System action ledger (Admin only)
```

## Database & Security Rules

Database security is enforced at the database level inside [firestore.rules](file:///c:/VCS\sandbox\inventory-management\firestore.rules).

### Security Helpers

- **`isOrgMember(orgId)`**: Returns `true` if the requesting user's UID exists as a document in `organizations/{orgId}/members/`.
- **`isOrgAdmin(orgId)`**: Returns `true` if the requesting user is a member *and* their member document specifies their `role` as `'admin'`.

### Data Protection Rules

1. **Access Isolation**: Documents in all collections under `/organizations/{orgId}/` (products, orders, categories, etc.) are only readable and writeable if `isOrgMember(orgId)` is met.
2. **Settings and Plan Management**: Modifying organization root details is restricted to `isOrgAdmin(orgId)`.
3. **Members & Invites**: Members can see fellow members. Admins can update/delete members and issue invitations. Authenticated users can read invitations to match their email and update status to accept them.
4. **Audit Logs**: Any member can create audit log records, but only administrators can view (`read`) the audit log.

