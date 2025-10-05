"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusIcon, ChatBubbleLeftRightIcon, ClockIcon, CheckCircleIcon } from "@heroicons/react/24/outline"
import { DataTable, Column } from "@/components/ui/DataTable"

interface MessageThread {
  id: string
  subject: string
  subjectEntity?: {
    name: string
    type: string
  }
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  lastMessage?: {
    content: string
    createdAt: string
    user: {
      firstName: string
      lastName: string
      isInternal: boolean
    }
  }
  messageCount: number
}

const statusColors = {
  WAITING_FOR_UKNF: 'bg-yellow-100 text-yellow-800',
  WAITING_FOR_USER: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  WAITING_FOR_UKNF: 'Oczekuje na UKNF',
  WAITING_FOR_USER: 'Oczekuje na użytkownika',
  CLOSED: 'Zamknięty'
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

export default function MessagesPage() {
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchThreads()
  }, [])

  const fetchThreads = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setThreads(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch message threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key)
    setSortOrder(direction)
  }

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    console.log(`Exporting message threads as ${format}`)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WAITING_FOR_UKNF':
        return <ClockIcon className="h-4 w-4" />
      case 'WAITING_FOR_USER':
        return <ChatBubbleLeftRightIcon className="h-4 w-4" />
      case 'CLOSED':
        return <CheckCircleIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  const columns: Column<MessageThread>[] = [
    {
      key: 'subject',
      label: 'Temat',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getStatusIcon(row.status)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
              {value}
            </p>
            {row.subjectEntity && (
              <p className="text-xs text-gray-500">
                {row.subjectEntity.name}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
        }`}>
          {statusLabels[value as keyof typeof statusLabels] || value}
        </span>
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
      key: 'messageCount',
      label: 'Wiadomości',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">{value}</span>
      )
    },
    {
      key: 'lastMessage',
      label: 'Ostatnia wiadomość',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-500">-</span>
        return (
          <div className="text-sm">
            <p className="text-gray-900 truncate max-w-xs">
              {value.content}
            </p>
            <p className="text-xs text-gray-500">
              {value.user.firstName} {value.user.lastName} • {formatDate(value.createdAt)}
            </p>
          </div>
        )
      }
    },
    {
      key: 'updatedAt',
      label: 'Ostatnia aktywność',
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
            href={`/communication/messages/${row.id}`}
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
          <h1 className="text-3xl font-bold text-gray-900">Wiadomości</h1>
          <p className="text-gray-600 mt-2">
            Komunikacja z UKNF i podmiotami nadzorowanymi
          </p>
        </div>
        <Link
          href="/communication/messages/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nowa wiadomość
        </Link>
      </div>

      <DataTable
        data={threads}
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
