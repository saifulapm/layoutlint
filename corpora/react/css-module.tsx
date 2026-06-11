import styles from './badge.module.css';

export function StatusBadge({ status = 'Active' }: { status?: string }) {
  return (
    <div className="flex items-center gap-2 p-4">
      <span className={`${styles.badge} rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white`}>
        {status}
      </span>
      <p className="text-sm text-gray-600">CSS-module classes pass through as inert strings.</p>
    </div>
  );
}
