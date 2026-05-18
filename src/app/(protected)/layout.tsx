import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        userRole={session.user.role}
        userName={session.user.name ?? session.user.email ?? undefined}
      />
      <main className="flex-1 overflow-y-auto lg:p-6 p-4 pt-4">
        {children}
      </main>
    </div>
  )
}
