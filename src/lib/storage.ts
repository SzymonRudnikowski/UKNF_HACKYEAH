import { Client } from 'minio'
import { generateUniqueFilename, sanitizeFilename } from './utils'

const BUCKET_NAME = process.env.S3_BUCKET || 'uknf-files'

export class StorageService {
  private static instance: StorageService
  private client: Client | null = null

  private constructor() {
    // Lazy initialization
  }

  private getClient(): Client {
    if (!this.client) {
      const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000'
      const url = new URL(endpoint)
      
      this.client = new Client({
        endPoint: url.hostname,
        port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 9000),
        useSSL: url.protocol === 'https:',
        accessKey: process.env.S3_ACCESS_KEY || 'minio',
        secretKey: process.env.S3_SECRET_KEY || 'miniosecret'
      })
    }
    return this.client
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  async initialize(): Promise<void> {
    try {
      const client = this.getClient()
      const exists = await client.bucketExists(BUCKET_NAME)
      if (!exists) {
        await client.makeBucket(BUCKET_NAME, 'us-east-1')
        console.log(`✅ Created bucket: ${BUCKET_NAME}`)
      } else {
        console.log(`✅ Bucket ${BUCKET_NAME} already exists`)
      }
    } catch (error) {
      console.error('❌ Failed to initialize storage:', error)
      // Don't throw error in development, just log it
      if (process.env.NODE_ENV === 'production') {
        throw error
      }
    }
  }

  async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'uploads'
  ): Promise<{ path: string; filename: string }> {
    try {
      const filename = generateUniqueFilename(originalName)
      const sanitizedFilename = sanitizeFilename(filename)
      const objectName = `${folder}/${sanitizedFilename}`

      const client = this.getClient()
      await client.putObject(BUCKET_NAME, objectName, file, file.length, {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${originalName}"`
      })

      return {
        path: objectName,
        filename: sanitizedFilename
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
      throw error
    }
  }

  async getFile(path: string): Promise<Buffer> {
    try {
      const client = this.getClient()
      const stream = await client.getObject(BUCKET_NAME, path)
      const chunks: Buffer[] = []
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })
    } catch (error) {
      console.error('Failed to get file:', error)
      throw error
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const client = this.getClient()
      await client.removeObject(BUCKET_NAME, path)
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw error
    }
  }

  async getPresignedUrl(
    path: string,
    expires: number = 3600
  ): Promise<string> {
    try {
      const client = this.getClient()
      return await client.presignedGetObject(BUCKET_NAME, path, expires)
    } catch (error) {
      console.error('Failed to get presigned URL:', error)
      throw error
    }
  }

  async getPresignedPostUrl(
    path: string,
    expires: number = 3600
  ): Promise<{ url: string; fields: Record<string, string> }> {
    try {
      const client = this.getClient()
      const policy = client.newPostPolicy()
      policy.setBucket(BUCKET_NAME)
      policy.setKey(path)
      policy.setExpires(new Date(Date.now() + expires * 1000))
      policy.setContentType('application/octet-stream')

      const presignedPostData = await client.presignedPostPolicy(policy)
      
      return {
        url: presignedPostData.postURL,
        fields: presignedPostData.formData
      }
    } catch (error) {
      console.error('Failed to get presigned POST URL:', error)
      throw error
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      const client = this.getClient()
      await client.statObject(BUCKET_NAME, path)
      return true
    } catch (error) {
      return false
    }
  }

  async getFileInfo(path: string): Promise<{
    size: number
    lastModified: Date
    etag: string
    contentType: string
  }> {
    try {
      const client = this.getClient()
      const stat = await client.statObject(BUCKET_NAME, path)
      return {
        size: stat.size,
        lastModified: stat.lastModified,
        etag: stat.etag,
        contentType: stat.metaData['content-type'] || 'application/octet-stream'
      }
    } catch (error) {
      console.error('Failed to get file info:', error)
      throw error
    }
  }
}

export const storage = StorageService.getInstance()
