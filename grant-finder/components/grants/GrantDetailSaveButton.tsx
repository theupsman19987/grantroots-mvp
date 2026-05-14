'use client'

import { Bookmark, BookmarkCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useSavedGrants } from '@/hooks/useSavedGrants'

export function GrantDetailSaveButton({ grantId }: { grantId: string }) {
  const { isSaved, saveGrant, unsaveGrant } = useSavedGrants()
  const saved = isSaved(grantId)

  const handleClick = () => {
    if (saved) {
      unsaveGrant(grantId)
      toast('Grant removed from saved.')
    } else {
      saveGrant(grantId)
      toast.success('Grant saved!', {
        description: 'Find it in My Grants dashboard.',
      })
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleClick}
      className={
        saved
          ? 'bg-[#6B0F1A] text-white hover:bg-[#8B1A28] border-transparent'
          : 'border border-[#A07830] text-[#6B0F1A] bg-transparent hover:bg-[#F5E6E8]'
      }
    >
      {saved ? (
        <>
          <BookmarkCheck className="size-4 mr-1.5" />
          Saved
        </>
      ) : (
        <>
          <Bookmark className="size-4 mr-1.5" />
          Save Grant
        </>
      )}
    </Button>
  )
}
