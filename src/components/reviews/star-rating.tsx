'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  className?: string;
  starClassName?: string;
}

export default function StarRating({ rating, totalStars = 5, className, starClassName }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: totalStars }, (_, i) => {
        const starNumber = i + 1;
        return (
          <Star
            key={i}
            className={cn(
              'h-5 w-5',
              starNumber <= rating ? 'text-primary fill-primary' : 'text-muted-foreground/30',
              starClassName
            )}
          />
        );
      })}
    </div>
  );
}
