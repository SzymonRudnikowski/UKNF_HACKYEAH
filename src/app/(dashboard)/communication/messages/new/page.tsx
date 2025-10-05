"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PaperClipIcon, XMarkIcon } from "@heroicons/react/24/outline"

const messageSchema = z.object({
  subject: z.string().min(1, "Temat jest wymagany"),
  subjectId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  content: z.string().min(1, "Treść wiadomości jest wymagana"),
  accessRequestId: z.string().optional()
})

type MessageFormData = z.infer<typeof messageSchema>

interface Subject {
  id: number
  name: string
  type: string
}

export default function NewMessagePage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      priority: 'MEDIUM'
    }
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
    const files = Array.from(event.target.files || [])
    
    // Validate files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'audio/mpeg',
      'application/zip'
    ]

    const maxSize = 100 * 1024 * 1024 // 100MB
    const totalSize = [...selectedFiles, ...files].reduce((sum, file) => sum + file.size, 0)

    if (totalSize > maxSize) {
      alert('Łączny rozmiar plików nie może przekraczać 100MB')
      return
    }

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`Plik ${file.name} ma nieprawidłowy format`)
        return false
      }
      return true
    })

    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: MessageFormData) => {
    try {
      setIsSubmitting(true)

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          subjectId: data.subjectId ? parseInt(data.subjectId) : undefined,
          accessRequestId: data.accessRequestId ? parseInt(data.accessRequestId) : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create message thread')
      }

      const result = await response.json()
      router.push(`/communication/messages/${result.threadId}`)
    } catch (error) {
      console.error('Failed to create message:', error)
      alert('Wystąpił błąd podczas tworzenia wiadomości')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nowa wiadomość</h1>
        <p className="text-gray-600 mt-2">
          Wyślij wiadomość do UKNF lub podmiotu nadzorowanego
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Informacje o wiadomości
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Temat *
              </label>
              <input
                type="text"
                {...register('subject')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Wprowadź temat wiadomości"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                Treść wiadomości *
              </label>
              <textarea
                {...register('content')}
                rows={8}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Wprowadź treść wiadomości..."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Załączniki (opcjonalne)
          </h2>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Dodaj załączniki
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PDF, DOC, XLS, CSV, TXT, MP3, ZIP (max 100MB łącznie)
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.mp3,.zip"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Wybrane pliki ({selectedFiles.length})
                </h3>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <PaperClipIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            {isSubmitting ? 'Wysyłanie...' : 'Wyślij wiadomość'}
          </button>
        </div>
      </form>
    </div>
  )
}
