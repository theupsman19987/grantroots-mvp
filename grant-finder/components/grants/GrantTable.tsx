'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, Bookmark, BookmarkCheck } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Grant } from '@/lib/types'
import { formatAmountRange, formatDeadline, getDeadlineUrgency, cn } from '@/lib/utils'

interface GrantTableProps {
  grants: Grant[]
  isSaved: (id: string) => boolean
  onSave: (id: string) => void
  onUnsave: (id: string) => void
}

export function GrantTable({ grants, isSaved, onSave, onUnsave }: GrantTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<Grant>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
          Grant Title
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/grants/${row.original.id}`}
          className="font-medium text-sm hover:text-primary transition-colors max-w-xs block truncate"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: 'funder',
      header: 'Funder',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.funder}</span>
      ),
    },
    {
      accessorKey: 'funderType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize text-xs">
          {row.original.funderType}
        </Badge>
      ),
    },
    {
      id: 'amount',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
          Amount
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      accessorFn: (row) => row.amountMax,
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {formatAmountRange(row.original.amountMin, row.original.amountMax)}
        </span>
      ),
    },
    {
      accessorKey: 'deadline',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
          Deadline
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const urgency = getDeadlineUrgency(row.original.deadline)
        return (
          <span
            className={cn(
              'text-sm whitespace-nowrap',
              urgency === 'critical' && 'text-destructive font-medium',
              urgency === 'warning' && 'text-amber-600 dark:text-amber-400 font-medium'
            )}
          >
            {formatDeadline(row.original.deadline)}
          </span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const saved = isSaved(row.original.id)
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={saved ? 'Unsave' : 'Save'}
              onClick={() => (saved ? onUnsave(row.original.id) : onSave(row.original.id))}
            >
              {saved ? (
                <BookmarkCheck className="size-3.5 text-primary" />
              ) : (
                <Bookmark className="size-3.5" />
              )}
            </Button>
            <Button
              nativeButton={false}
              render={<Link href={`/grants/${row.original.id}`} />}
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
            >
              View
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: grants,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
                No grants match your filters.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
