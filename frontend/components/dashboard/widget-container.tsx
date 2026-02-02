import * as React from "react"
import { cn } from "@/lib/utils"

interface WidgetContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
    description?: string
    action?: React.ReactNode
}

export function WidgetContainer({
    title,
    description,
    action,
    children,
    className,
    ...props
}: WidgetContainerProps) {
    return (
        <div className={cn("space-y-4", className)} {...props}>
            {(title || action) && (
                <div className="flex items-center justify-between px-1">
                    <div>
                        {title && <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>}
                        {description && <p className="text-sm text-slate-500">{description}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    )
}
