"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, type File, AlertTriangle, Trash2 } from "lucide-react"
import { FileService, type FileMetadata, type UploadProgress } from "@/lib/file-service"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  category: FileMetadata["category"]
  onFileUploaded?: (file: FileMetadata) => void
  onFileDeleted?: (fileId: string) => void
  maxFiles?: number
  className?: string
}

export function FileUpload({ category, onFileUploaded, onFileDeleted, maxFiles = 5, className }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState("")
  const [files, setFiles] = useState<FileMetadata[]>(() => FileService.getFilesByCategory(category))
  const [isMetadataDialogOpen, setIsMetadataDialogOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState({
    source: "",
    owner: "",
    description: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      handleFileSelection(droppedFiles[0])
    }
  }, [])

  const handleFileSelection = (file: File) => {
    if (files.length >= maxFiles) {
      setError(`Máximo de ${maxFiles} arquivos permitidos`)
      return
    }

    const validation = FileService.validateFile(file)
    if (!validation.isValid) {
      setError(validation.error || "Arquivo inválido")
      return
    }

    setError("")
    setPendingFile(file)
    setIsMetadataDialogOpen(true)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelection(selectedFiles[0])
    }
  }

  const handleUpload = async () => {
    if (!pendingFile) return

    if (!metadata.source || !metadata.owner) {
      setError("Fonte e responsável são obrigatórios")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      const fileMetadata = await FileService.uploadFile(
        pendingFile,
        {
          ...metadata,
          category,
          collectedAt: new Date().toISOString(),
        },
        setUploadProgress,
      )

      setFiles((prev) => [...prev, fileMetadata])
      onFileUploaded?.(fileMetadata)

      // Reset form
      setIsMetadataDialogOpen(false)
      setPendingFile(null)
      setMetadata({ source: "", owner: "", description: "" })

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload")
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      await FileService.deleteFile(fileId)
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      onFileDeleted?.(fileId)
    } catch (err) {
      setError("Erro ao deletar arquivo")
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          files.length >= maxFiles && "opacity-50 cursor-not-allowed",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => files.length < maxFiles && fileInputRef.current?.click()}
      >
        <CardContent className="p-6 text-center">
          <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-2">
            {files.length >= maxFiles
              ? `Máximo de ${maxFiles} arquivos atingido`
              : "Clique para selecionar ou arraste arquivos aqui"}
          </p>
          <p className="text-xs text-muted-foreground">PDF, imagens, documentos Word/Excel (máx. 10MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInputChange}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt"
            disabled={files.length >= maxFiles}
          />
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Arquivos Anexados ({files.length}/{maxFiles})
          </h4>
          {files.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-lg">{FileService.getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{FileService.formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{file.source}</span>
                      <span>•</span>
                      <span>{file.owner}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFile(file.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Metadata Dialog */}
      <Dialog open={isMetadataDialogOpen} onOpenChange={setIsMetadataDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Informações do Arquivo</DialogTitle>
            <DialogDescription>Adicione informações sobre o arquivo antes de fazer o upload</DialogDescription>
          </DialogHeader>

          {pendingFile && (
            <div className="space-y-4">
              {/* File Preview */}
              <Card className="p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{FileService.getFileIcon(pendingFile.type)}</span>
                  <div>
                    <p className="text-sm font-medium">{pendingFile.name}</p>
                    <p className="text-xs text-muted-foreground">{FileService.formatFileSize(pendingFile.size)}</p>
                  </div>
                </div>
              </Card>

              {/* Upload Progress */}
              {isUploading && uploadProgress && (
                <Card className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Fazendo Upload</span>
                      <span className="text-sm text-muted-foreground">{uploadProgress.progress}%</span>
                    </div>
                    <Progress value={uploadProgress.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{uploadProgress.message}</p>
                  </div>
                </Card>
              )}

              {/* Metadata Form */}
              {!isUploading && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Fonte *</Label>
                    <Input
                      id="source"
                      value={metadata.source}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, source: e.target.value }))}
                      placeholder="Ex: Departamento de RH, Auditoria Externa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner">Responsável *</Label>
                    <Input
                      id="owner"
                      value={metadata.owner}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, owner: e.target.value }))}
                      placeholder="Nome do responsável pelo documento"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={metadata.description}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição adicional sobre o documento"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsMetadataDialogOpen(false)
                        setPendingFile(null)
                        setMetadata({ source: "", owner: "", description: "" })
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleUpload} disabled={!metadata.source || !metadata.owner}>
                      Fazer Upload
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
