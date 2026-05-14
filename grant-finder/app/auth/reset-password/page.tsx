'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="text-xl font-black tracking-tight text-[#6B0F1A]" style={{ fontFamily: 'Inter, sans-serif' }}>
            URBAN GRANTROOTS
          </Link>
          <h1 className="text-2xl font-bold mt-3">Reset your password</h1>
          <p className="text-sm text-muted-foreground">
            {sent ? 'Check your inbox for a reset link.' : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {!sent ? (
          <div className="rounded-xl border border-[#A07830]/40 bg-[#FDF8EE] p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6B0F1A] hover:bg-[#8B1A28] text-white gap-2"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                Send Reset Link
              </Button>
            </form>
          </div>
        ) : (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-2">
            <Mail className="size-8 mx-auto text-green-600" />
            <p className="text-sm font-medium text-green-800">Reset link sent to {email}</p>
            <p className="text-xs text-green-700">Check your spam folder if you don&apos;t see it.</p>
          </div>
        )}

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-1.5 text-sm text-[#6B0F1A] hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      </div>
    </main>
  )
}
