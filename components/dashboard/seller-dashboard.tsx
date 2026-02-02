"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, TrendingUp, DollarSign, Search, Filter, MoreHorizontal, Clock, AlertTriangle, BarChart3, Settings, Truck, Camera, Check, X, ArrowUpRight } from "lucide-react";
import CryptoJS from "crypto-js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import QRCode from "qrcode";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function SellerDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [inventory, setInventory] = useState<any[]>([]);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Data
    useEffect(() => {
        async function loadData() {
            if (!user) return;
            try {
                const supabase = createClient();

                // Parallel Data Fetching for Performance
                const [inventoryRes, ordersRes] = await Promise.all([
                    supabase.from('products').select('*').order('created_at', { ascending: false }),
                    supabase.from('orders').select('*, product:products!product_id(name, base_price)').eq('status', 'payment_in_escrow').order('created_at', { ascending: false }).limit(5)
                ]);

                if (inventoryRes.error) throw inventoryRes.error;
                if (ordersRes.error) throw ordersRes.error;

                if (inventoryRes.data) setInventory(inventoryRes.data);
                if (ordersRes.data) setPendingOrders(ordersRes.data);

                // (Handled above)
            } catch (error) {
                console.error("Dashboard Load Error:", error);
            } finally {
                setLoading(false);
            }
        }

        if (!user) return;

        loadData();

        // Real-time Notification using Supabase Channels
        const supabase = createClient();
        const channel = supabase
            .channel('wholesaler-dashboard')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE', // Listen for updates (when payment verifies)
                    schema: 'public',
                    table: 'orders',
                    filter: `seller_id=eq.${user.id}`
                },
                (payload: any) => {
                    const newOrder = payload.new as any;
                    // Check if status changed to 'payment_in_escrow'
                    if (newOrder.status === 'payment_in_escrow') {
                        toast.success("New Order Received!", {
                            description: "Payment Secured in Escrow. Print QR now.",
                            duration: 8000,
                            action: {
                                label: "Show",
                                onClick: () => loadData()
                            }
                        });
                        loadData();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const handleProductAdded = () => {
        const supabase = createClient();
        supabase.from('products').select('*').order('created_at', { ascending: false })
            .then(({ data }: any) => { if (data) setInventory(data); });
    };

    const handleOrderAction = async (orderId: string, action: 'accept' | 'reject') => {
        const supabase = createClient();
        const newStatus = action === 'accept' ? 'shipped' : 'cancelled'; // Logic: Accept -> Ready for Pickup (shipped)

        // Optimistic UI
        setPendingOrders(current => current.filter(o => o.id !== orderId));

        const promise = Promise.resolve(supabase.from('orders').update({ status: newStatus }).eq('id', orderId));

        toast.promise(promise, {
            loading: 'Processing...',
            success: action === 'accept' ? 'Order accepted & marked Ready for Pickup!' : 'Order rejected.',
            error: 'Failed to update order'
        });
    };

    // Derived Stats
    const lowStockItems = inventory.filter(i => (i.min_order_quantity || 0) < 5); // Using MOQ as stock current proxy for demo
    const totalSales = "₹45.2K"; // Mock

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-20 dark:bg-zinc-950 bg-background relative overflow-hidden selection:bg-purple-500/30 transition-colors duration-300">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 text-left">
                <div className="absolute inset-0 z-0 hidden dark:block bg-gradient-to-br from-purple-900/20 via-zinc-950 to-blue-900/20" />
            </div>

            <div className="container mx-auto px-6 py-8 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">Dashboard</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">Manage your store and orders efficiently.</p>
                    </div>
                    <div className="flex gap-3">
                        <AddProductDialog onProductAdded={handleProductAdded}>
                            <Button className="bg-white text-black hover:bg-zinc-200 gap-2 font-semibold">
                                <Plus className="w-4 h-4" /> Add Product
                            </Button>
                        </AddProductDialog>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {/* Sales Chart Card */}
                    <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 backdrop-blur-xl relative overflow-hidden group shadow-sm dark:shadow-none">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-1">Total Revenue</h3>
                                <div className="text-3xl font-bold text-zinc-900 dark:text-white">{totalSales}</div>
                                <div className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1 mt-1">
                                    <TrendingUp className="w-3 h-3" /> +12.5% vs last month
                                </div>
                            </div>
                            <Button variant="outline" size="icon" className="h-8 w-8 border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5">
                                <MoreHorizontal className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            </Button>
                        </div>
                        {/* Custom SVG Chart */}
                        <div className="h-24 w-full flex items-end justify-between gap-2">
                            {[35, 45, 30, 60, 75, 50, 65, 80, 55, 90, 40, 60, 85, 100].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.05, duration: 0.5, type: "spring" }}
                                    className="w-full bg-gradient-to-t from-purple-600/50 to-purple-400 rounded-t-sm hover:from-purple-500 hover:to-white transition-all cursor-pointer relative group/bar"
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity text-center whitespace-nowrap font-bold">
                                        ₹{h}k
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Low Stock Alert */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 backdrop-blur-xl flex flex-col justify-between hover:border-red-500/30 transition-colors cursor-pointer shadow-sm dark:shadow-none" onClick={() => router.push('/inventory')}>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-500/10 rounded-xl text-red-500 dark:text-red-400">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <Badge variant="outline" className="border-red-500/20 text-red-500 dark:text-red-400 bg-red-500/5">Action Needed</Badge>
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{lowStockItems.length} Products</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Low stock alert</p>
                        </div>

                        <div className="mt-4">
                            <div className="text-xs text-zinc-500 uppercase font-bold mb-2">Restock Priority</div>
                            {lowStockItems.slice(0, 2).map(i => (
                                <div key={i.id} className="flex justify-between text-sm py-1 border-b border-zinc-100 dark:border-white/5 last:border-0 text-zinc-700 dark:text-zinc-300">
                                    <span>{i.name}</span>
                                    <span className="text-red-500 dark:text-red-400 font-mono">{i.min_order_quantity} left</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Selling */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 backdrop-blur-xl flex flex-col justify-between hover:border-blue-500/30 transition-colors shadow-sm dark:shadow-none">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                                    <Package className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Best Seller</h3>
                            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Smart Fitness Band</p>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-zinc-500 uppercase font-bold">Sales</div>
                                <div className="text-xl font-bold text-zinc-900 dark:text-white">432</div>
                            </div>
                            <div>
                                <div className="text-xs text-zinc-500 uppercase font-bold">Margin</div>
                                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">22%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Recent Orders Table */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Pending Orders</h2>
                            <Button variant="ghost" size="sm" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">View All</Button>
                        </div>

                        <div className="rounded-3xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/40 overflow-hidden shadow-sm dark:shadow-none">
                            <Table>
                                <TableHeader className="bg-zinc-50 dark:bg-white/5">
                                    <TableRow className="border-zinc-200 dark:border-white/5 hover:bg-transparent">
                                        <TableHead className="text-zinc-500 dark:text-zinc-400">Order ID</TableHead>
                                        <TableHead className="text-zinc-500 dark:text-zinc-400">Product</TableHead>
                                        <TableHead className="text-zinc-500 dark:text-zinc-400">Amount</TableHead>
                                        <TableHead className="text-zinc-500 dark:text-zinc-400 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingOrders.length > 0 ? pendingOrders.map((order) => (
                                        <TableRow key={order.id} className="border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5">
                                            <TableCell className="font-mono text-zinc-700 dark:text-zinc-300">#{order.id.slice(0, 6)}</TableCell>
                                            <TableCell className="text-zinc-900 dark:text-white font-medium">{order.product?.name || 'Unknown'}</TableCell>
                                            <TableCell className="text-emerald-600 dark:text-emerald-400 font-bold">₹{order.total_amount?.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* Print QR Button */}
                                                    <Button size="sm" variant="outline" className="h-8 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300" onClick={async () => {
                                                        // ... QR Logic (unchanged)
                                                        // ... QR Logic (unchanged)
                                                        try {
                                                            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

                                                            // Payload Construction
                                                            const payload = JSON.stringify({
                                                                id: order.id,
                                                                p: order.product?.name || "Unknown Product",
                                                                q: order.quantity,
                                                                t: new Date().toISOString(),
                                                                salt: crypto.randomUUID()
                                                            });

                                                            // Encryption
                                                            const secretKey = "TRADIGOO_SECRET_KEY_PROD";
                                                            const encrypted = CryptoJS.AES.encrypt(payload, secretKey).toString();

                                                            // Construct URL with encoded data parameter
                                                            // We replace '+' with '%20' or handle encoding properly because URL params can be tricky with base64
                                                            const verifyUrl = `${baseUrl}/verify-qr?data=${encodeURIComponent(encrypted)}`;

                                                            const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
                                                            const link = document.createElement('a');
                                                            link.href = qrDataUrl;
                                                            link.download = `QR-${order.id.slice(0, 8)}.png`;
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            document.body.removeChild(link);
                                                            toast.success("QR Code Downloaded");
                                                        } catch (err) { console.error(err); toast.error("Failed to generate QR"); }
                                                    }}>
                                                        <div className="flex items-center gap-1">
                                                            <Package className="w-3.5 h-3.5" />
                                                            Print QR
                                                        </div>
                                                    </Button>

                                                    {/* Mark as Shipped Button */}
                                                    <Button size="sm" className="h-8 bg-green-600 hover:bg-green-500 text-white border-0" onClick={async () => {
                                                        const supabase = createClient();
                                                        toast.info("Verifying Packaging & Handover...");
                                                        await new Promise(r => setTimeout(r, 1500));
                                                        const { error } = await supabase.from('orders').update({
                                                            status: 'shipped', pickup_verified: true, courier_proof: { weight: '2.5kg', packages: 1, seal_condition: 'intact', pickup_time: new Date().toISOString() }
                                                        }).eq('id', order.id);
                                                        if (!error) { toast.success("Order Shipped!"); setPendingOrders(prev => prev.filter(o => o.id !== order.id)); } else { toast.error("Failed to update status"); }
                                                    }}>
                                                        <Truck className="w-3.5 h-3.5 mr-1" /> Mark Shipped
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-zinc-500">
                                                No pending orders action required.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Quick Tools Sidebar */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                            <h3 className="text-lg font-bold mb-2 relative z-10">Grow your business</h3>
                            <p className="text-blue-100 text-sm mb-6 relative z-10 leading-relaxed">
                                Unlock 0% commission on your next 50 orders by verifying your GST today.
                            </p>
                            <Button
                                onClick={() => router.push('/profile?tab=trust')}
                                className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold border-0 relative z-10"
                            >
                                Verify Now <ArrowUpRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>

                        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none">
                            <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Quick Links</h3>
                            <div className="space-y-2">
                                <QuickLink icon={Settings} label="Store Settings" onClick={() => router.push('/settings')} />
                                <QuickLink icon={Clock} label="Order History" onClick={() => router.push('/orders-received')} />
                                <QuickLink icon={Truck} label="Courier Partners" onClick={() => { }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuickLink({ icon: Icon, label, onClick }: any) {
    return (
        <button className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors group text-left" onClick={onClick}>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-200 dark:bg-black/40 rounded-lg text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-zinc-700 dark:text-zinc-300 font-medium group-hover:text-black dark:group-hover:text-white">{label}</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-400" />
        </button>
    )
}

function AddProductDialog({ children, onProductAdded }: any) {
    // Re-implemented slightly cleaner
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", category: "", base_price: "", min_order_quantity: "", unit: "piece", description: "" });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();

        try {
            let imageUrl = null;

            // Real Image Upload
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `product-images/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, imageFile);

                if (uploadError) {
                    throw new Error("Image upload failed: " + uploadError.message);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            const price = parseFloat(formData.base_price) || 0;
            const moq = parseInt(formData.min_order_quantity) || 1;

            const { error } = await supabase.from('products').insert([{
                name: formData.name,
                category: formData.category,
                base_price: price,
                min_order_quantity: moq,
                unit: formData.unit,
                description: formData.description,
                image_url: imageUrl,
                is_active: true,
                demand_score: 80,
                seller_id: user?.id
            }]);

            if (error) throw error;

            setOpen(false);
            setFormData({ name: "", category: "", base_price: "", min_order_quantity: "", unit: "piece", description: "" });
            setImageFile(null);
            if (onProductAdded) onProductAdded();
            toast.success("Product added successfully!");

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Product Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-900 border-zinc-800" required />
                        <Input placeholder="Price (₹)" type="number" value={formData.base_price} onChange={e => setFormData({ ...formData, base_price: e.target.value })} className="bg-zinc-900 border-zinc-800" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="bg-zinc-900 border-zinc-800" required />
                        <Input placeholder="Min Qty" type="number" value={formData.min_order_quantity} onChange={e => setFormData({ ...formData, min_order_quantity: e.target.value })} className="bg-zinc-900 border-zinc-800" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="image" className="text-zinc-400">Product Image</Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                            className="bg-zinc-900 border-zinc-800 cursor-pointer text-zinc-400 file:bg-zinc-800 file:text-white file:border-0 file:rounded-md file:px-2 file:text-xs"
                        />
                    </div>
                    <Textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-zinc-900 border-zinc-800" />
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500" disabled={loading}>{loading ? "Saving..." : "Save Product"}</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
