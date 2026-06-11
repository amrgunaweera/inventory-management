/**
 * RoleGate — Conditionally renders children based on user permission.
 *
 * Usage:
 *   <RoleGate permission="products.delete">
 *     <button>Delete</button>
 *   </RoleGate>
 *
 *   <RoleGate permission="products.delete" fallback={<span>Read Only</span>}>
 *     <button>Delete</button>
 *   </RoleGate>
 *
 *   <RoleGate anyOf={['orders.create_sales', 'orders.create_purchase']}>
 *     <button>New Order</button>
 *   </RoleGate>
 */

import { useAuth } from '../../context/AuthContext';
import { hasAnyPermission } from '../../lib/roles';

export default function RoleGate({ permission, anyOf, children, fallback = null }) {
  const { user } = useAuth();
  const role = user?.role;

  let allowed = false;

  if (permission) {
    const { hasPermission } = useAuth();
    allowed = hasPermission(permission);
  } else if (anyOf && Array.isArray(anyOf)) {
    allowed = hasAnyPermission(role, anyOf);
  }

  return allowed ? children : fallback;
}
