import NumberFlow, { type Format } from '@number-flow/react'

interface DynamicNumberProps {
  value: number
  format?: Format
  prefix?: string
  suffix?: string
  className?: string
  ariaLabel?: string
}

/**
 * Reusable animated numeric display component using NumberFlow.
 * Enforces tabular-nums and smooth transition without layout shift.
 */
export function DynamicNumber({
  value,
  format,
  prefix,
  suffix,
  className = '',
  ariaLabel,
}: DynamicNumberProps) {
  return (
    <span
      className={`inline-flex items-center tabular-nums ${className}`}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      aria-label={ariaLabel}
    >
      {prefix && <span>{prefix}</span>}
      <NumberFlow
        value={value}
        format={format}
        transformTiming={{ duration: 250, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
      />
      {suffix && <span>{suffix}</span>}
    </span>
  )
}
