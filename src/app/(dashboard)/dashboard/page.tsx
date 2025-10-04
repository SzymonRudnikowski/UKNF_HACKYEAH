import { auth } from "@/lib/auth"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { QuickActions } from "@/components/dashboard/QuickActions"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Witaj, {session?.user?.firstName || ''} {session?.user?.lastName || ''}
        </h1>
        <p className="text-gray-600">
          Oto przegląd Twojej aktywności w systemie
        </p>
      </div>

      <DashboardStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  )
}
