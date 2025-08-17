"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  Moon,
  Save,
  RotateCcw
} from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import { toast } from 'sonner'

const notificationTypes = [
  { key: 'likes', label: 'Likes', description: 'When someone likes your posts' },
  { key: 'comments', label: 'Comments', description: 'When someone comments on your posts' },
  { key: 'follows', label: 'Follows', description: 'When someone follows you' },
  { key: 'messages', label: 'Messages', description: 'When you receive direct messages' },
  { key: 'mentions', label: 'Mentions', description: 'When someone mentions you' },
  { key: 'posts', label: 'Posts', description: 'When people you follow create new posts' },
  { key: 'friendRequests', label: 'Friend Requests', description: 'When someone sends you a friend request' },
  { key: 'system', label: 'System', description: 'Important system notifications' },
]

interface NotificationTypeSettingsProps {
  title: string
  icon: React.ReactNode
  settings: Record<string, boolean>
  onSettingChange: (type: string, enabled: boolean) => void
}

function NotificationTypeSettings({ title, icon, settings, onSettingChange }: NotificationTypeSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notificationTypes.map((type) => (
          <div key={type.key} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{type.label}</Label>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </div>
            <Switch
              checked={settings[type.key] || false}
              onCheckedChange={(checked) => onSettingChange(type.key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function NotificationSettings() {
  const { settings, updateSettings, isLoading } = useNotifications()
  const [localSettings, setLocalSettings] = useState(settings)
  const [hasChanges, setHasChanges] = useState(false)

  if (!settings || !localSettings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const handleEmailSettingChange = (type: string, enabled: boolean) => {
    const newSettings = {
      ...localSettings,
      emailNotifications: {
        ...localSettings.emailNotifications,
        [type]: enabled
      }
    }
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  const handlePushSettingChange = (type: string, enabled: boolean) => {
    const newSettings = {
      ...localSettings,
      pushNotifications: {
        ...localSettings.pushNotifications,
        [type]: enabled
      }
    }
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  const handleInAppSettingChange = (type: string, enabled: boolean) => {
    const newSettings = {
      ...localSettings,
      inAppNotifications: {
        ...localSettings.inAppNotifications,
        [type]: enabled
      }
    }
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  const handleSoundToggle = (enabled: boolean) => {
    const newSettings = {
      ...localSettings,
      soundEnabled: enabled
    }
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  const handleVibrationToggle = (enabled: boolean) => {
    const newSettings = {
      ...localSettings,
      vibrationEnabled: enabled
    }
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  const handleQuietHoursToggle = (enabled: boolean) => {
    const newSettings = {
      ...localSettings,
      quietHours: {
        ...localSettings.quietHours,
        enabled
      }
    }
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  const handleQuietHoursTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newSettings = {
      ...localSettings,
      quietHours: {
        ...localSettings.quietHours,
        [field]: value
      }
    }
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await updateSettings(localSettings)
      setHasChanges(false)
      toast.success('Notification settings saved successfully')
    } catch (error) {
      toast.error('Failed to save notification settings')
    }
  }

  const handleReset = () => {
    setLocalSettings(settings)
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage how you receive notifications from Royal Media
          </p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Unsaved changes</Badge>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        <NotificationTypeSettings
          title="Email Notifications"
          icon={<Mail className="w-4 h-4" />}
          settings={localSettings.emailNotifications}
          onSettingChange={handleEmailSettingChange}
        />

        <NotificationTypeSettings
          title="Push Notifications"
          icon={<Smartphone className="w-4 h-4" />}
          settings={localSettings.pushNotifications}
          onSettingChange={handlePushSettingChange}
        />

        <NotificationTypeSettings
          title="In-App Notifications"
          icon={<Bell className="w-4 h-4" />}
          settings={localSettings.inAppNotifications}
          onSettingChange={handleInAppSettingChange}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {localSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              Sound & Vibration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Sound Notifications</Label>
                <p className="text-xs text-muted-foreground">Play sound when receiving notifications</p>
              </div>
              <Switch
                checked={localSettings.soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Vibration</Label>
                <p className="text-xs text-muted-foreground">Vibrate device when receiving notifications</p>
              </div>
              <Switch
                checked={localSettings.vibrationEnabled}
                onCheckedChange={handleVibrationToggle}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Moon className="w-4 h-4" />
              Quiet Hours
            </CardTitle>
            <CardDescription>
              Set specific hours when you don't want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Enable Quiet Hours</Label>
                <p className="text-xs text-muted-foreground">Mute notifications during specified hours</p>
              </div>
              <Switch
                checked={localSettings.quietHours.enabled}
                onCheckedChange={handleQuietHoursToggle}
              />
            </div>
            
            {localSettings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Start Time</Label>
                  <Input
                    type="time"
                    value={localSettings.quietHours.startTime}
                    onChange={(e) => handleQuietHoursTimeChange('startTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">End Time</Label>
                  <Input
                    type="time"
                    value={localSettings.quietHours.endTime}
                    onChange={(e) => handleQuietHoursTimeChange('endTime', e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
