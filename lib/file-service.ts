export interface FileMetadata {
  id: string
  name: string
  size: number
  type: string
  source: string
  collectedAt: string
  owner: string
  description?: string
  category: "evidence" | "assurance" | "policy" | "other"
}

export interface UploadProgress {
  progress: number
  stage: "preparing" | "uploading" | "processing" | "complete" | "error"
  message: string
}

export class FileService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ]

  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${this.formatFileSize(this.MAX_FILE_SIZE)}`,
      }
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: "Tipo de arquivo não suportado. Use PDF, imagens, documentos Word/Excel ou texto.",
      }
    }

    return { isValid: true }
  }

  static async uploadFile(
    file: File,
    metadata: Omit<FileMetadata, "id" | "name" | "size" | "type">,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<FileMetadata> {
    // Validate file first
    const validation = this.validateFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    // Simulate upload progress
    const stages: UploadProgress[] = [
      { stage: "preparing", progress: 10, message: "Preparando arquivo..." },
      { stage: "uploading", progress: 50, message: "Enviando arquivo..." },
      { stage: "processing", progress: 80, message: "Processando arquivo..." },
      { stage: "complete", progress: 100, message: "Upload concluído!" },
    ]

    for (const stage of stages) {
      onProgress?.(stage)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Create file metadata
    const fileMetadata: FileMetadata = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      ...metadata,
    }

    // Store file metadata (in real app, this would be sent to backend)
    this.storeFileMetadata(fileMetadata)

    return fileMetadata
  }

  static async deleteFile(fileId: string): Promise<void> {
    // Remove from storage
    const files = this.getStoredFiles()
    const updatedFiles = files.filter((f) => f.id !== fileId)
    localStorage.setItem("esg_files", JSON.stringify(updatedFiles))
  }

  static getStoredFiles(): FileMetadata[] {
    try {
      const stored = localStorage.getItem("esg_files")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static getFilesByCategory(category: FileMetadata["category"]): FileMetadata[] {
    return this.getStoredFiles().filter((f) => f.category === category)
  }

  private static storeFileMetadata(metadata: FileMetadata): void {
    const files = this.getStoredFiles()
    files.push(metadata)
    localStorage.setItem("esg_files", JSON.stringify(files))
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  static getFileIcon(type: string): string {
    if (type.includes("pdf")) return "📄"
    if (type.includes("image")) return "🖼️"
    if (type.includes("word") || type.includes("document")) return "📝"
    if (type.includes("excel") || type.includes("sheet")) return "📊"
    return "📎"
  }
}
