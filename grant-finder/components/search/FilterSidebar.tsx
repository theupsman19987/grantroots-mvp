'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { GrantFilters, FunderType, ApplicantType } from '@/lib/types'
import { useFilterCounts } from '@/hooks/useFilterCounts'
import { cn } from '@/lib/utils'

interface FilterSidebarProps {
  filters: GrantFilters
  onUpdate: <K extends keyof GrantFilters>(key: K, value: GrantFilters[K]) => void
  onToggleFunderType: (type: FunderType) => void
  onToggleApplicant: (type: ApplicantType) => void
  onToggleFocusArea: (area: string) => void
  onToggleAgency: (agency: string) => void
  onReset: () => void
  activeFilterCount: number
  onGuestClick?: () => void
}

export function FilterSidebar({
  filters,
  onUpdate,
  onToggleFunderType,
  onToggleApplicant,
  onToggleFocusArea,
  onToggleAgency,
  onReset,
  activeFilterCount,
  onGuestClick,
}: FilterSidebarProps) {
  const gate = (action: () => void) => {
    if (onGuestClick) { onGuestClick(); return }
    action()
  }
  const { focusAreas, applicants, agencies, loading } = useFilterCounts()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => gate(onReset)} className="h-7 text-xs">
            Reset all
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="open-only"
            checked={filters.isOpenOnly}
            onCheckedChange={(v) => gate(() => onUpdate('isOpenOnly', v))}
          />
          <Label htmlFor="open-only" className="text-sm cursor-pointer">
            Open grants only
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="include-archived"
            checked={filters.includeArchived}
            onCheckedChange={(v) => gate(() => onUpdate('includeArchived', v))}
          />
          <Label htmlFor="include-archived" className="text-sm cursor-pointer">
            Include closed/archived
          </Label>
        </div>
      </div>

      <Separator />

      <Accordion defaultValue={['applicant', 'focus', 'agency']} className="w-full">
        <AccordionItem value="funder">
          <AccordionTrigger className="text-sm font-medium py-3">
            Grant Source
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center gap-2 pb-1">
              <Checkbox id="funder-government" checked disabled />
              <Label htmlFor="funder-government" className="text-sm font-normal">
                Federal Grants
              </Label>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="applicant">
          <AccordionTrigger className="text-sm font-medium py-3">
            Eligible Applicants
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2.5 pb-1">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))
                : applicants.map(({ value, label, count }) => {
                    const isEmpty = count === 0
                    return (
                      <div
                        key={value}
                        className={cn(
                          'flex items-center justify-between gap-2',
                          isEmpty && 'opacity-40'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Checkbox
                            id={`app-${value}`}
                            checked={filters.eligibleApplicants.includes(value)}
                            onCheckedChange={() => gate(() => !isEmpty && onToggleApplicant(value))}
                            disabled={isEmpty}
                          />
                          <Label
                            htmlFor={`app-${value}`}
                            className={cn(
                              'text-sm font-normal leading-none',
                              isEmpty ? 'cursor-default' : 'cursor-pointer'
                            )}
                          >
                            {label}
                          </Label>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                          {count}
                        </span>
                      </div>
                    )
                  })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="amount">
          <AccordionTrigger className="text-sm font-medium py-3">
            Funding Amount
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={
                filters.amountMax === 50000
                  ? 'small'
                  : filters.amountMax === 250000
                  ? 'medium'
                  : filters.amountMin === 250000
                  ? 'large'
                  : 'any'
              }
              onValueChange={(v) => gate(() => {
                if (v === 'any') {
                  onUpdate('amountMin', null)
                  onUpdate('amountMax', null)
                } else if (v === 'small') {
                  onUpdate('amountMin', null)
                  onUpdate('amountMax', 50000)
                } else if (v === 'medium') {
                  onUpdate('amountMin', null)
                  onUpdate('amountMax', 250000)
                } else if (v === 'large') {
                  onUpdate('amountMin', 250000)
                  onUpdate('amountMax', null)
                }
              })}
              className="flex flex-col gap-2.5 pb-1"
            >
              {[
                { value: 'any',    label: 'Any amount' },
                { value: 'small',  label: 'Up to $50K' },
                { value: 'medium', label: 'Up to $250K' },
                { value: 'large',  label: '$250K+' },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`amt-${opt.value}`} />
                  <Label htmlFor={`amt-${opt.value}`} className="text-sm cursor-pointer font-normal">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="focus">
          <AccordionTrigger className="text-sm font-medium py-3">
            Focus Area
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-52">
              <div className="flex flex-col gap-2.5 pb-1 pr-3">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))
                  : focusAreas.map(({ name, count }) => {
                      const isEmpty = count === 0
                      return (
                        <div
                          key={name}
                          className={cn(
                            'flex items-center justify-between gap-2',
                            isEmpty && 'opacity-40'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Checkbox
                              id={`area-${name}`}
                              checked={filters.focusAreas.includes(name)}
                              onCheckedChange={() => gate(() => !isEmpty && onToggleFocusArea(name))}
                              disabled={isEmpty}
                            />
                            <Label
                              htmlFor={`area-${name}`}
                              className={cn(
                                'text-sm font-normal leading-none',
                                isEmpty ? 'cursor-default' : 'cursor-pointer'
                              )}
                            >
                              {name}
                            </Label>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                            {count}
                          </span>
                        </div>
                      )
                    })}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="agency" className="border-b-0">
          <AccordionTrigger className="text-sm font-medium py-3">
            Federal Agency
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-52">
              <div className="flex flex-col gap-2.5 pb-1 pr-3">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))
                  : agencies.length === 0
                  ? (
                    <p className="text-xs text-muted-foreground">No agencies found</p>
                  )
                  : agencies.map(({ name, count }) => (
                      <div
                        key={name}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Checkbox
                            id={`agency-${name}`}
                            checked={filters.agencies.includes(name)}
                            onCheckedChange={() => gate(() => onToggleAgency(name))}
                          />
                          <Label
                            htmlFor={`agency-${name}`}
                            className="text-sm font-normal leading-snug cursor-pointer"
                            title={name}
                          >
                            {name.length > 30 ? name.slice(0, 28) + '…' : name}
                          </Label>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                          {count}
                        </span>
                      </div>
                    ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
