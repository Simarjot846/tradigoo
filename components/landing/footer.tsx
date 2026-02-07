"use client";

import React from 'react';

export function Footer() {
    return (
        <footer className="border-t border-black/5 dark:border-white/10 py-20 bg-gray-50 dark:bg-black">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">T</div>
                            <span className="text-xl font-bold text-foreground dark:text-white">Tradigoo</span>
                        </div>
                        <p className="text-muted-foreground dark:text-white/40 text-sm leading-relaxed">
                            The modern operating system for B2B sourcing. built for brands that move fast.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground dark:text-white mb-6">Platform</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground dark:text-white/50">
                            <li className="hover:text-primary dark:hover:text-white transition-colors cursor-pointer">Supplier Discovery</li>
                            <li className="hover:text-primary dark:hover:text-white transition-colors cursor-pointer">Escrow Payments</li>
                            <li className="hover:text-primary dark:hover:text-white transition-colors cursor-pointer">Logistics</li>
                            <li className="hover:text-primary dark:hover:text-white transition-colors cursor-pointer">Pricing</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground dark:text-white mb-6">Company</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground dark:text-white/50">
                            <li className="hover:text-primary dark:hover:text-white transition-colors cursor-pointer">About</li>
                            <li className="hover:text-primary dark:hover:text-white transition-colors cursor-pointer">Blog</li>
                            <li className="hover:text-primary dark:hover:text-white transition-colors cursor-pointer">Careers</li>
                            <li className="hover:text-primary dark:hover:text-white transition-colors cursor-pointer">Contact</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground dark:text-white mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground dark:text-white/50">
                            <li className="hover:text-primary dark:hover:text-white transition-colors cursor-pointer">Privacy Policy</li>
                            <li className="hover:text-primary dark:hover:text-white transition-colors cursor-pointer">Terms of Service</li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-black/5 dark:border-white/5">
                    <p className="text-sm text-muted-foreground dark:text-white/30">© 2026 Tradigoo Inc. All rights reserved.</p>
                    <div className="flex items-center gap-6 text-muted-foreground dark:text-white/40">
                        {/* Social Icons Placeholder */}
                        <div className="w-5 h-5 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 cursor-pointer" />
                        <div className="w-5 h-5 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 cursor-pointer" />
                        <div className="w-5 h-5 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 cursor-pointer" />
                    </div>
                </div>
            </div>
        </footer>
    );
}
