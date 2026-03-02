'use client'

import { useState, useEffect, type ReactNode } from 'react'

interface Props {
  user: string
  domain: string
  className?: string
  /** Optional node rendered before the email address (e.g. an icon) */
  prefix?: ReactNode
}

/**
 * Renders an email address as a mailto link, but only after the JS runtime
 * has hydrated the page.  During server-rendering and for most bots the
 * element is empty, which prevents address harvesting.
 */
export default function ObfuscatedEmail({ user, domain, className, prefix }: Props) {
  const [email, setEmail] = useState('')

  useEffect(() => {
    setEmail(`${user}@${domain}`)
  }, [user, domain])

  if (!email) {
    // Render a visually identical shell so layout doesn't shift
    return <span className={className}>{prefix}</span>
  }

  return (
    <a href={`mailto:${email}`} className={className}>
      {prefix}{email}
    </a>
  )
}
