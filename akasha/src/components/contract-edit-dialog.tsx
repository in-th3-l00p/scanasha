import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Contract } from '@/api/types';
import { updateContract } from '@/api';
import { Card } from './ui/card';
import { Stack } from './ui/stack';

// Ethereum address validation regex
const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const FormSchema = z.object({
  contractName: z.string().min(3, {
    message: 'Contract name must be at least 3 characters.',
  }),
  description: z.string().min(5, {
    message: 'Description must be at least 5 characters.',
  }),
  address: z
    .string()
    .regex(ethAddressRegex, {
      message: 'Please enter a valid Ethereum address (0x...)',
    }),
  status: z.enum(['pending', 'in_progress', 'completed']),
});

type FormValues = z.infer<typeof FormSchema>;

export interface ContractEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
  onSuccess?: () => void;
}

export const ContractEditDialog: React.FC<ContractEditDialogProps> = ({
  open,
  onOpenChange,
  contract,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      contractName: contract.contractName,
      description: contract.description || '',
      address: contract.address,
      status: contract.status,
    },
  });

  // Reset form when contract changes
  useEffect(() => {
    if (open) {
      form.reset({
        contractName: contract.contractName,
        description: contract.description || '',
        address: contract.address,
        status: contract.status,
      });
    }
  }, [contract, open, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateContract(contract.id, {
        contractName: values.contractName,
        description: values.description,
        address: values.address,
        status: values.status,
      });

      if ('error' in result) {
        setError(result.error);
      } else {
        if (onSuccess) {
          onSuccess();
        }
        onOpenChange(false);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Typography variant="h4">Edit Contract</Typography>
          </DialogTitle>
          <Typography variant="sm" className="text-muted-foreground mt-2">
            Update the contract details
          </Typography>
        </DialogHeader>

        {error && (
          <Card className="bg-destructive/10">
            <div className="p-4">
              <Typography variant="sm" bold>
                Error updating contract: {error}
              </Typography>
            </div>
          </Card>
        )}

        <Card className="bg-nested-card rounded-3xl">
          <Stack direction="column" spacing={4}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
                <FormField
                  control={form.control}
                  name="contractName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Contract Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contract name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Contract Address</FormLabel>
                      <FormControl>
                        <Input placeholder="0x..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this smart contract does" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Status</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </Stack>
        </Card>
      </DialogContent>
    </Dialog>
  );
}; 