"use client";

import { useAuth } from "@/lib/auth-context";
import { BuyerDashboard } from "@/components/dashboard/buyer-dashboard";
import { SellerDashboard } from "@/components/dashboard/seller-dashboard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated and not loading
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Show skeleton if loading OR if we are about to redirect (user is null)
  // This prevents the blank page flash while redirecting
  if (loading || !user) {
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

  // Strict Role-Based Rendering
  if (user.role === 'wholesaler') {
    return <SellerDashboard />;
  }

  // Default to Buyer Dashboard for retailers or undefined roles
  return <BuyerDashboard />;
}
