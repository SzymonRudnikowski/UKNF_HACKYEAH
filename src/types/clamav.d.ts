declare module 'clamav.js' {
  export class ClamAV {
    constructor(config: {
      host: string;
      port: number;
      timeout?: number;
    });
    
    scanBuffer(buffer: Buffer): Promise<{
      isInfected: boolean;
      viruses: string[];
    }>;
    
    scanFile(filePath: string): Promise<{
      isInfected: boolean;
      viruses: string[];
    }>;
    
    ping(): Promise<void>;
    
    version(): Promise<string>;
  }
}
