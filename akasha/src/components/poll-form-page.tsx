import PollForm from '@/components/poll-form';
import { createPoll } from '../api';
import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { useNavigate } from '@tanstack/react-router';

const PollFormPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async pollFormValues => {
    const optionsWithIDs = pollFormValues.options.map((option, index) => ({
      id: index.toString(),
      name: option.value,
    }));
    setIsSubmitting(true);
    const res = await createPoll(pollFormValues.title, pollFormValues.description, optionsWithIDs);
    setIsSubmitting(false);
    if ('error' in res) {
      setError(res.error);
      return;
    }
    navigate({
      to: '/polls',
    });
  };

  return (
    <>
      {error && (
        <Card>
          <CardContent>Error saving poll. {error}</CardContent>
        </Card>
      )}
      <PollForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </>
  );
};

export default PollFormPage;
