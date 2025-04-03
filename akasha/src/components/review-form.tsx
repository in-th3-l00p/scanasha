import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
import { Card } from './ui/card';
import { Typography } from './ui/typography';
import { Stack } from './ui/stack';
import React, { ForwardedRef, forwardRef } from 'react';

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
});

type ReviewFormProps = {
  onSubmit?: SubmitHandler<z.infer<typeof FormSchema>>;
  hideSubmitButton?: boolean;
  isSubmitting?: boolean;
};

export type ReviewHandlerRefType = {
  getFormValues: () => Promise<z.infer<typeof FormSchema> | null>;
};

const ReviewForm = forwardRef<ReviewHandlerRefType, ReviewFormProps>(
  (
    { onSubmit, hideSubmitButton, isSubmitting }: ReviewFormProps,
    ref: ForwardedRef<ReviewHandlerRefType>,
  ) => {
    const formRef = React.useRef<HTMLFormElement>();

    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        contractName: '',
        description: '',
        address: '',
      },
    });

    React.useImperativeHandle(
      ref,
      () => ({
        getFormValues: async () => {
          const isValid = await form.trigger();
          if (isValid) {
            return form.getValues();
          }
          return null;
        },
      }),
      [form],
    );

    return (
      <Card className="bg-nested-card rounded-3xl">
        <Stack direction="column" spacing={4}>
          <Typography variant="h5">Create Smart Contract Review</Typography>
          <Form {...form}>
            <form
              onSubmit={onSubmit ? form.handleSubmit(onSubmit) : undefined}
              ref={formRef as React.RefObject<HTMLFormElement>}
              className="w-full space-y-4"
            >
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
                        placeholder="Describe what this smart contract does and why you want it reviewed" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!hideSubmitButton && (
                <Button type="submit" className="self-end w-full" disabled={isSubmitting}>
                  Start Review Process
                </Button>
              )}
            </form>
          </Form>
        </Stack>
      </Card>
    );
  },
);

export default ReviewForm; 