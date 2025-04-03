import ContractForm from '@/components/contract-form';
import { createContract } from '../api';
import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Typography } from './ui/typography';
import { useNavigate } from '@tanstack/react-router';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { RocketIcon } from 'lucide-react';
import { useAkashaStore } from '@akashaorg/ui-core-hooks';

const ContractFormPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    data: { authenticatedDID },
  } = useAkashaStore();

  const navigate = useNavigate();

  const handleSubmit = async contractFormValues => {
    setIsSubmitting(true);
    setError(null);

    const res = await createContract(
      contractFormValues.contractName,
      contractFormValues.description,
      contractFormValues.address,
      authenticatedDID,
    );
    console.log(res);

    setIsSubmitting(false);

    if ('error' in res) {
      setError(res.error);
      return;
    }

    setSuccess(true);

    // Navigate to reviews list after 2 seconds
    setTimeout(() => {
      navigate({
        to: '/contracts',
      });
    }, 2000);
  };

  return (
    <>
      {error && (
        <Card className="mb-4 bg-destructive/10">
          <CardContent className="p-4">
            <Typography variant="sm" bold>
              Error submitting contract: {error}
            </Typography>
          </CardContent>
        </Card>
      )}

      {success && (
        <Alert className="mb-4">
          <RocketIcon className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Your smart contract has been added.
            Redirecting to contracts list...
          </AlertDescription>
        </Alert>
      )}

      <ContractForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </>
  );
};

export default ContractFormPage;
