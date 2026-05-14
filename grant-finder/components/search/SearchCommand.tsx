'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useGrants } from '@/hooks/useGrants'
import { formatAmountRange } from '@/lib/utils'
import { BorderBeam } from '@/components/ui/border-beam'

const FOCUS_AREAS = ['Arts', 'Education', 'Health', 'Environment', 'Research', 'Small Business', 'Technology', 'Housing']

interface SearchCommandProps {
  compact?: boolean
  glass?: boolean
  gold?: boolean
}

export function SearchCommand({ compact = false, glass = false, gold = false }: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { grants, loading } = useGrants()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const filteredGrants = query.length > 1
    ? grants.filter((g) =>
        g.title.toLowerCase().includes(query.toLowerCase()) ||
        g.funder.toLowerCase().includes(query.toLowerCase()) ||
        g.focusAreas.some((a) => a.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 5)
    : []

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router]
  )

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      setOpen(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }, [query, router])

  if (compact) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 rounded-md border border-input bg-muted/50 px-3 h-9 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="flex-1 text-left">Search grants...</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
        <SearchDialog open={open} setOpen={setOpen} query={query} setQuery={setQuery} filteredGrants={filteredGrants} loading={loading} handleSelect={handleSelect} handleSearch={handleSearch} />
      </>
    )
  }

  if (gold) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-[#800020]/30 bg-[#D4B86A] px-4 h-14 text-base text-[#800020] hover:bg-[#C9A84C] transition-all shadow-sm"
        >
          <Search className="size-5 shrink-0 text-[#800020]/70" />
          <span className="flex-1 text-left text-[#800020]/70">Search grants by keyword, funder, or focus area...</span>
          <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border border-[#800020]/20 bg-[#800020]/10 px-2 text-xs font-medium text-[#800020]/60">
            ⌘K
          </kbd>
        </button>
        <SearchDialog open={open} setOpen={setOpen} query={query} setQuery={setQuery} filteredGrants={filteredGrants} loading={loading} handleSelect={handleSelect} handleSearch={handleSearch} />
      </>
    )
  }

  if (glass) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-white/30 bg-white/15 backdrop-blur-md px-4 h-14 text-base text-white/80 hover:bg-white/25 hover:border-white/50 transition-all shadow-lg"
        >
          <Search className="size-5 shrink-0 text-white/70" />
          <span className="flex-1 text-left">Search grants by keyword, funder, or focus area...</span>
          <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border border-white/30 bg-white/10 px-2 text-xs font-medium text-white/60">
            ⌘K
          </kbd>
        </button>
        <SearchDialog open={open} setOpen={setOpen} query={query} setQuery={setQuery} filteredGrants={filteredGrants} loading={loading} handleSelect={handleSelect} handleSearch={handleSearch} />
      </>
    )
  }

  return (
    <>
      <div className="relative w-full rounded-xl">
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border-2 border-input bg-background px-4 h-14 text-base text-muted-foreground hover:border-primary/50 transition-colors shadow-sm"
        >
          <Search className="size-5 shrink-0" />
          <span className="flex-1 text-left">Search grants by keyword, funder, or focus area...</span>
          <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 text-xs font-medium">
            ⌘K
          </kbd>
        </button>
        <BorderBeam colorFrom="#C9A84C" colorTo="#6B0F1A" size={80} duration={4} borderWidth={2} />
      </div>
      <SearchDialog open={open} setOpen={setOpen} query={query} setQuery={setQuery} filteredGrants={filteredGrants} loading={loading} handleSelect={handleSelect} handleSearch={handleSearch} />
    </>
  )
}

function SearchDialog({
  open,
  setOpen,
  query,
  setQuery,
  filteredGrants,
  loading,
  handleSelect,
  handleSearch,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  query: string
  setQuery: (v: string) => void
  filteredGrants: { id: string; title: string; funder: string; amountMin: number; amountMax: number }[]
  loading: boolean
  handleSelect: (href: string) => void
  handleSearch: () => void
}) {
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search grants, funders, focus areas..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center">
            {loading ? (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Loading grants...
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">No results for &ldquo;{query}&rdquo;</p>
                {query.trim() && (
                  <button onClick={handleSearch} className="text-sm text-primary hover:underline">
                    Search all grants for &ldquo;{query}&rdquo; →
                  </button>
                )}
              </>
            )}
          </div>
        </CommandEmpty>

        {query.length > 1 && filteredGrants.length > 0 && (
          <CommandGroup heading="Matching Grants">
            {filteredGrants.map((grant) => (
              <CommandItem
                key={grant.id}
                onSelect={() => handleSelect(`/grants/${grant.id}`)}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <span className="font-medium text-sm line-clamp-1">{grant.title}</span>
                <span className="text-xs text-muted-foreground">
                  {grant.funder} · {formatAmountRange(grant.amountMin, grant.amountMax)}
                </span>
              </CommandItem>
            ))}
            {query.trim() && (
              <CommandItem onSelect={handleSearch} className="text-primary">
                <Search className="size-3.5 mr-2" />
                Search all grants for "{query}"
              </CommandItem>
            )}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Browse by Category">
          {FOCUS_AREAS.map((area) => (
            <CommandItem
              key={area}
              onSelect={() => handleSelect(`/search?area=${encodeURIComponent(area)}`)}
            >
              <Search className="size-3.5 mr-2 text-muted-foreground" />
              {area} Grants
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Links">
          <CommandItem onSelect={() => handleSelect('/search?isOpen=true')}>
            Open grants only
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/search?urgency=closing')}>
            Closing soon (14 days)
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/funders')}>
            Browse funders
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
