"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusIcon, UserIcon, ShieldCheckIcon, XMarkIcon, PencilIcon } from "@heroicons/react/24/outline"
import { DataTable, Column } from "@/components/ui/DataTable"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  isInternal: boolean
  isActive: boolean
  roles: string[]
  createdAt: string
  lastLoginAt?: string
  peselMasked?: string
  phone?: string
}

const roleColors = {
  'UKNF_ADMIN': 'bg-red-100 text-red-800',
  'UKNF_WORKER': 'bg-blue-100 text-blue-800',
  'SUBJECT_ADMIN': 'bg-green-100 text-green-800',
  'SUBJECT_EMPLOYEE': 'bg-gray-100 text-gray-800'
}

const roleLabels = {
  'UKNF_ADMIN': 'Admin UKNF',
  'UKNF_WORKER': 'Pracownik UKNF',
  'SUBJECT_ADMIN': 'Admin podmiotu',
  'SUBJECT_EMPLOYEE': 'Pracownik podmiotu'
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Mock data for now - in real app, fetch from API
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@uknf.gov.pl',
          firstName: 'Jan',
          lastName: 'Kowalski',
          isInternal: true,
          isActive: true,
          roles: ['UKNF_ADMIN'],
          createdAt: '2025-01-01T00:00:00Z',
          lastLoginAt: '2025-01-15T10:30:00Z'
        },
        {
          id: '2',
          email: 'worker@uknf.gov.pl',
          firstName: 'Anna',
          lastName: 'Nowak',
          isInternal: true,
          isActive: true,
          roles: ['UKNF_WORKER'],
          createdAt: '2025-01-02T00:00:00Z',
          lastLoginAt: '2025-01-15T09:15:00Z'
        },
        {
          id: '3',
          email: 'admin@bank.pl',
          firstName: 'Piotr',
          lastName: 'Wiśniewski',
          isInternal: false,
          isActive: true,
          roles: ['SUBJECT_ADMIN'],
          createdAt: '2025-01-05T00:00:00Z',
          lastLoginAt: '2025-01-14T16:45:00Z',
          peselMasked: '****1234',
          phone: '+48 123 456 789'
        }
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key)
    setSortOrder(direction)
  }

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    console.log(`Exporting users as ${format}`)
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

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // In real app, make API call to toggle user status
      console.log(`Toggling user ${userId} status from ${currentStatus} to ${!currentStatus}`)
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, isActive: !currentStatus }
          : user
      ))
    } catch (error) {
      console.error('Failed to toggle user status:', error)
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'firstName',
      label: 'Użytkownik',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              row.isInternal ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              <UserIcon className={`h-4 w-4 ${
                row.isInternal ? 'text-blue-600' : 'text-green-600'
              }`} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {value} {row.lastName}
            </p>
            <p className="text-sm text-gray-500">{row.email}</p>
            {row.peselMasked && (
              <p className="text-xs text-gray-400">PESEL: {row.peselMasked}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'isInternal',
      label: 'Typ',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {value ? 'Wewnętrzny' : 'Zewnętrzny'}
        </span>
      )
    },
    {
      key: 'roles',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value.map((role: string, index: number) => (
            <span
              key={index}
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {roleLabels[role as keyof typeof roleLabels] || role}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? 'Aktywny' : 'Nieaktywny'}
          </span>
          <button
            onClick={() => handleToggleUserStatus(row.id, value)}
            className="text-gray-400 hover:text-gray-600"
            title={value ? 'Dezaktywuj' : 'Aktywuj'}
          >
            {value ? <XMarkIcon className="h-4 w-4" /> : <ShieldCheckIcon className="h-4 w-4" />}
          </button>
        </div>
      )
    },
    {
      key: 'lastLoginAt',
      label: 'Ostatnie logowanie',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">
          {value ? formatDate(value) : 'Nigdy'}
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
          <button
            onClick={() => {
              // In real app, this would open edit modal
              console.log('Edit user:', row.id)
            }}
            className="text-blue-600 hover:text-blue-900"
            title="Edytuj"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <Link
            href={`/admin/users/${row.id}`}
            className="text-gray-600 hover:text-gray-900"
            title="Szczegóły"
          >
            <UserIcon className="h-4 w-4" />
          </Link>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Użytkownicy</h1>
          <p className="text-gray-600 mt-2">
            Zarządzaj kontami użytkowników systemu
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nowy użytkownik
        </Link>
      </div>

      <DataTable
        data={users}
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
