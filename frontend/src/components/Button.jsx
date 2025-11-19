import { buttonVariantClasses } from './button.constants.js'

export function Button({
  variant = 'primary',
  type = 'button',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}) {
  const widthClass = fullWidth ? 'w-full' : ''
  const loadingClass = isLoading ? 'loading' : ''
  const variantClass = buttonVariantClasses[variant] || ''
  const classes = `btn ${variantClass} ${widthClass} ${loadingClass} ${className}`.trim()

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
    </button>
  )
}
