import { buttonVariantClasses } from "./button.constants.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function Button({
  variant = "primary",
  type = "button",
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  icon,
  iconStyle = "",
  children,
  ...props
}) {
  const widthClass = fullWidth ? "w-full" : "";
  const loadingClass = isLoading ? "loading" : "";
  const variantClass = buttonVariantClasses[variant] || "";
  const classes =
    `btn ${variantClass} ${widthClass} ${loadingClass} ${className}`.trim();

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
      {icon ? (
        <FontAwesomeIcon icon={icon} className={`${iconStyle}`} />
      ) : (
        <></>
      )}
    </button>
  );
}
