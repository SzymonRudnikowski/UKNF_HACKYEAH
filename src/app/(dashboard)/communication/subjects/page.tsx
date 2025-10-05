"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusIcon, UsersIcon, BuildingOfficeIcon, MapPinIcon } from "@heroicons/react/24/outline"
import { DataTable, Column } from "@/components/ui/DataTable"

interface Subject {
  id: number
  name: string
  type: string
  lei?: string
  nip?: string
  krs?: string
  city?: string
  status?: string
  isCrossBorder: boolean
  createdAt: string
  updatedAt: string
}

const statusColors = {
  'Wpisany': 'bg-green-100 text-green-800',
  'Wykreślony': 'bg-red-100 text-red-800',
  'Zawieszony': 'bg-yellow-100 text-yellow-800'
}

const typeColors = {
  'Instytucja Pożyczkowa': 'bg-blue-100 text-blue-800',
  'Towarzystwo Ubezpieczeniowe': 'bg-purple-100 text-purple-800',
  'Fundusz Inwestycyjny': 'bg-green-100 text-green-800',
  'Bank': 'bg-indigo-100 text-indigo-800'
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subjects')
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key)
    setSortOrder(direction)
  }

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    console.log(`Exporting subjects as ${format}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const columns: Column<Subject>[] = [
    {
      key: 'name',
      label: 'Nazwa podmiotu',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {value}
            </p>
            {row.isCrossBorder && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                Transgraniczny
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Typ',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          typeColors[value as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value) => {
        if (!value) return <span className="text-gray-500">-</span>
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
          }`}>
            {value}
          </span>
        )
      }
    },
    {
      key: 'lei',
      label: 'LEI',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="text-sm text-gray-900 font-mono">
          {value || '-'}
        </span>
      )
    },
    {
      key: 'nip',
      label: 'NIP',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="text-sm text-gray-900 font-mono">
          {value || '-'}
        </span>
      )
    },
    {
      key: 'krs',
      label: 'KRS',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="text-sm text-gray-900 font-mono">
          {value || '-'}
        </span>
      )
    },
    {
      key: 'city',
      label: 'Miasto',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <MapPinIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">
            {value || '-'}
          </span>
        </div>
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
            href={`/communication/subjects/${row.id}`}
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
          <h1 className="text-3xl font-bold text-gray-900">Podmioty nadzorowane</h1>
          <p className="text-gray-600 mt-2">
            Kartoteka podmiotów nadzorowanych przez UKNF
          </p>
        </div>
        <Link
          href="/communication/subjects/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nowy podmiot
        </Link>
      </div>

      <DataTable
        data={subjects}
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
