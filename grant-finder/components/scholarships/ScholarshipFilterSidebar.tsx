'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScholarshipFilters, ScholarshipEthnicity } from '@/lib/types'
import { cn } from '@/lib/utils'

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming','Washington DC',
]

const ETHNICITIES: ScholarshipEthnicity[] = [
  'Black/African American',
  'Hispanic/Latino',
  'Native American/Alaska Native',
  'Asian American/Pacific Islander',
  'Pacific Islander',
  'White',
]

const GPA_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any GPA', value: null },
  { label: '2.0+', value: 2.0 },
  { label: '2.5+', value: 2.5 },
  { label: '3.0+', value: 3.0 },
  { label: '3.3+', value: 3.3 },
  { label: '3.5+', value: 3.5 },
]

interface ScholarshipFilterSidebarProps {
  filters: ScholarshipFilters
  onUpdate: <K extends keyof ScholarshipFilters>(key: K, value: ScholarshipFilters[K]) => void
  onToggleSchoolType: (type: 'college' | 'trade') => void
  onToggleEthnicity: (e: ScholarshipEthnicity) => void
  onReset: () => void
  activeFilterCount: number
}

export function ScholarshipFilterSidebar({
  filters,
  onUpdate,
  onToggleSchoolType,
  onToggleEthnicity,
  onReset,
  activeFilterCount,
}: ScholarshipFilterSidebarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#6B0F1A]">Filters</span>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-[#6B0F1A] hover:text-[#8B1A28] px-2"
            onClick={onReset}
          >
            Clear all ({activeFilterCount})
          </Button>
        )}
      </div>

      <Separator />

      {/* School Type */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">School Type</p>
        <div className="flex flex-col gap-1.5">
          {(['college', 'trade'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onToggleSchoolType(type)}
              className={cn(
                'w-full rounded-lg border-2 py-2 text-sm font-medium transition-all text-left px-3',
                filters.schoolTypes.includes(type)
                  ? 'border-[#6B0F1A] bg-[#6B0F1A]/5 text-[#6B0F1A]'
                  : 'border-input bg-background text-foreground hover:border-[#6B0F1A]/40'
              )}
            >
              {type === 'college' ? '🎓 College / University' : '🔧 Trade / Vocational'}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <Accordion defaultValue={['gpa', 'ethnicity', 'state']} className="space-y-0">

        {/* GPA */}
        <AccordionItem value="gpa" className="border-none">
          <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:no-underline py-2">
            My GPA
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="grid grid-cols-2 gap-1.5">
              {GPA_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => onUpdate('gpaMin', opt.value)}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-xs font-medium transition-all',
                    filters.gpaMin === opt.value
                      ? 'border-[#6B0F1A] bg-[#6B0F1A]/5 text-[#6B0F1A]'
                      : 'border-input bg-background text-foreground hover:border-[#6B0F1A]/40'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Shows scholarships you qualify for based on GPA</p>
          </AccordionContent>
        </AccordionItem>

        <Separator />

        {/* Ethnicity */}
        <AccordionItem value="ethnicity" className="border-none">
          <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:no-underline py-2">
            Ethnicity
          </AccordionTrigger>
          <AccordionContent className="pb-3 space-y-2">
            {ETHNICITIES.map((e) => (
              <label key={e} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.ethnicities.includes(e)}
                  onChange={() => onToggleEthnicity(e)}
                  className="rounded border-input accent-[#6B0F1A] size-3.5"
                />
                <span className="text-sm group-hover:text-[#6B0F1A] transition-colors">{e}</span>
              </label>
            ))}
            <p className="text-xs text-muted-foreground pt-1">Unchecked = shows all, including open-to-everyone scholarships</p>
          </AccordionContent>
        </AccordionItem>

        <Separator />

        {/* State */}
        <AccordionItem value="state" className="border-none">
          <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:no-underline py-2">
            Your State
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <select
              value={filters.states[0] ?? ''}
              onChange={(e) => onUpdate('states', e.target.value ? [e.target.value] : [])}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#6B0F1A]/30 focus:border-[#6B0F1A] text-foreground"
            >
              <option value="">National (all states)</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-2">Includes national + state-specific scholarships</p>
          </AccordionContent>
        </AccordionItem>

        <Separator />

        {/* Amount */}
        <AccordionItem value="amount" className="border-none">
          <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:no-underline py-2">
            Minimum Award
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="grid grid-cols-2 gap-1.5">
              {[null, 500, 1000, 2500, 5000, 10000].map((amt) => (
                <button
                  key={String(amt)}
                  onClick={() => onUpdate('amountMin', amt)}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-xs font-medium transition-all',
                    filters.amountMin === amt
                      ? 'border-[#6B0F1A] bg-[#6B0F1A]/5 text-[#6B0F1A]'
                      : 'border-input bg-background text-foreground hover:border-[#6B0F1A]/40'
                  )}
                >
                  {amt === null ? 'Any' : `$${amt.toLocaleString()}+`}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  )
}
