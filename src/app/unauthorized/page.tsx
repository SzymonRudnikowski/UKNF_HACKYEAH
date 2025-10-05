import Link from "next/link"
import { ExclamationTriangleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Brak uprawnień
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Nie masz uprawnień do przeglądania tej strony
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Aby uzyskać dostęp do tej sekcji, skontaktuj się z administratorem systemu.
            </p>
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Powrót do dashboardu
              </Link>
              <Link
                href="/"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Strona główna
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
