"use client"

import useSWR from "swr"
import { 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon, 
  FolderIcon, 
  MegaphoneIcon 
} from "@heroicons/react/24/outline"

const stats = [
  {
    name: 'Sprawozdania',
    value: '12',
    change: '+2',
    changeType: 'positive',
    icon: DocumentTextIcon,
  },
  {
    name: 'Wiadomości',
    value: '8',
    change: '+1',
    changeType: 'positive',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Sprawy',
    value: '5',
    change: '0',
    changeType: 'neutral',
    icon: FolderIcon,
  },
  {
    name: 'Ogłoszenia',
    value: '3',
    change: '+1',
    changeType: 'positive',
    icon: MegaphoneIcon,
  },
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.name}
          className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
        >
          <dt>
            <div className="absolute rounded-md bg-blue-500 p-3">
              <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">
              {item.name}
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
            <p
              className={`ml-2 flex items-baseline text-sm font-semibold ${
                item.changeType === 'positive'
                  ? 'text-green-600'
                  : item.changeType === 'negative'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {item.change}
            </p>
          </dd>
        </div>
      ))}
    </div>
  )
}
