import { Link } from 'react-router-dom'
import { buttonVariantClasses } from './button.constants.js'

export function ButtonLink({
  to,
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}) {
  const widthClass = fullWidth ? 'w-full' : ''
  const variantClass = buttonVariantClasses[variant] || ''
  const classes = `btn ${variantClass} ${widthClass} ${className}`.trim()

  return (
    <Link to={to} className={classes} {...props}>
      {children}
    </Link>
  )
}
