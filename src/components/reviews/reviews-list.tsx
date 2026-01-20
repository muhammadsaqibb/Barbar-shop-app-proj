'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Review } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import ReviewCard from './review-card';

export default function ReviewsList() {
  const { firestore } = useFirebase();

  const reviewsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'reviews'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: reviews, isLoading, error } = useCollection<Review>(reviewsQuery);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center">Failed to load reviews. Please try again later.</p>;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">There are no reviews yet.</p>
        <p className="text-sm text-muted-foreground mt-2">Be the first to leave a review after your appointment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
