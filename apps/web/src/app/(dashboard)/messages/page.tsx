import { MessagesInterface } from '@repo/ui/components'
import { MainLayout } from '@/components/MainLayout'

export default function MessagesPage() {
  return (
    <MainLayout>
      <div className="h-full">
        <MessagesInterface />
      </div>
    </MainLayout>
  )
}