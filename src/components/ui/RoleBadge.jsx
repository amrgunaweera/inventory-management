/**
 * RoleBadge — Visual badge displaying the user's role with color coding.
 *
 * Usage:
 *   <RoleBadge role="admin" />
 *   <RoleBadge role="sales_user" size="sm" />
 */

import { ROLES, getRoleColorClasses } from '../../lib/roles';

export default function RoleBadge({ role, size = 'md', className = '' }) {
  if (!role || !ROLES[role]) return null;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full border
        ${getRoleColorClasses(role)}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
    >
      {ROLES[role].label}
    </span>
  );
}
