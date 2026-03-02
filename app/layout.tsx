import { ReactNode } from 'react'

type Props = { children: ReactNode }

// Minimal root layout required by Next.js.
// The real layout with <html>/<body> and all providers lives in app/[locale]/layout.tsx.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RootLayout({ children }: Props) {
  return children as any
}
