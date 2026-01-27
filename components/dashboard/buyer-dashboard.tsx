"use client";

import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, TrendingUp, ShoppingCart, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import React, { memo, useCallback } from "react";

// Helper for emojis
function getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
        'Grains': '🌾',
        'Pulses': '🫘',
        'Oils': '🛢️',
        'Spices': '🌶️',
        'Sweeteners': '🍯',
        'Beverages': '☕',
        'Flours': '🥯',
        'Fashion': '👕',
        'Body Care': '🧴',
        'Bath Products': '🛁',
        'Electronics': '⌚'
    };
    return emojiMap[category] || '📦';
}

export function BuyerDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const timer = setTimeout(() => {
            if (isMounted) {
                console.warn("Buyer dashboard load timed out");
                setLoading(false);
            }
        }, 5000);

        async function loadData() {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('is_active', true)
                    .order('demand_score', { ascending: false }) // Show high demand first
                    .limit(10);

                if (error) throw error;

                if (isMounted) {
                    if (data) setProducts(data);
                }
            } catch (error) {
                console.error("Dashboard data load failed:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    clearTimeout(timer);
                }
            }
        }
        loadData();

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    const highDemandProducts = products.slice(0, 3);
    const recommendedProducts = products.slice(3, 8);
    const marketplacePreview = products;

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="min-h-screen pb-20 dark:bg-zinc-950 bg-background relative selection:bg-blue-500/30 transition-colors duration-300">
            {/* Design System: Grainy Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-300">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950 hidden dark:block" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnPjxmaWx0ZXIgaWQ9J24nPjxmZVR1cmJ1bGVuY2UgdHlwZT0nZnJhY3RhbE5vaXNlJyBiYXNlRnJlcXVlbmN5PScwLjUnIHN0aXRjaFRpbGVzPSdzdGl0Y2gnLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWx0ZXI9J3VybCgjbiknIG9wYWNpdHk9JzAuNCcvPjwvc3ZnPg==')] opacity-0 dark:opacity-20 bg-repeat mix-blend-overlay" />
                <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen hidden dark:block" />
            </div>

            <div className="container mx-auto px-6 py-10 relative z-10">
                {/* Welcome Hero */}
                <div className="flex flex-col items-start gap-4 mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
                        Welcome back, <span className="text-blue-600 dark:text-blue-500">{user?.name}</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                        Find the best products for your shop.
                    </p>
                </div>

                {/* AI Recommendations Section */}
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Recommended for You</h2>
                                <p className="text-sm text-zinc-500">Based on your location & sales history</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 gap-2" onClick={() => router.push('/inspection')}>
                                <ShieldCheck className="w-4 h-4" /> Scan Internal QR
                            </Button>
                            <Button variant="ghost" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white group" onClick={() => router.push('/marketplace')}>
                                View Marketplace <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="w-full whitespace-nowrap pb-4">
                        <div className="flex gap-6 pb-4">
                            {recommendedProducts.map((p, i) => (
                                <ProductCard key={p.id} product={p} index={i} />
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" className="bg-zinc-800/50" />
                    </ScrollArea>
                </section>

                {/* Categories Grid (Discovery) */}
                <section>
                    <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white flex items-center gap-2">
                        Browse top Categories
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty'].map((cat, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                onClick={() => router.push(`/marketplace?category=${encodeURIComponent(cat)}`)}
                            >
                                <Card className="bg-white dark:bg-white/[0.03] border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/[0.08] hover:border-zinc-300 dark:hover:border-white/10 cursor-pointer h-40 group relative overflow-hidden shadow-sm dark:shadow-none">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <CardContent className="flex flex-col items-center justify-center h-full relative z-10">
                                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <span className="text-2xl">
                                                {cat === 'Electronics' ? '⌚' : cat === 'Fashion' ? '👕' : cat === 'Beauty' ? '🧴' : '🏠'}
                                            </span>
                                        </div>
                                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">{cat}</span>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Popular Products Grid (Discovery) */}
                <section className="mt-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            Explore Marketplace
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {marketplacePreview.map((p, i) => (
                            <ProductGridItem key={p.id} product={p} index={i} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function ProductGridItem({ product, index }: { product: any, index: number }) {
    const router = useRouter();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            viewport={{ once: true }}
            onClick={() => router.push(`/product/${product.id}`)}
        >
            <div className="group rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 overflow-hidden hover:border-zinc-300 dark:hover:border-white/10 hover:shadow-lg dark:hover:shadow-none transition-all cursor-pointer h-full flex flex-col">
                <div className="h-48 bg-zinc-100 dark:bg-zinc-800 relative">
                    <div className="absolute top-2 right-2 bg-white/70 dark:bg-black/50 text-zinc-900 dark:text-white text-xs px-2 py-1 rounded backdrop-blur-md font-medium z-10">
                        Min: {product.min_order_quantity}{product.unit}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-4xl bg-zinc-50 dark:bg-zinc-900">
                        {product.image_url ? (
                            <Image src={product.image_url} alt={product.name} fill className="object-contain" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" />
                        ) : (
                            getCategoryEmoji(product.category)
                        )}
                    </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-zinc-900 dark:text-white truncate max-w-[150px]">{product.name}</h3>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">₹{product.base_price}/{product.unit}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-3 line-clamp-1">{product.category}</p>
                    <div className="mt-auto">
                        <Button size="sm" className="w-full bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white text-zinc-900 dark:text-white hover:text-black border border-zinc-200 dark:border-white/5 transition-colors">
                            Buy Now
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}


function ProductCard({ product, index }: { product: any, index: number }) {
    const router = useRouter();
    const { addToCart } = useCart();
    return (
        <motion.div
            className="inline-block w-[320px]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => router.push(`/product/${product.id}`)}
        >
            <div className="group h-full flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 overflow-hidden hover:border-blue-500/30 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all cursor-pointer relative shadow-sm dark:shadow-none">

                <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-emerald-500/90 backdrop-blur-md text-white border-0 shadow-lg font-medium px-3">
                        <TrendingUp className="w-3 h-3 mr-1" /> {product.demand_level} Demand
                    </Badge>
                </div>

                <div className="h-48 relative overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400 dark:text-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 group-hover:scale-105 transition-transform duration-500">
                        {product.image_url ? (
                            <Image src={product.image_url} alt={product.name} fill className="object-contain" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                        ) : (
                            <span className="text-6xl">{getCategoryEmoji(product.category)}</span>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{product.name}</h3>
                        <div className="text-yellow-600 dark:text-yellow-400 text-xs font-bold bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">
                            4.8 ★
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 mb-4">
                        <div>
                            <p className="text-xs text-zinc-500 uppercase font-semibold">Margin</p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">+{product.expected_margin}%</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-zinc-500 uppercase font-semibold">Price</p>
                            <p className="text-zinc-900 dark:text-white font-bold text-lg">₹{product.base_price}</p>
                        </div>
                    </div>

                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product.id, product.min_order_quantity || 1);
                        }}
                        className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 hover:scale-[1.02] transition-all font-semibold rounded-xl"
                    >
                        Add to Cart
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}

function RecommendationCard({ product, delay }: { product: any, delay: number }) {
    const router = useRouter();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            onClick={() => router.push(`/product/${product.id}`)}
        >
            <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 hover:border-blue-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 transition-all cursor-pointer group h-full relative overflow-hidden shadow-lg dark:shadow-none">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-24 h-24 text-blue-500" />
                </div>

                <CardContent className="p-6 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-4xl shadow-inner overflow-hidden relative">
                            {product.image_url ? (
                                <Image src={product.image_url} alt={product.name} fill className="object-contain" sizes="64px" />
                            ) : (
                                <span>{getCategoryEmoji(product.category)}</span>
                            )}
                        </div>
                        <Badge className={`${product.demand_level === 'High' ? 'bg-emerald-500' : 'bg-blue-500'} text-white border-0 shadow-lg`}>
                            {product.demand_level} Demand
                        </Badge>
                    </div>

                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-zinc-500 delay-0 mb-6 flex items-center gap-1.5 bg-zinc-100 dark:bg-white/5 p-2 rounded-lg border border-zinc-200 dark:border-white/5 line-clamp-1">
                        <Sparkles className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />
                        Reason: {product.recommendation_reason || 'High sales volume'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5">
                            <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Exp. Margin</div>
                            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+{product.expected_margin}%</div>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5">
                            <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Buy Price</div>
                            <div className="text-xl font-bold text-zinc-900 dark:text-white">₹{product.base_price}<span className="text-sm font-normal text-zinc-500 dark:text-zinc-600">/{product.unit}</span></div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <span>{product.supplier_count || 1} Suppliers</span>
                        </div>
                        <Button size="icon" className="rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-colors">
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="min-h-screen pb-20 dark:bg-zinc-950 bg-background p-10 space-y-12">
            <div className="space-y-4">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-6 w-96" />
            </div>
            <div className="space-y-4">
                <div className="flex justify-between">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-80 w-80 rounded-3xl shrink-0" />
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
            </div>
        </div>
    )
}
