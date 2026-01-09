import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "hover";
}

export function Card({ className = "", variant = "default", children, ...props }: CardProps) {
    const baseStyles = "bg-white dark:bg-warm-gray-800 rounded-3xl p-6 border border-warm-gray-100 dark:border-warm-gray-700";

    const variants = {
        default: "shadow-sm",
        hover: "shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer hover:-translate-y-0.5 transform transition-transform",
    };

    return (
        <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </div>
    );
}
