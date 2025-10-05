"use client"

import { useState, useEffect } from "react"
import { 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon, 
  FolderIcon, 
  MegaphoneIcon 
} from "@heroicons/react/24/outline"

interface DashboardStats {
  reports: {
    total: number
    change: number
  }
  messages: {
    total: number
    change: number
  }
  cases: {
    total: number
    change: number
  }
  announcements: {
    total: number
    change: number
  }
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    reports: { total: 0, change: 0 },
    messages: { total: 0, change: 0 },
    cases: { total: 0, change: 0 },
    announcements: { total: 0, change: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch data from multiple APIs in parallel
      const [reportsRes, messagesRes, casesRes, announcementsRes] = await Promise.all([
        fetch('/api/reports?pageSize=1'),
        fetch('/api/messages?pageSize=1'),
        fetch('/api/cases?pageSize=1'),
        fetch('/api/announcements?pageSize=1')
      ])

      const [reportsData, messagesData, casesData, announcementsData] = await Promise.all([
        reportsRes.ok ? reportsRes.json() : { pagination: { total: 0 } },
        messagesRes.ok ? messagesRes.json() : { pagination: { total: 0 } },
        casesRes.ok ? casesRes.json() : { pagination: { total: 0 } },
        announcementsRes.ok ? announcementsRes.json() : { pagination: { total: 0 } }
      ])

      setStats({
        reports: { 
          total: reportsData.pagination?.total || 0, 
          change: Math.floor(Math.random() * 10) - 5 // Mock change for demo
        },
        messages: { 
          total: messagesData.pagination?.total || 0, 
          change: Math.floor(Math.random() * 10) - 5 
        },
        cases: { 
          total: casesData.pagination?.total || 0, 
          change: Math.floor(Math.random() * 10) - 5 
        },
        announcements: { 
          total: announcementsData.pagination?.total || 0, 
          change: Math.floor(Math.random() * 10) - 5 
        }
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsData = [
    {
      name: 'Sprawozdania',
      value: stats.reports.total.toString(),
      change: stats.reports.change > 0 ? `+${stats.reports.change}` : stats.reports.change.toString(),
      changeType: stats.reports.change > 0 ? 'positive' : stats.reports.change < 0 ? 'negative' : 'neutral',
      icon: DocumentTextIcon,
    },
    {
      name: 'Wiadomości',
      value: stats.messages.total.toString(),
      change: stats.messages.change > 0 ? `+${stats.messages.change}` : stats.messages.change.toString(),
      changeType: stats.messages.change > 0 ? 'positive' : stats.messages.change < 0 ? 'negative' : 'neutral',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: 'Sprawy',
      value: stats.cases.total.toString(),
      change: stats.cases.change > 0 ? `+${stats.cases.change}` : stats.cases.change.toString(),
      changeType: stats.cases.change > 0 ? 'positive' : stats.cases.change < 0 ? 'negative' : 'neutral',
      icon: FolderIcon,
    },
    {
      name: 'Ogłoszenia',
      value: stats.announcements.total.toString(),
      change: stats.announcements.change > 0 ? `+${stats.announcements.change}` : stats.announcements.change.toString(),
      changeType: stats.announcements.change > 0 ? 'positive' : stats.announcements.change < 0 ? 'negative' : 'neutral',
      icon: MegaphoneIcon,
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
          >
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((item) => (
        <div
          key={item.name}
          className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
        >
          <dt>
            <div className="absolute rounded-md bg-blue-500 p-3">
              <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">
              {item.name}
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
            <p
              className={`ml-2 flex items-baseline text-sm font-semibold ${
                item.changeType === 'positive'
                  ? 'text-green-600'
                  : item.changeType === 'negative'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {item.change}
            </p>
          </dd>
        </div>
      ))}
    </div>
  )
}
