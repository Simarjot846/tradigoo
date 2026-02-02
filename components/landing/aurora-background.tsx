import React from 'react';

export function AuroraBackground() {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none transform-gpu">
            <div
                className="absolute -inset-[10px] opacity-30 blur-[60px] invert dark:invert-0 will-change-transform"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(100deg, #3b82f6 0%, #a855f7 7%, #6366f1 10%, transparent 20%, #3b82f6 40%, #a855f7 47%, #6366f1 50%, transparent 60%)',
                    backgroundSize: '200% 100%',
                }}
            >
                <div className="absolute inset-0 mix-blend-overlay animate-aurora opacity-50" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
    );
}
