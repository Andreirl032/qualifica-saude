const badgeVariants = {
  default: '',
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  success: 'badge-success',
  warning: 'badge-warning',
  info: 'badge-info',
  error: 'badge-error',
  outline: 'badge-outline',
}

export function Badge({ variant = 'default', size = 'md', className = '', children }) {
  const sizeClass = size === 'sm' ? 'badge-sm' : size === 'lg' ? 'badge-lg' : ''
  const variantClass = badgeVariants[variant] || ''
  const classes = `badge ${variantClass} ${sizeClass} ${className}`.trim()

  return <span className={classes}>{children}</span>
}
