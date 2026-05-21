import { NextResponse } from 'next/server'
import { SCHOLARSHIPS } from '@/lib/data/scholarships'

export async function GET() {
  return NextResponse.json(SCHOLARSHIPS.map((s) => ({
    ...s,
    deadline: s.deadline ? s.deadline.toISOString() : null,
  })))
}
