"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusIcon, BookOpenIcon, DocumentArrowDownIcon, ClockIcon } from "@heroicons/react/24/outline"
import { DataTable, Column } from "@/components/ui/DataTable"

interface LibraryFile {
  id: string
  name: string
  description?: string
  category: string
  version: string
  fileSize: number
  mimeType: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  author: {
    firstName: string
    lastName: string
  }
  downloadCount: number
}

const categoryColors = {
  'Szablony sprawozdań': 'bg-blue-100 text-blue-800',
  'Instrukcje': 'bg-green-100 text-green-800',
  'Wzory dokumentów': 'bg-purple-100 text-purple-800',
  'Regulaminy': 'bg-orange-100 text-orange-800',
  'Inne': 'bg-gray-100 text-gray-800'
}

const mimeTypeIcons = {
  'application/pdf': '📄',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/msword': '📝',
  'text/plain': '📄',
  'application/zip': '📦'
}

export default function LibraryPage() {
  const [files, setFiles] = useState<LibraryFile[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      // Mock data for now - in real app, fetch from API
      const mockFiles: LibraryFile[] = [
        {
          id: '1',
          name: 'Szablon sprawozdania kwartalnego 2025',
          description: 'Oficjalny szablon do sprawozdań kwartalnych',
          category: 'Szablony sprawozdań',
          version: '1.2',
          fileSize: 245760,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          isPublic: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-15T10:30:00Z',
          author: { firstName: 'Jan', lastName: 'Kowalski' },
          downloadCount: 156
        },
        {
          id: '2',
          name: 'Instrukcja wypełniania sprawozdań',
          description: 'Szczegółowa instrukcja krok po kroku',
          category: 'Instrukcje',
          version: '2.0',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          isPublic: true,
          createdAt: '2025-01-05T00:00:00Z',
          updatedAt: '2025-01-10T14:20:00Z',
          author: { firstName: 'Anna', lastName: 'Nowak' },
          downloadCount: 89
        }
      ]
      setFiles(mockFiles)
    } catch (error) {
      console.error('Failed to fetch library files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key)
    setSortOrder(direction)
  }

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    console.log(`Exporting library files as ${format}`)
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getFileIcon = (mimeType: string) => {
    return mimeTypeIcons[mimeType as keyof typeof mimeTypeIcons] || '📄'
  }

  const columns: Column<LibraryFile>[] = [
    {
      key: 'name',
      label: 'Nazwa pliku',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 text-lg">
            {getFileIcon(row.mimeType)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {value}
            </p>
            {row.description && (
              <p className="text-xs text-gray-500 truncate max-w-xs">
                {row.description}
              </p>
            )}
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">v{row.version}</span>
              {row.isPublic ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Publiczny
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  Prywatny
                </span>
              )}
            </div>
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
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          categoryColors[value as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'fileSize',
      label: 'Rozmiar',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">{formatFileSize(value)}</span>
      )
    },
    {
      key: 'downloadCount',
      label: 'Pobrania',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <DocumentArrowDownIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{value}</span>
        </div>
      )
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
      key: 'updatedAt',
      label: 'Ostatnia aktualizacja',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <ClockIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            {formatDate(value)}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Akcje',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // In real app, this would trigger download
              console.log('Download file:', row.id)
            }}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            Pobierz
          </button>
          <Link
            href={`/communication/library/${row.id}`}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Szczegóły
          </Link>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Biblioteka plików</h1>
          <p className="text-gray-600 mt-2">
            Repozytorium plików i dokumentów UKNF
          </p>
        </div>
        <Link
          href="/communication/library/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Dodaj plik
        </Link>
      </div>

      <DataTable
        data={files}
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
