import { Heart, Search, Calendar, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const steps = [
  {
    icon: Search,
    title: 'Browse caregivers',
    desc: 'View verified profiles with experience, qualifications, and certificates.',
  },
  {
    icon: Calendar,
    title: 'Book your care',
    desc: 'Select home or hospital care. Add ward/bed details for hospital stays.',
  },
  {
    icon: CheckCircle,
    title: 'Caregiver confirms',
    desc: 'Caregiver reviews and accepts or declines. You stay in control.',
  },
  {
    icon: Heart,
    title: 'Quality care delivered',
    desc: 'Your loved one receives professional, compassionate care.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">How Careme Works</h1>
      <p className="mt-2 text-slate-600">
        A simple, transparent process from booking to care delivery.
      </p>

      <div className="mt-12 space-y-8">
        {steps.map((step, i) => (
          <div key={step.title} className="flex gap-6">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <step.icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Step {i + 1}: {step.title}
              </h2>
              <p className="mt-1 text-slate-600">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <Button asChild size="lg">
          <Link href="/caregivers">Browse Caregivers</Link>
        </Button>
      </div>
    </div>
  )
}
