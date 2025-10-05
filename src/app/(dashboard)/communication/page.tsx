import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon, 
  FolderIcon, 
  MegaphoneIcon,
  BookOpenIcon,
  UsersIcon,
  QuestionMarkCircleIcon
} from "@heroicons/react/24/outline"

const communicationModules = [
  {
    name: 'Sprawozdania',
    href: '/communication/reports',
    icon: DocumentTextIcon,
    description: 'Zarządzaj sprawozdaniami i ich walidacją',
    color: 'bg-blue-500'
  },
  {
    name: 'Wiadomości',
    href: '/communication/messages',
    icon: ChatBubbleLeftRightIcon,
    description: 'Komunikacja z UKNF',
    color: 'bg-green-500'
  },
  {
    name: 'Sprawy',
    href: '/communication/cases',
    icon: FolderIcon,
    description: 'Zarządzaj sprawami i teczkami',
    color: 'bg-purple-500'
  },
  {
    name: 'Ogłoszenia',
    href: '/communication/announcements',
    icon: MegaphoneIcon,
    description: 'Przeglądaj ogłoszenia UKNF',
    color: 'bg-orange-500'
  },
  {
    name: 'Biblioteka',
    href: '/communication/library',
    icon: BookOpenIcon,
    description: 'Repozytorium plików i dokumentów',
    color: 'bg-indigo-500'
  },
  {
    name: 'Podmioty',
    href: '/communication/subjects',
    icon: UsersIcon,
    description: 'Kartoteka podmiotów nadzorowanych',
    color: 'bg-pink-500'
  },
  {
    name: 'FAQ',
    href: '/communication/faq',
    icon: QuestionMarkCircleIcon,
    description: 'Baza wiedzy i często zadawane pytania',
    color: 'bg-teal-500'
  }
]

export default async function CommunicationPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/sign-in")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Moduł Komunikacyjny
        </h1>
        <p className="text-gray-600 mt-2">
          Wybierz sekcję, którą chcesz przeglądać lub edytować
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {communicationModules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="relative group bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className={`flex-shrink-0 w-12 h-12 ${module.color} rounded-lg flex items-center justify-center`}>
                <module.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                  {module.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {module.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
