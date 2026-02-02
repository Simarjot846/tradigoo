"use client";

import { useAuth } from "@/lib/auth-context";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

// Lazy Load Dashboards
const BuyerDashboard = dynamic(() => import('@/components/dashboard/buyer-dashboard').then(mod => mod.BuyerDashboard), {
  loading: () => <DashboardSkeleton />,
});
const SellerDashboard = dynamic(() => import('@/components/dashboard/seller-dashboard').then(mod => mod.SellerDashboard), {
  loading: () => <DashboardSkeleton />,
});

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated and not loading
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Show skeleton if loading
  if (loading) {
    return <DashboardSkeleton />;
  }

  // If not loading but no user, it means we are unauthenticated or about to redirect
  if (!user) {
    return <DashboardSkeleton />; // Show skeleton while redirecting or if unauthenticated
  }

  // Strict Role-Based Rendering
  if (user.role === 'wholesaler') {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <SellerDashboard />
      </Suspense>
    );
  }

  // Default to Buyer Dashboard for retailers or undefined roles
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <BuyerDashboard />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 space-y-8">
      {/* Header Skeleton */}
      <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        ))}
      </div>

      {/* Chart/Table Skeleton */}
      <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
    </div>
  );
}
