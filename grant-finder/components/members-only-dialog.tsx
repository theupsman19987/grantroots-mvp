'use client'

import { useRouter } from 'next/navigation'
import { Lock, UserPlus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MembersOnlyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MembersOnlyDialog({ open, onOpenChange }: MembersOnlyDialogProps) {
  const router = useRouter()

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center gap-3">
          <div className="mx-auto rounded-full bg-[#6B0F1A]/10 p-4">
            <Lock className="size-7 text-[#6B0F1A]" />
          </div>
          <DialogTitle className="text-xl font-bold text-[#6B0F1A]">
            Members Only
          </DialogTitle>
          <DialogDescription>
            This feature is for registered members only. Sign up free to search grants,
            save opportunities, and track your applications.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          <Button
            className="w-full bg-[#6B0F1A] hover:bg-[#8B1A28] text-white gap-2 h-10"
            onClick={() => go('/auth/signup')}
          >
            <UserPlus className="size-4" />
            Create Free Account
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2 h-10 border border-[#6B0F1A]/30 text-[#6B0F1A] hover:bg-[#6B0F1A]/10 hover:text-[#6B0F1A]"
            onClick={() => go('/auth/login')}
          >
            <LogIn className="size-4" />
            Sign In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
