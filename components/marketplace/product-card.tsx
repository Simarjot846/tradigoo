"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductCardProps {
    product: any;
    addToCart: (id: string, qty: number) => void;
    getCategoryEmoji: (cat: string) => string;
}

const ProductCard = memo(({ product, addToCart, getCategoryEmoji }: ProductCardProps) => {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => router.push(`/product/${product.id}`)}
            className="group bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] transition-all cursor-pointer flex flex-col relative shadow-sm dark:shadow-none"
        >
            {/* Image Area */}
            <div className="h-52 p-6 bg-zinc-50 dark:bg-[#161616] flex items-center justify-center relative overflow-hidden">
                {product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-contain group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        loading="lazy"
                    />
                ) : (
                    <span className="text-5xl">{getCategoryEmoji(product.category)}</span>
                )}
                <div className="absolute top-3 left-3 z-10">
                    <Badge className="bg-blue-600/90 text-white border-0 text-[10px] uppercase font-bold px-2 py-0.5 shadow-lg shadow-blue-600/20">Best Seller</Badge>
                </div>
            </div>

            {/* Details */}
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {product.name}
                </h3>

                <div className="flex items-center gap-2 mb-3">
                    <div className="flex text-yellow-500 text-xs">
                        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" strokeWidth={0} />)}
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline">1,240 reviews</span>
                </div>

                <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-sm align-top text-zinc-500 dark:text-zinc-400">₹</span>
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">{product.base_price}</span>
                    <span className="text-xs text-zinc-500 font-mono">/{product.unit}</span>
                </div>

                <div className="text-xs text-zinc-500 mt-1 mb-4">
                    Min. order: <span className="text-zinc-700 dark:text-zinc-300">{product.min_order_quantity} {product.unit}</span>
                </div>

                <div className="mt-auto flex gap-2">
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product.id, product.min_order_quantity || 1);
                            router.push('/cart');
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
                    >
                        Buy Now
                    </Button>
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product.id, product.min_order_quantity || 1);
                        }}
                        className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white font-bold h-10 transition-all hover:scale-[1.02]"
                    >
                        Add to Cart
                    </Button>
                </div>
            </div>
        </motion.div>
    );
});

ProductCard.displayName = "ProductCard";
export default ProductCard;
