export function formatEstimatedTime(dateString, t) {
  if (!dateString) return t('common.unknown', 'Unknown')

  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return t('common.unknown', 'Unknown')

    const now = new Date()
    const diff = date - now
    const minutes = Math.floor(diff / 60000)

    if (minutes < 0) return t('order.delivered', 'Delivered')
    if (minutes < 60) return `${minutes} ${t('order.minutes', 'minutes')}`

    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}${t('order.min', 'min')}`
  } catch (error) {
    console.error('Error formatting estimated time:', error)
    return t('common.unknown', 'Unknown')
  }
}
