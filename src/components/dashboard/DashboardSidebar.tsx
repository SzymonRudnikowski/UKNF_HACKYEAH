"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { 
  HomeIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon, 
  FolderIcon, 
  MegaphoneIcon, 
  BookOpenIcon, 
  UsersIcon, 
  QuestionMarkCircleIcon,
  Cog6ToothIcon
} from "@heroicons/react/24/outline"

interface User {
  id?: string
  email?: string | null
  firstName?: string
  lastName?: string
  isInternal?: boolean
  roles?: string[]
}

interface DashboardSidebarProps {
  user: User
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Sprawozdania', href: '/communication/reports', icon: DocumentTextIcon },
  { name: 'Wiadomości', href: '/communication/messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Sprawy', href: '/communication/cases', icon: FolderIcon },
  { name: 'Ogłoszenia', href: '/communication/announcements', icon: MegaphoneIcon },
  { name: 'Biblioteka', href: '/communication/library', icon: BookOpenIcon },
  { name: 'Podmioty', href: '/communication/subjects', icon: UsersIcon },
  { name: 'FAQ', href: '/communication/faq', icon: QuestionMarkCircleIcon },
]

const adminNavigation = [
  { name: 'Użytkownicy', href: '/admin/users', icon: UsersIcon },
  { name: 'Role', href: '/admin/roles', icon: Cog6ToothIcon },
]

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-gray-900">UKNF Platform</h1>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium border-l-4`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 h-6 w-6`}
                  />
                  {item.name}
                </Link>
              )
            })}
            
            {user.isInternal && (
              <>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administracja
                </div>
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium border-l-4`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        } mr-3 h-6 w-6`}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {user.firstName || ''} {user.lastName || ''}
                </p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                  {user.email || ''}
                </p>
                <p className="text-xs text-gray-500">
                  {user.isInternal ? 'UKNF' : 'Podmiot nadzorowany'}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Wyloguj się
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
