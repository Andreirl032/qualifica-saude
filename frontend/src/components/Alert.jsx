export function Alert({ variant = 'info', className = '', children }) {
  const baseClass = 'alert'
  const variantClass = {
    info: '',
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
  }[variant] || ''

  const classes = `${baseClass} ${variantClass} ${className}`.trim()

  return <div className={classes}>{children}</div>
}
