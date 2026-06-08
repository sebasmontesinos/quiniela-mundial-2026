export function formatMatchDate(date, options = {}) {
  const d = date?.toDate ? date.toDate() : new Date(date)
  if (isNaN(d)) return ''

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    ...options
  }).format(d)
}

export function formatMatchTime(date) {
  const d = date?.toDate ? date.toDate() : new Date(date)
  if (isNaN(d)) return ''

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(d)
}

export function formatDateHeader(date) {
  const d = date?.toDate ? date.toDate() : new Date(date)
  if (isNaN(d)) return ''

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d)
}

export function isSameLocalDay(date1, date2) {
  const d1 = date1?.toDate ? date1.toDate() : new Date(date1)
  const d2 = date2?.toDate ? date2.toDate() : new Date(date2)
  const fmt = new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'numeric', day: 'numeric'
  })
  return fmt.format(d1) === fmt.format(d2)
}
