export interface ExportData {
  organization: any
  reportingPeriod: any
  employeeMatrices: any[]
  nonEmployeeWorkers: any
  governanceData: any
  policies: any
}

export interface ExportProgress {
  stage: string
  progress: number
  message: string
}

export class ExportService {
  static async generateXLSX(data: ExportData, onProgress?: (progress: ExportProgress) => void): Promise<Blob> {
    // Simulate export progress
    const stages = [
      { stage: "validation", message: "Validando dados...", progress: 10 },
      { stage: "organization", message: "Processando dados organizacionais...", progress: 25 },
      { stage: "employees", message: "Gerando matriz de funcionários...", progress: 50 },
      { stage: "governance", message: "Compilando dados de governança...", progress: 75 },
      { stage: "formatting", message: "Formatando relatório GRI...", progress: 90 },
      { stage: "complete", message: "Relatório gerado com sucesso!", progress: 100 },
    ]

    for (const stage of stages) {
      onProgress?.(stage)
      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    // Generate mock XLSX content
    const xlsxContent = this.generateXLSXContent(data)
    return new Blob([xlsxContent], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  }

  static async generatePDF(data: ExportData, onProgress?: (progress: ExportProgress) => void): Promise<Blob> {
    // Simulate PDF generation
    const stages = [
      { stage: "validation", message: "Validando dados...", progress: 15 },
      { stage: "layout", message: "Preparando layout do relatório...", progress: 35 },
      { stage: "content", message: "Gerando conteúdo GRI...", progress: 65 },
      { stage: "formatting", message: "Aplicando formatação final...", progress: 85 },
      { stage: "complete", message: "Relatório PDF gerado!", progress: 100 },
    ]

    for (const stage of stages) {
      onProgress?.(stage)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Generate mock PDF content
    const pdfContent = this.generatePDFContent(data)
    return new Blob([pdfContent], { type: "application/pdf" })
  }

  private static generateXLSXContent(data: ExportData): string {
    // Mock XLSX generation - in real implementation, use libraries like xlsx or exceljs
    const csvContent = [
      "GRI 2 - General Disclosures Report",
      "",
      "Organization Information",
      `Legal Name,${data.organization?.legalName || ""}`,
      `Legal Form,${data.organization?.legalForm || ""}`,
      `Address,${data.organization?.address || ""}`,
      `CNPJ,${data.organization?.cnpj || ""}`,
      "",
      "Reporting Period",
      `Start Date,${data.reportingPeriod?.startDate || ""}`,
      `End Date,${data.reportingPeriod?.endDate || ""}`,
      "",
      "Employee Demographics",
      "Gender,Race,Age Band,Count",
      ...(data.employeeMatrices?.[0]?.data?.map(
        (item: any) => `${item.gender},${item.race},${item.ageBand},${item.count}`,
      ) || []),
      "",
      "Generated on," + new Date().toISOString(),
    ].join("\n")

    return csvContent
  }

  private static generatePDFContent(data: ExportData): string {
    // Mock PDF content - in real implementation, use libraries like jsPDF or puppeteer
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(GRI 2 - General Disclosures Report) Tj
0 -20 Td
(Organization: ${data.organization?.legalName || "N/A"}) Tj
0 -20 Td
(Generated: ${new Date().toLocaleDateString("pt-BR")}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
456
%%EOF`
  }

  static validateExportData(data: ExportData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.organization?.legalName) {
      errors.push("Nome da organização é obrigatório")
    }

    if (!data.reportingPeriod?.startDate || !data.reportingPeriod?.endDate) {
      errors.push("Período de relatório é obrigatório")
    }

    if (!data.employeeMatrices?.length || data.employeeMatrices.every((matrix) => matrix.totals.total === 0)) {
      errors.push("Dados de funcionários são obrigatórios - preencha pelo menos uma matriz")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  static downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
