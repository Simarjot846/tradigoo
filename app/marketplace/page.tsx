'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, ShoppingBag, Truck, ShieldCheck, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase-client';
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Suspense } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import MarketplaceLoading from './loading';
import ProductCard from "@/components/marketplace/product-card";

function MarketplaceContent() {
  const { user, loading } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [deliveryFilter, setDeliveryFilter] = useState<string | null>(null);
  const [moqFilter, setMoqFilter] = useState<string | null>(null);

  // Data State
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Update filter if URL param changes
  useEffect(() => {
    // Reset filters first
    setCategoryFilter(initialCategory);
    setSearchQuery('');

    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) setCategoryFilter(categoryFromUrl);

    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      console.log("Search query received:", searchFromUrl); // Debug log
      setSearchQuery(decodeURIComponent(searchFromUrl));
    }
  }, [searchParams, initialCategory]);

  // Load products from Supabase
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 24;
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted && loadingProducts) {
        console.warn("Marketplace load timed out");
        setLoadingProducts(false);
      }
    }, 8000);

    async function loadProducts(isLoadMore = false) {
      if (!isLoadMore) setLoadingProducts(true);

      try {
        const supabase = createClient();
        const start = page * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE - 1;

        const { data, error } = await supabase
          .from('products')
          .select('id, name, category, base_price, unit, min_order_quantity, image_url, description, demand_level')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(start, end);

        if (error) throw error;

        if (isMounted) {
          if (data && data.length < ITEMS_PER_PAGE) {
            setHasMore(false);
          }
          if (isLoadMore) {
            setProducts(prev => [...prev, ...(data || [])]);
          } else {
            setProducts(data || []);
          }
        }
      } catch (error) {
        console.error("Marketplace load error:", error);
      } finally {
        if (isMounted) {
          setLoadingProducts(false);
          clearTimeout(timer);
        }
      }
    }
    loadProducts(page > 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [page]); // Re-run when page changes

  const loadMore = () => setPage(p => p + 1);

  // Use client-side filtering for simplicity given the mock/small dataset
  const filteredProducts = products.filter(p => {
    // 1. Search text
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = !searchLower ||
      (p.name && p.name.toLowerCase().includes(searchLower)) ||
      (p.category && p.category.toLowerCase().includes(searchLower)) ||
      (p.description && p.description.toLowerCase().includes(searchLower)); // Added description search

    // 2. Category
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

    // 3. Price
    const matchesPrice = p.base_price >= priceRange[0] && p.base_price <= priceRange[1];

    // 4. Rating (Mock check as rating isn't in DB yet, assuming 4.5 default)
    const matchesRating = 4.5 >= minRating;

    // 5. MOQ
    let matchesMoq = true;
    if (moqFilter === 'low') matchesMoq = p.min_order_quantity < 50;
    if (moqFilter === 'medium') matchesMoq = p.min_order_quantity >= 50 && p.min_order_quantity <= 200;
    if (moqFilter === 'high') matchesMoq = p.min_order_quantity > 200;

    return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesMoq;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  if (loading || loadingProducts) {
    return <MarketplaceLoading />;
  }


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans relative selection:bg-blue-500/30">
      {/* Global Grain Effect (Dark Mode Only) - Removed for Performance */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-0 dark:opacity-20 bg-gradient-to-br from-zinc-900 to-black mix-blend-overlay" />

      {/* 1. Header / Top Filter Bar (Sticky) */}
      <div className="sticky top-[72px] z-30 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-bold text-zinc-900 dark:text-white">{filteredProducts.length}</span> results for <span className="font-bold text-blue-600 dark:text-blue-400">&quot;{categoryFilter === 'all' ? 'All Products' : categoryFilter}&quot;</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-600 dark:text-zinc-500">Sort by:</span>
            <Select defaultValue="relevance">
              <SelectTrigger className="w-[160px] h-9 text-xs bg-zinc-100 dark:bg-[#1a1a1a] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-200 ring-offset-0 focus:ring-0">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-200">
                <SelectItem value="relevance">Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Avg. Customer Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 relative z-10">

        {/* 2. Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0 space-y-8">
          {/* Category Filter */}
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-3">Department</h3>
            <div className="flex flex-col gap-1.5 text-sm text-zinc-600 dark:text-zinc-500">
              {categories.map(cat => (
                <button
                  key={cat} onClick={() => setCategoryFilter(cat)}
                  className={`text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${categoryFilter === cat ? 'font-bold text-blue-600 dark:text-blue-500' : ''}`}
                >
                  {cat === 'all' ? 'Any Department' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-3">Price</h3>
            <div className="px-1">
              <Slider
                defaultValue={[0, 5000]}
                max={10000}
                step={100}
                value={priceRange}
                onValueChange={setPriceRange}
                className="my-4"
              />
              <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>₹{priceRange[0]}</span>
                <span>₹{priceRange[1]}+</span>
              </div>
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-3">Avg. Customer Review</h3>
            {[4, 3, 2, 1].map(stars => (
              <div
                key={stars}
                className="flex items-center gap-2 cursor-pointer group text-sm mb-1.5"
                onClick={() => setMinRating(stars)}
              >
                <div className="flex text-yellow-500/80 group-hover:text-yellow-500 transition-colors">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < stars ? "currentColor" : "none"} strokeWidth={i < stars ? 0 : 1.5} className={i < stars ? "" : "text-zinc-300 dark:text-zinc-700"} />
                  ))}
                </div>
                <span className="text-zinc-600 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 transition-colors">& Up</span>
              </div>
            ))}
          </div>

          {/* MOQ Filter */}
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-3">Minimum Order Qty</h3>
            <div className="flex flex-col gap-3">
              {['low', 'medium', 'high'].map(type => (
                <div key={type} className="flex items-center gap-3">
                  <Checkbox id={`moq-${type}`} checked={moqFilter === type} onCheckedChange={(c) => setMoqFilter(c ? type : null)} className="border-zinc-300 dark:border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                  <label htmlFor={`moq-${type}`} className="text-sm cursor-pointer capitalize text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">
                    {type === 'low' ? '< 50 units' : type === 'medium' ? '50 - 200 units' : '> 200 units'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Other Filters */}
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-3">Supplier Type</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Checkbox id="verified" checked={verifiedOnly} onCheckedChange={(c) => setVerifiedOnly(!!c)} className="border-zinc-300 dark:border-white/20 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                <label htmlFor="verified" className="text-sm cursor-pointer flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">
                  Verified Supplier <ShieldCheck size={14} className="text-emerald-500" />
                </label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="prime" className="border-zinc-300 dark:border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <label htmlFor="prime" className="text-sm cursor-pointer text-blue-500 dark:text-blue-400 font-bold italic flex items-center gap-1">
                  Tradigoo <span className="text-zinc-900 dark:text-white not-italic font-normal">Prime</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* 3. Product Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                addToCart={addToCart}
                getCategoryEmoji={getCategoryEmoji}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && filteredProducts.length > 0 && !loadingProducts && (
            <div className="flex justify-center mt-12">
              <Button
                onClick={loadMore}
                variant="outline"
                className="px-8 py-6 rounded-full border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-900 dark:text-white font-bold transition-all hover:scale-105"
              >
                Load More Products
              </Button>
            </div>
          )}

          {loadingProducts && page > 0 && (
            <div className="flex justify-center mt-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-24 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <div className="w-20 h-20 bg-zinc-50 dark:bg-[#161616] rounded-full flex items-center justify-center mx-auto mb-6">
                <Filter className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No products found</h3>
              <p className="text-zinc-500 dark:text-zinc-500 mb-6">Try adjusting your filters or search terms.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchQuery('');
                  setPriceRange([0, 5000]);
                }}
                className="border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



export default function MarketplacePage() {
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <MarketplaceContent />
    </Suspense>
  );
}

function MarketplaceSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex justify-center py-20 px-4">
      <div className="container mx-auto space-y-8">
        <div className="flex gap-8">
          <div className="hidden md:block w-64 space-y-8">
            <Skeleton className="h-8 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-52 w-full rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
    'Electronics': '⌚',
    'Home & Kitchen': '🏠'
  };
  return emojiMap[category] || '📦';
}
