export type FrameworkType = "GRI" | "IFRS" | "SASB" | "TCFD"

export interface Framework {
  id: string
  name: string
  type: FrameworkType
  version: string
  description: string
  isActive: boolean
  sectors?: string[]
  lastUpdated: Date
}

export interface FrameworkStandard {
  id: string
  frameworkId: string
  code: string
  title: string
  description: string
  category: string
  subcategory?: string
  isRequired: boolean
  applicableSectors?: string[]
  disclosureRequirements: DisclosureRequirement[]
}

export interface DisclosureRequirement {
  id: string
  standardId: string
  code: string
  title: string
  description: string
  dataType: "quantitative" | "qualitative" | "mixed"
  isRequired: boolean
  guidance?: string
  examples?: string[]
}

export interface OrganizationFramework {
  id: string
  organizationId: string
  frameworkId: string
  isActive: boolean
  selectedStandards: string[]
  customizations?: Record<string, any>
  adoptedDate: Date
  reportingPeriod: {
    start: Date
    end: Date
  }
}

// Framework definitions
export const AVAILABLE_FRAMEWORKS: Framework[] = [
  {
    id: "gri-2021",
    name: "GRI Standards",
    type: "GRI",
    version: "2021",
    description: "Global Reporting Initiative Standards for sustainability reporting",
    isActive: true,
    lastUpdated: new Date("2021-10-05"),
  },
  {
    id: "ifrs-s1-s2",
    name: "IFRS Sustainability Disclosure Standards",
    type: "IFRS",
    version: "S1 & S2",
    description: "International Financial Reporting Standards for sustainability-related financial disclosures",
    isActive: true,
    lastUpdated: new Date("2023-06-26"),
  },
  {
    id: "sasb-2018",
    name: "SASB Standards",
    type: "SASB",
    version: "2018",
    description: "Sustainability Accounting Standards Board industry-specific standards",
    isActive: true,
    sectors: ["Technology", "Healthcare", "Financials", "Consumer Goods", "Energy", "Materials", "Industrials"],
    lastUpdated: new Date("2018-11-01"),
  },
  {
    id: "tcfd-2017",
    name: "TCFD Recommendations",
    type: "TCFD",
    version: "2017",
    description: "Task Force on Climate-related Financial Disclosures recommendations",
    isActive: true,
    lastUpdated: new Date("2017-06-29"),
  },
]

export const GRI_UNIVERSAL_STANDARDS: FrameworkStandard[] = [
  {
    id: "gri-2-1",
    frameworkId: "gri-2021",
    code: "GRI 2-1",
    title: "Organizational details",
    description: "Basic information about the organization",
    category: "General Disclosures",
    subcategory: "The organization and its reporting practices",
    isRequired: true,
    disclosureRequirements: [
      {
        id: "gri-2-1-a",
        standardId: "gri-2-1",
        code: "2-1-a",
        title: "Name of the organization",
        description: "Report the name of the organization",
        dataType: "qualitative",
        isRequired: true,
      },
      {
        id: "gri-2-1-b",
        standardId: "gri-2-1",
        code: "2-1-b",
        title: "Nature of ownership and legal form",
        description: "Report the nature of ownership and legal form",
        dataType: "qualitative",
        isRequired: true,
      },
    ],
  },
  {
    id: "gri-2-7",
    frameworkId: "gri-2021",
    code: "GRI 2-7",
    title: "Employees",
    description: "Information about the organization's employees",
    category: "General Disclosures",
    subcategory: "Activities and workers",
    isRequired: true,
    disclosureRequirements: [
      {
        id: "gri-2-7-a",
        standardId: "gri-2-7",
        code: "2-7-a",
        title: "Total number of employees by employment contract",
        description: "Report total number of employees by employment contract (permanent and temporary), by gender",
        dataType: "quantitative",
        isRequired: true,
      },
      {
        id: "gri-2-7-b",
        standardId: "gri-2-7",
        code: "2-7-b",
        title: "Total number of employees by employment type",
        description: "Report total number of employees by employment type (full-time and part-time), by gender",
        dataType: "quantitative",
        isRequired: true,
      },
    ],
  },
]
