"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DocumentArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline"

const reportSchema = z.object({
  subjectId: z.string().min(1, "Wybierz podmiot"),
  period: z.string().min(1, "Okres jest wymagany"),
  register: z.string().min(1, "Rejestr jest wymagany"),
  description: z.string().optional()
})

type ReportFormData = z.infer<typeof reportSchema>

interface Subject {
  id: number
  name: string
  type: string
}

export default function NewReportPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema)
  })

  const selectedSubjectId = watch('subjectId')

  // Mock subjects - in real app, fetch from API
  useState(() => {
    setSubjects([
      { id: 1, name: "Bank Spółdzielczy w Warszawie", type: "Instytucja Pożyczkowa" },
      { id: 2, name: "Towarzystwo Ubezpieczeniowe ABC", type: "Towarzystwo Ubezpieczeniowe" },
      { id: 3, name: "Fundusz Inwestycyjny XYZ", type: "Fundusz Inwestycyjny" }
    ])
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        alert('Nieprawidłowy typ pliku. Dozwolone formaty: XLSX, XLS, CSV')
        return
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('Plik jest zbyt duży. Maksymalny rozmiar: 100MB')
        return
      }

      setSelectedFile(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
  }

  const onSubmit = async (data: ReportFormData) => {
    if (!selectedFile) {
      alert('Wybierz plik do przesłania')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)

      // Create report record
      const reportResponse = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subjectId: parseInt(data.subjectId),
          period: data.period,
          register: data.register,
          filename: selectedFile.name,
          size: selectedFile.size,
          mime: selectedFile.type,
          description: data.description
        })
      })

      if (!reportResponse.ok) {
        throw new Error('Failed to create report')
      }

      const reportData = await reportResponse.json()

      // Upload file to MinIO
      const formData = new FormData()
      formData.append('file', selectedFile)

      const uploadResponse = await fetch(reportData.upload.url, {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 10
        })
      }, 200)

      // Submit for validation
      await fetch(`/api/reports/${reportData.id}/submit`, {
        method: 'POST'
      })

      router.push(`/communication/reports/${reportData.id}`)
    } catch (error) {
      console.error('Failed to create report:', error)
      alert('Wystąpił błąd podczas tworzenia sprawozdania')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nowe sprawozdanie</h1>
        <p className="text-gray-600 mt-2">
          Wypełnij formularz i wybierz plik do przesłania
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Informacje o sprawozdaniu
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Podmiot nadzorowany *
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
              {errors.subjectId && (
                <p className="mt-1 text-sm text-red-600">{errors.subjectId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Okres sprawozdawczy *
              </label>
              <input
                type="text"
                {...register('period')}
                placeholder="np. 2025-Q1"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.period && (
                <p className="mt-1 text-sm text-red-600">{errors.period.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rejestr *
              </label>
              <select
                {...register('register')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Wybierz rejestr</option>
                <option value="Kwartalne">Kwartalne</option>
                <option value="Roczne">Roczne</option>
                <option value="Archiwalne">Archiwalne</option>
              </select>
              {errors.register && (
                <p className="mt-1 text-sm text-red-600">{errors.register.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Opis (opcjonalny)
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Dodatkowe informacje o sprawozdaniu..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Plik sprawozdania
          </h2>

          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Wybierz plik do przesłania
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      XLSX, XLS, CSV (max 100MB)
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DocumentArrowUpIcon className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {uploading && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Przesyłanie pliku
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {uploadProgress}% przesłane
            </p>
          </div>
        )}

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
            disabled={!selectedFile || isSubmitting || uploading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || uploading ? 'Przesyłanie...' : 'Utwórz sprawozdanie'}
          </button>
        </div>
      </form>
    </div>
  )
}
