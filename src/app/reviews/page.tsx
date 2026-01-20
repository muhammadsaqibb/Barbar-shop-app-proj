import ReviewsList from "@/components/reviews/reviews-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReviewsPage() {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Card className="shadow-lg border-border/20">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Client Reviews</CardTitle>
                    <CardDescription>See what our clients are saying about their experience.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ReviewsList />
                </CardContent>
            </Card>
        </div>
    );
}
