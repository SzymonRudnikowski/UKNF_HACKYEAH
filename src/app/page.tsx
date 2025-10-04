import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Platforma Komunikacyjna UKNF
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            System komunikacyjny Urzędu Komisji Nadzoru Finansowego
          </p>
          <p className="text-lg text-gray-500 mb-12">
            Bezpieczna platforma do komunikacji między UKNF a podmiotami nadzorowanymi
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-in"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Zaloguj się
            </Link>
            <Link
              href="/sign-up"
              className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition-colors"
            >
              Zarejestruj się
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Sprawozdawczość
              </h3>
              <p className="text-gray-600">
                Składaj sprawozdania elektronicznie z automatyczną walidacją i systemem korekt
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Komunikacja
              </h3>
              <p className="text-gray-600">
                Bezpieczna komunikacja z UKNF poprzez system wiadomości i ogłoszeń
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Sprawy
              </h3>
              <p className="text-gray-600">
                Zarządzaj sprawami i dokumentami w jednym miejscu z pełną historią zmian
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
