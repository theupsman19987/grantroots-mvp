'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, CheckCircle, GraduationCap, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
  'Washington DC',
]

const FIELDS_OF_STUDY = [
  'Accounting','Architecture','Arts & Design','Biology','Business Administration',
  'Chemistry','Communications','Computer Science','Construction','Criminal Justice',
  'Culinary Arts','Cybersecurity','Data Science','Dental','Early Childhood Education',
  'Economics','Education','Electrical Technology','Engineering','Environmental Science',
  'Finance','Graphic Design','Healthcare Administration','HVAC','Information Technology',
  'Law','Liberal Arts','Marketing','Mathematics','Mechanical Technology','Medicine',
  'Nursing','Paralegal','Pharmacy','Plumbing & Pipefitting','Political Science',
  'Psychology','Public Health','Public Policy','Social Work','Sociology',
  'Theology / Ministry','Veterinary','Welding','Other',
]

type AccountType = 'student' | 'organization' | ''
type SchoolType = 'college' | 'trade' | ''

export default function SignupPage() {
  const router = useRouter()

  // Core fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('')

  // Student-only fields
  const [schoolType, setSchoolType] = useState<SchoolType>('')
  const [gpa, setGpa] = useState('')
  const [fieldOfStudy, setFieldOfStudy] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!accountType) {
      setError('Please select an account type.')
      return
    }
    if (accountType === 'student' && !schoolType) {
      setError('Please select your school type.')
      return
    }
    setLoading(true)
    setError(null)

    const metadata: Record<string, string | null> = {
      account_type: accountType,
      state: state || null,
    }

    if (accountType === 'student') {
      metadata.school_type = schoolType || null
      metadata.gpa = gpa || null
      metadata.field_of_study = fieldOfStudy || null
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        data: metadata,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <CheckCircle className="size-12 mx-auto text-green-500" />
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="text-xl font-black tracking-tight text-[#6B0F1A]" style={{ fontFamily: 'Inter, sans-serif' }}>
            URBAN GRANTROOTS
          </Link>
          <h1 className="text-2xl font-bold mt-3">Create your account</h1>
          <p className="text-sm text-muted-foreground">Free forever. No credit card required.</p>
        </div>

        <div className="rounded-xl border border-[#A07830]/40 bg-[#FDF8EE] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Account Type */}
            <div className="space-y-2">
              <Label>I am a…</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('student')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all',
                    accountType === 'student'
                      ? 'border-[#6B0F1A] bg-[#6B0F1A]/5 text-[#6B0F1A]'
                      : 'border-input bg-background text-foreground hover:border-[#6B0F1A]/40'
                  )}
                >
                  <GraduationCap className={cn('size-7', accountType === 'student' ? 'text-[#6B0F1A]' : 'text-muted-foreground')} />
                  <span>Student</span>
                  <span className="text-xs font-normal text-muted-foreground text-center leading-tight">
                    Scholarships &amp; grants for school
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType('organization')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all',
                    accountType === 'organization'
                      ? 'border-[#6B0F1A] bg-[#6B0F1A]/5 text-[#6B0F1A]'
                      : 'border-input bg-background text-foreground hover:border-[#6B0F1A]/40'
                  )}
                >
                  <Building2 className={cn('size-7', accountType === 'organization' ? 'text-[#6B0F1A]' : 'text-muted-foreground')} />
                  <span>Organization</span>
                  <span className="text-xs font-normal text-muted-foreground text-center leading-tight">
                    Nonprofit, community, or faith-based
                  </span>
                </button>
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <Label htmlFor="state">
                Your State <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <select
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#6B0F1A]/30 focus:border-[#6B0F1A] text-foreground"
              >
                <option value="">Select your state…</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                We&apos;ll show {accountType === 'student' ? 'scholarships' : 'grants'} relevant to your area by default.
              </p>
            </div>

            {/* Student-only fields */}
            {accountType === 'student' && (
              <div className="space-y-4 pt-1 border-t border-[#A07830]/30">
                <p className="text-xs font-semibold text-[#6B0F1A] uppercase tracking-wide pt-1">Student Details</p>

                {/* School Type */}
                <div className="space-y-2">
                  <Label>School Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSchoolType('college')}
                      className={cn(
                        'rounded-lg border-2 py-2.5 text-sm font-medium transition-all',
                        schoolType === 'college'
                          ? 'border-[#6B0F1A] bg-[#6B0F1A]/5 text-[#6B0F1A]'
                          : 'border-input bg-background text-foreground hover:border-[#6B0F1A]/40'
                      )}
                    >
                      🎓 College / University
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchoolType('trade')}
                      className={cn(
                        'rounded-lg border-2 py-2.5 text-sm font-medium transition-all',
                        schoolType === 'trade'
                          ? 'border-[#6B0F1A] bg-[#6B0F1A]/5 text-[#6B0F1A]'
                          : 'border-input bg-background text-foreground hover:border-[#6B0F1A]/40'
                      )}
                    >
                      🔧 Trade / Vocational
                    </button>
                  </div>
                </div>

                {/* GPA */}
                <div className="space-y-1.5">
                  <Label htmlFor="gpa">
                    GPA <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="gpa"
                    type="number"
                    min="0"
                    max="4.0"
                    step="0.1"
                    placeholder="e.g. 3.5"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Helps us match scholarships with GPA requirements.</p>
                </div>

                {/* Field of Study */}
                <div className="space-y-1.5">
                  <Label htmlFor="field">
                    Field of Study <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <select
                    id="field"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#6B0F1A]/30 focus:border-[#6B0F1A] text-foreground"
                  >
                    <option value="">Select your field…</option>
                    {FIELDS_OF_STUDY.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6B0F1A] hover:bg-[#8B1A28] text-white gap-2"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#6B0F1A] font-medium hover:underline">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our{' '}
          <Link href="/about" className="hover:underline">terms of use</Link>.
        </p>
      </div>
    </main>
  )
}
