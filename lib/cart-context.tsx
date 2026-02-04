'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface CartContextType {
    cartCount: number;
    refreshCart: () => Promise<void>;
    addToCart: (productId: string, quantity: number) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [cartCount, setCartCount] = useState(0);

    const refreshCart = async () => {
        if (!user) {
            setCartCount(0);
            return;
        }
        try {
            const res = await fetch('/api/cart', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                // Assuming API returns array of items. Count unique items or total quantity?
                // Usually badge shows number of unique items or total quantity. 
                // Let's assume unique items for now as is common.
                setCartCount(data.length);
            }
        } catch (error) {
            console.error('Error fetching cart count:', error);
        }
    };

    const addToCart = async (productId: string, quantity: number) => {
        if (!user) {
            toast.error('Please login to add items to cart');
            return false;
        }
        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: productId, quantity }),
            });

            if (!res.ok) throw new Error('Failed to add to cart');

            await refreshCart();
            toast.success('Added to cart');
            return true;
        } catch (error) {
            toast.error('Failed to add item to cart');
            console.error(error);
            return false;
        }
    };

    useEffect(() => {
        refreshCart();
    }, [user]);

    return (
        <CartContext.Provider value={{ cartCount, refreshCart, addToCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
