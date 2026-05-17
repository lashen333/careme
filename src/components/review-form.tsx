'use client'
 
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
 
interface ReviewFormProps {
  bookingId: string
  onSuccess?: () => void
}
 
export function ReviewForm({ bookingId, onSuccess }: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating, comment }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to submit review')
      }

      toast.success('Review submitted successfully!')
      setRating(0)
      setComment('')
      router.refresh()
      onSuccess?.()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
      <div className="space-y-2">
        <Label>Rate your experience</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              className="p-1 transition hover:scale-110"
              onMouseEnter={() => setHoveredRating(i)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(i)}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  (hoveredRating || rating) >= i
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comment (optional)</Label>
        <Textarea
          id="comment"
          placeholder="Share your feedback about the caregiver..."
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading || rating === 0}>
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
