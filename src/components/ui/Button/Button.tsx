// Shared button: renders a <button> or a router <Link> with button styling.
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost";

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined };

type ButtonAsLink = CommonProps & { to: string; className?: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const variant = props.variant ?? "primary";

  if (props.to !== undefined) {
    const { to, children, className } = props;
    return (
      <Link
        to={to}
        className={`${styles.button} ${styles[variant]} ${className ?? ""}`}
      >
        {children}
      </Link>
    );
  }

  const { children, className, variant: _variant, ...rest } = props;
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}
