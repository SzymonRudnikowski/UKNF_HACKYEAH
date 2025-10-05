"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"
import Link from "next/link"

interface Activity {
  id: string
  type: 'report' | 'message' | 'case' | 'announcement'
  title: string
  description: string
  time: Date
  status: 'success' | 'info' | 'warning' | 'error'
  entityId?: string
}

const statusColors = {
  success: 'bg-green-100 text-green-800',
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
}

const typeLabels = {
  report: 'Sprawozdanie',
  message: 'Wiadomość',
  case: 'Sprawa',
  announcement: 'Ogłoszenie',
}

const typeLinks = {
  report: '/communication/reports',
  message: '/communication/messages',
  case: '/communication/cases',
  announcement: '/communication/announcements',
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      setLoading(true)
      
      // Fetch recent data from multiple APIs
      const [reportsRes, messagesRes, casesRes, announcementsRes] = await Promise.all([
        fetch('/api/reports?pageSize=2&sortBy=createdAt&sortOrder=desc'),
        fetch('/api/messages?pageSize=2&sortBy=createdAt&sortOrder=desc'),
        fetch('/api/cases?pageSize=2&sortBy=createdAt&sortOrder=desc'),
        fetch('/api/announcements?pageSize=2&sortBy=createdAt&sortOrder=desc')
      ])

      const [reportsData, messagesData, casesData, announcementsData] = await Promise.all([
        reportsRes.ok ? reportsRes.json() : { data: [] },
        messagesRes.ok ? messagesRes.json() : { data: [] },
        casesRes.ok ? casesRes.json() : { data: [] },
        announcementsRes.ok ? announcementsRes.json() : { data: [] }
      ])

      const allActivities: Activity[] = []

      // Process reports
      reportsData.data?.forEach((report: any) => {
        allActivities.push({
          id: `report-${report.id}`,
          type: 'report',
          title: report.fileName || 'Sprawozdanie',
          description: `Status: ${report.status}`,
          time: new Date(report.createdAt),
          status: report.status === 'SUCCESS' ? 'success' : 
                  report.status === 'VALIDATION_ERRORS' ? 'error' : 'info',
          entityId: report.id
        })
      })

      // Process messages
      messagesData.data?.forEach((message: any) => {
        allActivities.push({
          id: `message-${message.id}`,
          type: 'message',
          title: message.subject,
          description: `Status: ${message.status}`,
          time: new Date(message.createdAt),
          status: message.status === 'CLOSED' ? 'success' : 'info',
          entityId: message.id
        })
      })

      // Process cases
      casesData.data?.forEach((case_: any) => {
        allActivities.push({
          id: `case-${case_.id}`,
          type: 'case',
          title: case_.title,
          description: `Status: ${case_.status}`,
          time: new Date(case_.createdAt),
          status: case_.status === 'DONE' ? 'success' : 
                  case_.status === 'NEED_INFO' ? 'warning' : 'info',
          entityId: case_.id
        })
      })

      // Process announcements
      announcementsData.data?.forEach((announcement: any) => {
        allActivities.push({
          id: `announcement-${announcement.id}`,
          type: 'announcement',
          title: announcement.title,
          description: announcement.isPublished ? 'Opublikowane' : 'Szkic',
          time: new Date(announcement.createdAt),
          status: announcement.isPublished ? 'success' : 'info',
          entityId: announcement.id
        })
      })

      // Sort by time and take most recent 4
      allActivities.sort((a, b) => b.time.getTime() - a.time.getTime())
      setActivities(allActivities.slice(0, 4))

    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
      // Fallback to mock data
      setActivities([
        {
          id: '1',
          type: 'report',
          title: 'Sprawozdanie kwartalne Q1 2025',
          description: 'Złożono nowe sprawozdanie',
          time: new Date('2025-01-15T10:30:00'),
          status: 'success',
        },
        {
          id: '2',
          type: 'message',
          title: 'Odpowiedź na wiadomość',
          description: 'Otrzymano odpowiedź od UKNF',
          time: new Date('2025-01-14T14:20:00'),
          status: 'info',
        },
        {
          id: '3',
          type: 'case',
          title: 'Sprawa: Zmiana danych rejestrowych',
          description: 'Sprawa została zaktualizowana',
          time: new Date('2025-01-13T09:15:00'),
          status: 'warning',
        },
        {
          id: '4',
          type: 'announcement',
          title: 'Nowe wymagania sprawozdawcze',
          description: 'Opublikowano nowe ogłoszenie',
          time: new Date('2025-01-12T16:45:00'),
          status: 'info',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Ostatnia aktywność
          </h3>
          <div className="mt-5 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Ostatnia aktywność
        </h3>
        <div className="mt-5 flow-root">
          <ul className="-mb-8">
            {activities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          statusColors[activity.status as keyof typeof statusColors]
                        }`}
                      >
                        <span className="text-xs font-medium">
                          {typeLabels[activity.type as keyof typeof typeLabels].charAt(0)}
                        </span>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">
                            {activity.title}
                          </span>{' '}
                          {activity.description}
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={activity.time.toISOString()}>
                          {formatDistanceToNow(activity.time, { 
                            addSuffix: true, 
                            locale: pl 
                          })}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          <Link
            href="/communication"
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Zobacz wszystkie
          </Link>
        </div>
      </div>
    </div>
  )
}
