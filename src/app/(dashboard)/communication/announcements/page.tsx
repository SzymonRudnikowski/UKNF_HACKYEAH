"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusIcon, MegaphoneIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { DataTable, Column } from "@/components/ui/DataTable"

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  isPublished: boolean
  requiresAcknowledgment: boolean
  createdAt: string
  updatedAt: string
  author: {
    firstName: string
    lastName: string
  }
  readReceipts?: {
    total: number
    acknowledged: number
  }
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800'
}

const priorityLabels = {
  LOW: 'Niski',
  MEDIUM: 'Średni',
  HIGH: 'Wysoki'
}

const statusColors = {
  published: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  published: 'Opublikowane',
  draft: 'Szkic'
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/announcements')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key)
    setSortOrder(direction)
  }

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    console.log(`Exporting announcements as ${format}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'MEDIUM':
        return <ClockIcon className="h-4 w-4" />
      case 'LOW':
        return <MegaphoneIcon className="h-4 w-4" />
      default:
        return <MegaphoneIcon className="h-4 w-4" />
    }
  }

  const columns: Column<Announcement>[] = [
    {
      key: 'title',
      label: 'Tytuł ogłoszenia',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getPriorityIcon(row.priority)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
              {value}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-xs">
              {row.content.substring(0, 100)}...
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Priorytet',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          priorityColors[value as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'
        }`}>
          {priorityLabels[value as keyof typeof priorityLabels] || value}
        </span>
      )
    },
    {
      key: 'isPublished',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? statusColors.published : statusColors.draft
        }`}>
          {value ? statusLabels.published : statusLabels.draft}
        </span>
      )
    },
    {
      key: 'requiresAcknowledgment',
      label: 'Wymaga potwierdzenia',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">
          {value ? 'Tak' : 'Nie'}
        </span>
      )
    },
    {
      key: 'readReceipts',
      label: 'Potwierdzenia',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-500">-</span>
        return (
          <div className="text-sm">
            <span className="text-gray-900">
              {value.acknowledged}/{value.total}
            </span>
            {value.total > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div
                  className="bg-blue-600 h-1 rounded-full"
                  style={{ width: `${(value.acknowledged / value.total) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'author',
      label: 'Autor',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">
          {value.firstName} {value.lastName}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Data utworzenia',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">
          {formatDate(value)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Akcje',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/communication/announcements/${row.id}`}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            Otwórz
          </Link>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ogłoszenia</h1>
          <p className="text-gray-600 mt-2">
            Zarządzaj ogłoszeniami UKNF
          </p>
        </div>
        <Link
          href="/communication/announcements/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nowe ogłoszenie
        </Link>
      </div>

      <DataTable
        data={announcements}
        columns={columns}
        loading={loading}
        onSort={handleSort}
        onExport={handleExport}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
