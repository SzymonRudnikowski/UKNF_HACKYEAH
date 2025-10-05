"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusIcon, FolderIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { DataTable, Column } from "@/components/ui/DataTable"

interface Case {
  id: string
  title: string
  category: string
  priority: string
  status: string
  subjectId?: number
  subjectEntity?: {
    name: string
    type: string
  }
  createdAt: string
  updatedAt: string
  assignedTo?: {
    firstName: string
    lastName: string
  }
  description?: string
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  NEW: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  NEED_INFO: 'bg-orange-100 text-orange-800',
  DONE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const statusLabels = {
  DRAFT: 'Szkic',
  NEW: 'Nowa',
  IN_PROGRESS: 'W trakcie',
  NEED_INFO: 'Wymaga informacji',
  DONE: 'Zakończona',
  CANCELLED: 'Anulowana'
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

const categoryLabels = {
  'Zmiana danych rejestrowych': 'Zmiana danych rejestrowych',
  'Zmiana składu osobowego': 'Zmiana składu osobowego',
  'Wezwanie': 'Wezwanie',
  'Uprawnienia': 'Uprawnienia',
  'Sprawozdawczość': 'Sprawozdawczość',
  'Inne': 'Inne'
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cases')
      if (response.ok) {
        const data = await response.json()
        setCases(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key)
    setSortOrder(direction)
  }

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    console.log(`Exporting cases as ${format}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW':
        return <FolderIcon className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <ClockIcon className="h-4 w-4" />
      case 'DONE':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'NEED_INFO':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return <FolderIcon className="h-4 w-4" />
    }
  }

  const columns: Column<Case>[] = [
    {
      key: 'title',
      label: 'Tytuł sprawy',
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
      key: 'category',
      label: 'Kategoria',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">
          {categoryLabels[value as keyof typeof categoryLabels] || value}
        </span>
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
      key: 'assignedTo',
      label: 'Przypisane do',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-500">-</span>
        return (
          <span className="text-sm text-gray-900">
            {value.firstName} {value.lastName}
          </span>
        )
      }
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
            href={`/communication/cases/${row.id}`}
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
          <h1 className="text-3xl font-bold text-gray-900">Sprawy</h1>
          <p className="text-gray-600 mt-2">
            Zarządzaj sprawami i teczkami
          </p>
        </div>
        <Link
          href="/communication/cases/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nowa sprawa
        </Link>
      </div>

      <DataTable
        data={cases}
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
