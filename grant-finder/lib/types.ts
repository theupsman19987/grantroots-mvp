export type ApplicantType =
  | 'nonprofit'
  | 'individual'
  | 'for-profit'
  | 'government'
  | 'education'
  | 'faith-based'
  | 'tribal'

export type FunderType = 'government' | 'foundation' | 'corporate' | 'community'

export type GrantStatus = 'saved' | 'applied' | 'awarded' | 'rejected'

export type GrantSyncStatus = 'open' | 'forecasted' | 'closed' | 'archived'

export interface Grant {
  id: string
  title: string
  funder: string
  funderType: FunderType
  amountMin: number
  amountMax: number
  deadline: Date
  eligibleApplicants: ApplicantType[]
  focusAreas: string[]
  geographicFocus: string[]
  description: string
  requirements: string[]
  applicationUrl: string
  isOpen: boolean
  status: GrantSyncStatus
  tags: string[]
  createdAt: Date
  // Enriched fields
  opportunityNumber: string | null
  eligibilityText: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  expectedAwards: number | null
  costSharing: boolean | null
  openDate: Date | null
  amountNote: string | null
}

export interface SavedGrant {
  grantId: string
  userId: string
  status: GrantStatus
  notes: string
  savedAt: Date
  appliedAt: Date | null
  resolvedAt: Date | null
}

export interface Funder {
  id: string
  name: string
  type: FunderType
  totalGrantsAvailable: number
  focusAreas: string[]
  location: string
  websiteUrl: string
  description: string
  assets?: string
}

export type ScholarshipEthnicity =
  | 'Black/African American'
  | 'Hispanic/Latino'
  | 'Native American/Alaska Native'
  | 'Asian American/Pacific Islander'
  | 'Pacific Islander'
  | 'White'
  | 'All Ethnicities'

export interface Scholarship {
  id: string
  title: string
  sponsor: string
  amountMin: number
  amountMax: number
  amountNote: string | null
  deadline: Date | null
  description: string
  gpaMin: number | null
  eligibleStates: string[]
  eligibleEthnicities: ScholarshipEthnicity[]
  schoolTypes: ('college' | 'trade')[]
  focusAreas: string[]
  applyUrl: string
  isOpen: boolean
  tags: string[]
}

export interface ScholarshipFilters {
  query: string
  gpaMin: number | null
  states: string[]
  ethnicities: ScholarshipEthnicity[]
  schoolTypes: ('college' | 'trade')[]
  focusAreas: string[]
  amountMin: number | null
  isOpenOnly: boolean
  sortBy: 'deadline' | 'amount' | 'relevance'
}

export interface GrantFilters {
  query: string
  funderTypes: FunderType[]
  amountMin: number | null
  amountMax: number | null
  deadlineBefore: Date | null
  geographicFocus: string[]
  eligibleApplicants: ApplicantType[]
  focusAreas: string[]
  agencies: string[]
  isOpenOnly: boolean
  includeArchived: boolean
  sortBy: 'deadline' | 'amount' | 'relevance' | 'newest'
}
