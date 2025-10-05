"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const caseSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  category: z.string().min(1, "Kategoria jest wymagana"),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  subjectId: z.string().optional(),
  description: z.string().min(1, "Opis jest wymagany")
})

type CaseFormData = z.infer<typeof caseSchema>

interface Subject {
  id: number
  name: string
  type: string
}

const categories = [
  'Zmiana danych rejestrowych',
  'Zmiana składu osobowego',
  'Wezwanie',
  'Uprawnienia',
  'Sprawozdawczość',
  'Inne'
]

export default function NewCasePage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      priority: 'MEDIUM'
    }
  })

  // Mock subjects - in real app, fetch from API
  useState(() => {
    setSubjects([
      { id: 1, name: "Bank Spółdzielczy w Warszawie", type: "Instytucja Pożyczkowa" },
      { id: 2, name: "Towarzystwo Ubezpieczeniowe ABC", type: "Towarzystwo Ubezpieczeniowe" },
      { id: 3, name: "Fundusz Inwestycyjny XYZ", type: "Fundusz Inwestycyjny" }
    ])
  })

  const onSubmit = async (data: CaseFormData) => {
    try {
      setIsSubmitting(true)

      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          subjectId: data.subjectId ? parseInt(data.subjectId) : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create case')
      }

      const result = await response.json()
      router.push(`/communication/cases/${result.id}`)
    } catch (error) {
      console.error('Failed to create case:', error)
      alert('Wystąpił błąd podczas tworzenia sprawy')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nowa sprawa</h1>
        <p className="text-gray-600 mt-2">
          Utwórz nową sprawę w systemie
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Informacje o sprawie
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tytuł sprawy *
              </label>
              <input
                type="text"
                {...register('title')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Wprowadź tytuł sprawy"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kategoria *
                </label>
                <select
                  {...register('category')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Wybierz kategorię</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Priorytet
                </label>
                <select
                  {...register('priority')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="LOW">Niski</option>
                  <option value="MEDIUM">Średni</option>
                  <option value="HIGH">Wysoki</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Podmiot nadzorowany (opcjonalny)
              </label>
              <select
                {...register('subjectId')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Wybierz podmiot</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Opis sprawy *
              </label>
              <textarea
                {...register('description')}
                rows={6}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Opisz szczegóły sprawy..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Tworzenie...' : 'Utwórz sprawę'}
          </button>
        </div>
      </form>
    </div>
  )
}
