import { NotificationSettings } from '@repo/ui/components'
import { MainLayout } from '@/components/MainLayout'

export default function NotificationsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Manage your notification preferences</p>
        </div>
        <NotificationSettings />
      </div>
    </MainLayout>
  )
}