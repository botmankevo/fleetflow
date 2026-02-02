import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    gradient?: boolean
}

export function GlassCard({ className, gradient = false, children, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "glass-card p-6 border border-glass-border relative overflow-hidden group transition-all duration-300 hover:shadow-xl",
                gradient && "after:absolute after:inset-0 after:bg-gradient-to-br after:from-primary/5 after:to-transparent after:pointer-events-none",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}
