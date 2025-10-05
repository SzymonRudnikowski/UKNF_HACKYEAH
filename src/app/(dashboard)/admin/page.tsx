import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  UsersIcon, 
  Cog6ToothIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline"

const adminModules = [
  {
    name: 'Użytkownicy',
    href: '/admin/users',
    icon: UsersIcon,
    description: 'Zarządzaj kontami użytkowników',
    color: 'bg-blue-500'
  },
  {
    name: 'Role i uprawnienia',
    href: '/admin/roles',
    icon: Cog6ToothIcon,
    description: 'Konfiguruj role i uprawnienia',
    color: 'bg-green-500'
  },
  {
    name: 'Polityka bezpieczeństwa',
    href: '/admin/security',
    icon: ShieldCheckIcon,
    description: 'Ustawienia bezpieczeństwa i haseł',
    color: 'bg-red-500'
  },
  {
    name: 'Statystyki systemu',
    href: '/admin/statistics',
    icon: ChartBarIcon,
    description: 'Przeglądaj statystyki i raporty',
    color: 'bg-purple-500'
  }
]

const quickStats = [
  {
    name: 'Aktywni użytkownicy',
    value: '1,234',
    change: '+12%',
    changeType: 'positive',
    icon: UsersIcon
  },
  {
    name: 'Sprawozdania w tym miesiącu',
    value: '89',
    change: '+5%',
    changeType: 'positive',
    icon: DocumentTextIcon
  },
  {
    name: 'Wiadomości oczekujące',
    value: '23',
    change: '-8%',
    changeType: 'negative',
    icon: ChatBubbleLeftRightIcon
  }
]

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/sign-in")
  }

  const userRoles = session.user.roles as string[]
  if (!userRoles?.includes("UKNF_ADMIN")) {
    redirect("/unauthorized")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Panel administracyjny
        </h1>
        <p className="text-gray-600 mt-2">
          Zarządzaj systemem i użytkownikami
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {quickStats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
          >
            <dt>
              <div className="absolute rounded-md bg-blue-500 p-3">
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : stat.changeType === 'negative'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {stat.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Admin Modules */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {adminModules.map((module) => (
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

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Ostatnia aktywność systemu
          </h3>
          <div className="mt-5">
            <div className="flow-root">
              <ul className="-mb-8">
                <li>
                  <div className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center ring-8 ring-white">
                          <UsersIcon className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">Nowy użytkownik</span> zarejestrował się w systemie
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>2 godziny temu</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center ring-8 ring-white">
                          <DocumentTextIcon className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">Sprawozdanie</span> zostało pomyślnie zwalidowane
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>4 godziny temu</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center ring-8 ring-white">
                          <Cog6ToothIcon className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">Rola użytkownika</span> została zaktualizowana
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>6 godzin temu</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
