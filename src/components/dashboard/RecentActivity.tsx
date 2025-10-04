"use client"

import { formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"

const activities = [
  {
    id: 1,
    type: 'report',
    title: 'Sprawozdanie kwartalne Q1 2025',
    description: 'Złożono nowe sprawozdanie',
    time: new Date('2025-01-15T10:30:00'),
    status: 'success',
  },
  {
    id: 2,
    type: 'message',
    title: 'Odpowiedź na wiadomość',
    description: 'Otrzymano odpowiedź od UKNF',
    time: new Date('2025-01-14T14:20:00'),
    status: 'info',
  },
  {
    id: 3,
    type: 'case',
    title: 'Sprawa: Zmiana danych rejestrowych',
    description: 'Sprawa została zaktualizowana',
    time: new Date('2025-01-13T09:15:00'),
    status: 'warning',
  },
  {
    id: 4,
    type: 'announcement',
    title: 'Nowe wymagania sprawozdawcze',
    description: 'Opublikowano nowe ogłoszenie',
    time: new Date('2025-01-12T16:45:00'),
    status: 'info',
  },
]

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

export function RecentActivity() {
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
          <a
            href="#"
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Zobacz wszystkie
          </a>
        </div>
      </div>
    </div>
  )
}
