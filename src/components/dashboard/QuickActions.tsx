"use client"

import Link from "next/link"
import { 
  PlusIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon, 
  FolderIcon 
} from "@heroicons/react/24/outline"

const actions = [
  {
    name: 'Nowe sprawozdanie',
    href: '/communication/reports/new',
    icon: DocumentTextIcon,
    description: 'Złóż nowe sprawozdanie',
  },
  {
    name: 'Nowa wiadomość',
    href: '/communication/messages/new',
    icon: ChatBubbleLeftRightIcon,
    description: 'Wyślij wiadomość do UKNF',
  },
  {
    name: 'Nowa sprawa',
    href: '/communication/cases/new',
    icon: FolderIcon,
    description: 'Utwórz nową sprawę',
  },
]

export function QuickActions() {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Szybkie akcje
        </h3>
        <div className="mt-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {actions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
              >
                <div className="flex-shrink-0">
                  <action.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">{action.name}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <PlusIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
