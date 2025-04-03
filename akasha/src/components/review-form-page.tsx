import ReviewForm from '@/components/review-form';
import { createReview } from '../api';
import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Typography } from './ui/typography';
import { useNavigate } from '@tanstack/react-router';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { RocketIcon } from 'lucide-react';

const ReviewFormPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async reviewFormValues => {
    setIsSubmitting(true);
    setError(null);

    const res = await createReview(
      reviewFormValues.contractName,
      reviewFormValues.description,
      reviewFormValues.address
    );

    setIsSubmitting(false);

    if ('error' in res) {
      setError(res.error);
      return;
    }

    setSuccess(true);

    // Navigate to reviews list after 2 seconds
    setTimeout(() => {
      navigate({
        to: '/reviews',
      });
    }, 2000);
  };

  return (
    <>
      {error && (
        <Card className="mb-4 bg-destructive/10">
          <CardContent className="p-4">
            <Typography variant="sm" bold>
              Error submitting review: {error}
            </Typography>
          </CardContent>
        </Card>
      )}

      {success && (
        <Alert className="mb-4">
          <RocketIcon className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Your smart contract review request has been submitted.
            Redirecting to reviews list...
          </AlertDescription>
        </Alert>
      )}

      <p>hello world</p>
      <ReviewForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </>
  );
};

export default ReviewFormPage;
