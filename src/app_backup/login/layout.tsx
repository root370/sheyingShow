import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Darkroom',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
