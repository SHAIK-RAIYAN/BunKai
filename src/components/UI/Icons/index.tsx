import { motion, useAnimation } from 'motion/react'

interface AnimatedIconProps {
  size?: number
  className?: string
  color?: string
}

export function AnimatedSettingsIcon({ size = 20, className = '' }: AnimatedIconProps) {
  const controls = useAnimation()

  return (
    <div
      className={`inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => controls.start({ rotate: 60, transition: { duration: 0.3, ease: 'easeOut' } })}
      onMouseLeave={() => controls.start({ rotate: 0, transition: { duration: 0.3, ease: 'easeOut' } })}
    >
      <motion.svg
        animate={controls}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </motion.svg>
    </div>
  )
}

export function AnimatedSidebarIcon({ size = 20, className = '', isOpen = false }: AnimatedIconProps & { isOpen?: boolean }) {
  return (
    <div className={`inline-flex items-center justify-center cursor-pointer ${className}`}>
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <motion.path
          animate={{ x: isOpen ? 2 : 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          d="M9 3v18"
        />
        <motion.path
          animate={{ opacity: isOpen ? 1 : 0.6, x: isOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          d="m14 9 3 3-3 3"
        />
      </motion.svg>
    </div>
  )
}

export function AnimatedUploadIcon({ size = 20, className = '' }: AnimatedIconProps) {
  const controls = useAnimation()

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => controls.start({ y: -3, transition: { duration: 0.2, repeat: 1, repeatType: 'reverse' } })}
      onMouseLeave={() => controls.start({ y: 0, transition: { duration: 0.2 } })}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <motion.g animate={controls}>
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </motion.g>
      </svg>
    </div>
  )
}

export function AnimatedCloseIcon({ size = 18, className = '' }: AnimatedIconProps) {
  const controls = useAnimation()

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => controls.start({ rotate: 90, scale: 0.95, transition: { duration: 0.2, ease: 'easeOut' } })}
      onMouseLeave={() => controls.start({ rotate: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } })}
    >
      <motion.svg
        animate={controls}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </motion.svg>
    </div>
  )
}

export function AnimatedSearchIcon({ size = 18, className = '' }: AnimatedIconProps) {
  const controls = useAnimation()

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => controls.start({ x: 1, y: 1, transition: { duration: 0.2, repeat: 1, repeatType: 'reverse' } })}
      onMouseLeave={() => controls.start({ x: 0, y: 0, transition: { duration: 0.2 } })}
    >
      <motion.svg
        animate={controls}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </motion.svg>
    </div>
  )
}

export function AnimatedBookIcon({ size = 20, className = '' }: AnimatedIconProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
      </svg>
    </div>
  )
}
