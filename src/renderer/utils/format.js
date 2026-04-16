import { format, formatDistanceToNow, parseISO, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns'

export function formatDate(dateStr, fmt = 'MMM d, yyyy') {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), fmt) } catch { return dateStr }
}

export function formatDateShort(dateStr) {
  return formatDate(dateStr, 'MM/dd/yyyy')
}

export function timeAgo(dateStr) {
  if (!dateStr) return '—'
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) } catch { return dateStr }
}

export function ageString(dobStr) {
  if (!dobStr) return 'Unknown age'
  try {
    const dob = parseISO(dobStr)
    const years  = differenceInYears(new Date(), dob)
    const months = differenceInMonths(new Date(), dob) % 12
    if (years > 0) return `${years}y ${months}m`
    const days = differenceInDays(new Date(), dob)
    if (months > 0) return `${months} month${months !== 1 ? 's' : ''}`
    return `${days} day${days !== 1 ? 's' : ''}`
  } catch { return '—' }
}

export function formatWeight(grams) {
  if (grams == null) return '—'
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`
  return `${Math.round(grams)} g`
}

export function sexLabel(sex) {
  return { male: 'Male', female: 'Female', unknown: 'Unknown' }[sex] || sex
}

export function sexEmoji(sex) {
  return { male: '♂', female: '♀', unknown: '?' }[sex] || '?'
}

export function inheritanceLabel(type) {
  return {
    recessive:    'Recessive',
    co_dominant:  'Co-dominant',
    dominant:     'Dominant',
    line_bred:    'Line-bred',
    polygenetic:  'Polygenetic',
  }[type] || type
}

export function expressionLabel(expression, superFormName) {
  const map = {
    visual:       'Visual',
    het:          'Het',
    possible_het: 'Poss Het',
    proven_het:   'Proven Het',
    super:        superFormName || 'Super',
    single:       'Single',
  }
  return map[expression] || expression
}

export function statusColor(status) {
  return {
    active:   'var(--accent-text)',
    sold:     'var(--text-muted)',
    deceased: 'var(--red-text)',
    on_loan:  'var(--amber-text)',
  }[status] || 'var(--text-secondary)'
}

export function pct(p) {
  const v = p * 100
  if (v === Math.round(v)) return `${v}%`
  return `${v.toFixed(1)}%`
}

export function breedingStatusColor(status) {
  return {
    planned:   'var(--text-muted)',
    active:    'var(--blue-text)',
    gravid:    'var(--purple-text)',
    laid:      'var(--amber-text)',
    hatched:   'var(--accent-text)',
    failed:    'var(--red-text)',
    cancelled: 'var(--text-muted)',
  }[status] || 'var(--text-secondary)'
}

export function pluralise(count, word) {
  return `${count} ${word}${count !== 1 ? 's' : ''}`
}
