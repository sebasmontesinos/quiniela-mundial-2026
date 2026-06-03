export const LOCALE = import.meta.env.VITE_LOCALE || 'es-BO';

export function formatMatchDate(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : value.toDate ? value.toDate() : new Date(value);
  return d.toLocaleString(LOCALE, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : value.toDate ? value.toDate() : new Date(value);
  return d.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function dateKey(value) {
  if (!value) return 'sin-fecha';
  const d = value instanceof Date ? value : value.toDate ? value.toDate() : new Date(value);
  return d.toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
