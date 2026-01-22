// Employee data types and utilities for ESG reporting
export type Gender = "Feminino" | "Masculino" | "Não binário" | "Outros"
export type Race = "Branca" | "Preta/Parda" | "Indígena" | "Outros"
export type AgeBand = "≤30" | "30–50" | "50+"

export interface EmployeeCell {
  gender: Gender
  race: Race
  ageBand: AgeBand
  count: number
}

export interface EmployeeMatrix {
  unitId: string
  unitName: string
  unitType: "headquarters" | "branch"
  data: EmployeeCell[]
  totals: {
    byGender: Record<Gender, number>
    byRace: Record<Race, number>
    byAge: Record<AgeBand, number>
    total: number
  }
}

export interface NonEmployeeWorkers {
  contractors: number
  freelancers: number
  temporaryWorkers: number
  total: number
}

export const GENDERS: Gender[] = ["Feminino", "Masculino", "Não binário", "Outros"]
export const RACES: Race[] = ["Branca", "Preta/Parda", "Indígena", "Outros"]
export const AGE_BANDS: AgeBand[] = ["≤30", "30–50", "50+"]

// Utility functions for matrix calculations
export function createEmptyMatrix(
  unitId: string,
  unitName: string,
  unitType: "headquarters" | "branch",
): EmployeeMatrix {
  const data: EmployeeCell[] = []

  // Create all combinations of gender × race × age
  GENDERS.forEach((gender) => {
    RACES.forEach((race) => {
      AGE_BANDS.forEach((ageBand) => {
        data.push({ gender, race, ageBand, count: 0 })
      })
    })
  })

  return {
    unitId,
    unitName,
    unitType,
    data,
    totals: calculateTotals(data),
  }
}

export function calculateTotals(data: EmployeeCell[]) {
  const byGender: Record<Gender, number> = {
    Feminino: 0,
    Masculino: 0,
    "Não binário": 0,
    Outros: 0,
  }

  const byRace: Record<Race, number> = {
    Branca: 0,
    "Preta/Parda": 0,
    Indígena: 0,
    Outros: 0,
  }

  const byAge: Record<AgeBand, number> = {
    "≤30": 0,
    "30–50": 0,
    "50+": 0,
  }

  let total = 0

  data.forEach((cell) => {
    byGender[cell.gender] += cell.count
    byRace[cell.race] += cell.count
    byAge[cell.ageBand] += cell.count
    total += cell.count
  })

  return { byGender, byRace, byAge, total }
}

export function updateMatrixCell(
  matrix: EmployeeMatrix,
  gender: Gender,
  race: Race,
  ageBand: AgeBand,
  count: number,
): EmployeeMatrix {
  const newData = matrix.data.map((cell) =>
    cell.gender === gender && cell.race === race && cell.ageBand === ageBand ? { ...cell, count } : cell,
  )

  return {
    ...matrix,
    data: newData,
    totals: calculateTotals(newData),
  }
}

export function copyMatrixStructure(
  sourceMatrix: EmployeeMatrix,
  targetUnitId: string,
  targetUnitName: string,
): EmployeeMatrix {
  return {
    unitId: targetUnitId,
    unitName: targetUnitName,
    unitType: "branch",
    data: sourceMatrix.data.map((cell) => ({ ...cell, count: 0 })),
    totals: calculateTotals(sourceMatrix.data.map((cell) => ({ ...cell, count: 0 }))),
  }
}

// Employee data service
export const employeeDataService = {
  async saveEmployeeMatrices(matrices: EmployeeMatrix[]): Promise<void> {
    localStorage.setItem("esg-employee-matrices", JSON.stringify(matrices))
  },

  async saveNonEmployeeWorkers(workers: NonEmployeeWorkers): Promise<void> {
    localStorage.setItem("esg-non-employee-workers", JSON.stringify(workers))
  },

  getEmployeeMatrices(): EmployeeMatrix[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("esg-employee-matrices")
    return stored ? JSON.parse(stored) : []
  },

  getNonEmployeeWorkers(): NonEmployeeWorkers | null {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem("esg-non-employee-workers")
    return stored ? JSON.parse(stored) : null
  },
}
