'use client';
import { usePWA } from '@/hooks/usePWA';

export function OfflineBadge() {
  const { isOnline } = usePWA();
  if (isOnline) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-amber-950 text-center
                    text-xs font-semibold py-1.5 px-4">
      ⚠ You're offline — changes will sync when reconnected
    </div>
  );
}
