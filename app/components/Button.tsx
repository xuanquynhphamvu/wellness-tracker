import React from "react";
import { Link } from "react-router";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    to?: string;
    asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", size = "md", to, children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage-300 disabled:opacity-50 disabled:cursor-not-allowed clickable";

        // Rounded corners - Soft aesthetic
        const roundedStyles = "rounded-2xl";

        const variants = {
            primary: "bg-sage-600 text-white hover:bg-sage-700 shadow-sm hover:shadow-md",
            secondary: "bg-sage-100 text-sage-800 hover:bg-sage-200",
            outline: "border-2 border-sage-200 text-sage-700 hover:bg-sage-50",
            ghost: "text-warm-gray-600 hover:bg-warm-gray-100 hover:text-warm-gray-900",
        };

        const sizes = {
            sm: "text-sm px-3 py-1.5",
            md: "text-base px-5 py-2.5",
            lg: "text-lg px-8 py-3.5",
        };

        const combinedClassName = `${baseStyles} ${roundedStyles} ${variants[variant]} ${sizes[size]} ${className}`;

        if (to) {
            return (
                <Link to={to} className={combinedClassName}>
                    {children}
                </Link>
            );
        }

        return (
            <button ref={ref} className={combinedClassName} {...props}>
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
