"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusIcon, EyeIcon, DocumentArrowUpIcon } from "@heroicons/react/24/outline"
import { DataTable, Column } from "@/components/ui/DataTable"

interface Report {
  id: string
  subject: string
  period: string
  status: string
  createdAt: string
  updatedAt: string
  validationResult?: string
  fileSize?: number
  fileName?: string
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  SUCCESS: 'bg-green-100 text-green-800',
  VALIDATION_ERRORS: 'bg-red-100 text-red-800',
  TECH_ERROR: 'bg-red-100 text-red-800',
  TIMEOUT: 'bg-orange-100 text-orange-800',
  DISPUTED_BY_UKNF: 'bg-purple-100 text-purple-800'
}

const statusLabels = {
  DRAFT: 'Szkic',
  SUBMITTED: 'Złożone',
  PROCESSING: 'Przetwarzanie',
  SUCCESS: 'Zaakceptowane',
  VALIDATION_ERRORS: 'Błędy walidacji',
  TECH_ERROR: 'Błąd techniczny',
  TIMEOUT: 'Przekroczono czas',
  DISPUTED_BY_UKNF: 'Zakwestionowane'
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key)
    setSortOrder(direction)
    // In a real app, you would refetch data with new sort parameters
  }

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    console.log(`Exporting reports as ${format}`)
    // Implement export functionality
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const columns: Column<Report>[] = [
    {
      key: 'fileName',
      label: 'Nazwa pliku',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-900">
            {value || 'Brak nazwy'}
          </span>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Podmiot',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="text-gray-900">{value || 'Nie przypisano'}</span>
      )
    },
    {
      key: 'period',
      label: 'Okres',
      sortable: true,
      render: (value) => (
        <span className="text-gray-900">{value || '-'}</span>
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
      key: 'fileSize',
      label: 'Rozmiar',
      sortable: true,
      render: (value) => (
        <span className="text-gray-500">{formatFileSize(value)}</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Data utworzenia',
      sortable: true,
      render: (value) => (
        <span className="text-gray-500">
          {new Date(value).toLocaleDateString('pl-PL')}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Akcje',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/communication/reports/${row.id}`}
            className="text-blue-600 hover:text-blue-900"
          >
            <EyeIcon className="h-4 w-4" />
          </Link>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sprawozdania</h1>
          <p className="text-gray-600 mt-2">
            Zarządzaj sprawozdaniami i ich walidacją
          </p>
        </div>
        <Link
          href="/communication/reports/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nowe sprawozdanie
        </Link>
      </div>

      <DataTable
        data={reports}
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
