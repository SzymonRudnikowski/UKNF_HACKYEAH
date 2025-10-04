import { ClamAV } from 'clamav.js'

const clamav = new ClamAV({
  host: process.env.CLAMAV_HOST || 'localhost',
  port: parseInt(process.env.CLAMAV_PORT || '3310'),
  timeout: 30000
})

export interface ScanResult {
  isClean: boolean
  threats: string[]
  scanTime: number
}

export class AntivirusService {
  private static instance: AntivirusService
  private client: ClamAV

  private constructor() {
    this.client = clamav
  }

  public static getInstance(): AntivirusService {
    if (!AntivirusService.instance) {
      AntivirusService.instance = new AntivirusService()
    }
    return AntivirusService.instance
  }

  async scanBuffer(buffer: Buffer): Promise<ScanResult> {
    const startTime = Date.now()
    
    try {
      const result = await this.client.scanBuffer(buffer)
      const scanTime = Date.now() - startTime

      if (result.isInfected) {
        return {
          isClean: false,
          threats: result.viruses || ['Unknown threat'],
          scanTime
        }
      }

      return {
        isClean: true,
        threats: [],
        scanTime
      }
    } catch (error) {
      console.error('Antivirus scan failed:', error)
      // In case of scan failure, we might want to block the file for safety
      // or allow it through depending on security requirements
      return {
        isClean: false,
        threats: ['Scan failed - file blocked for safety'],
        scanTime: Date.now() - startTime
      }
    }
  }

  async scanFile(filePath: string): Promise<ScanResult> {
    const startTime = Date.now()
    
    try {
      const result = await this.client.scanFile(filePath)
      const scanTime = Date.now() - startTime

      if (result.isInfected) {
        return {
          isClean: false,
          threats: result.viruses || ['Unknown threat'],
          scanTime
        }
      }

      return {
        isClean: true,
        threats: [],
        scanTime
      }
    } catch (error) {
      console.error('Antivirus scan failed:', error)
      return {
        isClean: false,
        threats: ['Scan failed - file blocked for safety'],
        scanTime: Date.now() - startTime
      }
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.ping()
      return true
    } catch (error) {
      console.error('ClamAV health check failed:', error)
      return false
    }
  }

  async getVersion(): Promise<string> {
    try {
      const version = await this.client.version()
      return version
    } catch (error) {
      console.error('Failed to get ClamAV version:', error)
      return 'Unknown'
    }
  }
}

export const antivirus = AntivirusService.getInstance()

// Health check function
export async function checkAntivirusHealth(): Promise<{
  isHealthy: boolean
  version: string
  lastCheck: Date
}> {
  const isHealthy = await antivirus.isHealthy()
  const version = await antivirus.getVersion()
  
  return {
    isHealthy,
    version,
    lastCheck: new Date()
  }
}
