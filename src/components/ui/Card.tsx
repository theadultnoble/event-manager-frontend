import { HTMLAttributes } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
}

export function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-lg",
        {
          "bg-white shadow": variant === "default",
          "bg-white shadow-lg": variant === "elevated",
          "bg-white border border-gray-200": variant === "outlined",
        },
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("px-6 py-4 border-b border-gray-200", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("px-6 py-4", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "px-6 py-4 border-t border-gray-200 bg-gray-50",
        className
      )}
      {...props}
    />
  );
}
