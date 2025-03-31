import { ReactNode } from 'react'

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white antialiased min-h-screen flex">
      {children}
    </div>
  )
}