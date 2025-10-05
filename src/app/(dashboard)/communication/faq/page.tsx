"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, StarIcon } from "@heroicons/react/24/outline"
import { DataTable, Column } from "@/components/ui/DataTable"

interface FAQQuestion {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  status: string
  createdAt: string
  updatedAt: string
  author: {
    firstName: string
    lastName: string
  }
  answers?: {
    id: string
    content: string
    author: {
      firstName: string
      lastName: string
      isInternal: boolean
    }
    createdAt: string
    rating: number
  }[]
  isAnonymous: boolean
  viewCount: number
}

const statusColors = {
  'OPEN': 'bg-blue-100 text-blue-800',
  'ANSWERED': 'bg-green-100 text-green-800',
  'CLOSED': 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  'OPEN': 'Otwarte',
  'ANSWERED': 'Odpowiedziane',
  'CLOSED': 'Zamknięte'
}

const categoryColors = {
  'Sprawozdawczość': 'bg-blue-100 text-blue-800',
  'Dostęp do systemu': 'bg-green-100 text-green-800',
  'Sprawy': 'bg-purple-100 text-purple-800',
  'Ogłoszenia': 'bg-orange-100 text-orange-800',
  'Techniczne': 'bg-gray-100 text-gray-800',
  'Inne': 'bg-yellow-100 text-yellow-800'
}

export default function FAQPage() {
  const [questions, setQuestions] = useState<FAQQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      // Mock data for now - in real app, fetch from API
      const mockQuestions: FAQQuestion[] = [
        {
          id: '1',
          title: 'Jak złożyć sprawozdanie kwartalne?',
          content: 'Chciałbym dowiedzieć się, jak prawidłowo złożyć sprawozdanie kwartalne w systemie.',
          category: 'Sprawozdawczość',
          tags: ['sprawozdanie', 'kwartalne', 'instrukcja'],
          status: 'ANSWERED',
          createdAt: '2025-01-10T00:00:00Z',
          updatedAt: '2025-01-12T14:30:00Z',
          author: { firstName: 'Jan', lastName: 'Kowalski' },
          isAnonymous: false,
          viewCount: 45,
          answers: [
            {
              id: '1',
              content: 'Aby złożyć sprawozdanie kwartalne, przejdź do sekcji Sprawozdania i kliknij "Nowe sprawozdanie". Następnie wypełnij formularz i załaduj plik XLSX.',
              author: { firstName: 'Anna', lastName: 'Nowak', isInternal: true },
              createdAt: '2025-01-11T10:00:00Z',
              rating: 4.8
            }
          ]
        },
        {
          id: '2',
          title: 'Problem z logowaniem do systemu',
          content: 'Nie mogę się zalogować do systemu. Czy może być problem z hasłem?',
          category: 'Dostęp do systemu',
          tags: ['logowanie', 'hasło', 'problem'],
          status: 'OPEN',
          createdAt: '2025-01-14T00:00:00Z',
          updatedAt: '2025-01-14T00:00:00Z',
          author: { firstName: 'Piotr', lastName: 'Wiśniewski' },
          isAnonymous: false,
          viewCount: 12,
          answers: []
        }
      ]
      setQuestions(mockQuestions)
    } catch (error) {
      console.error('Failed to fetch FAQ questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key)
    setSortOrder(direction)
  }

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    console.log(`Exporting FAQ questions as ${format}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getAverageRating = (answers: FAQQuestion['answers']) => {
    if (!answers || answers.length === 0) return 0
    const total = answers.reduce((sum, answer) => sum + answer.rating, 0)
    return Number((total / answers.length).toFixed(1))
  }

  const columns: Column<FAQQuestion>[] = [
    {
      key: 'title',
      label: 'Pytanie',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {value}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-xs">
              {row.content}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              {row.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
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
      key: 'answers',
      label: 'Odpowiedzi',
      sortable: true,
      render: (value) => {
        const answerCount = value?.length || 0
        const avgRating = getAverageRating(value)
        return (
          <div className="text-sm">
            <div className="flex items-center space-x-1">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{answerCount}</span>
            </div>
            {avgRating > 0 && (
              <div className="flex items-center space-x-1 mt-1">
                <StarIcon className="h-3 w-3 text-yellow-400" />
                <span className="text-xs text-gray-500">{avgRating}</span>
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'viewCount',
      label: 'Wyświetlenia',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">{value}</span>
      )
    },
    {
      key: 'author',
      label: 'Autor',
      sortable: true,
      render: (value, row) => (
        <div className="text-sm">
          {row.isAnonymous ? (
            <span className="text-gray-500">Anonimowy</span>
          ) : (
            <span className="text-gray-900">
              {value.firstName} {value.lastName}
            </span>
          )}
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
            href={`/communication/faq/${row.id}`}
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
          <h1 className="text-3xl font-bold text-gray-900">FAQ - Baza wiedzy</h1>
          <p className="text-gray-600 mt-2">
            Często zadawane pytania i odpowiedzi
          </p>
        </div>
        <Link
          href="/communication/faq/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nowe pytanie
        </Link>
      </div>

      <DataTable
        data={questions}
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
