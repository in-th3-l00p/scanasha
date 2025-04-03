import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitErrorHandler, SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
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
import { PlusIcon, TrashIcon } from 'lucide-react';
import { Card } from './ui/card';
import { Typography } from './ui/typography';
import { Stack } from './ui/stack';
import React, { ForwardedRef, forwardRef } from 'react';

const OptionSchema = z.object({
  value: z.string().min(1, {
    message: 'Option must be at least 1 character.',
  }),
});

const FormSchema = z.object({
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }),
  description: z.string().min(5, {
    message: 'Description must be at least 5 characters.',
  }),
  options: z.array(OptionSchema).min(2, {
    message: 'You must provide at least 2 options.',
  }),
});

type PollFormProps = {
  onSubmit?: SubmitHandler<z.infer<typeof FormSchema>>;
  hideSubmitButton?: boolean;
  isSubmitting?: boolean;
};

export type PollHandlerRefType = {
  getFormValues: () => Promise<z.infer<typeof FormSchema> | null>;
};

const PollForm = forwardRef<PollHandlerRefType, PollFormProps>(
  (
    { onSubmit, hideSubmitButton, isSubmitting }: PollFormProps,
    ref: ForwardedRef<PollHandlerRefType>,
  ) => {
    const formRef = React.useRef<HTMLFormElement>();

    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        title: '',
        description: '',
        options: [{ value: '' }, { value: '' }],
      },
    });

    const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
      name: 'options',
      control: form.control,
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

    const handleAddOption = () => {
      append({ value: '' });
    };

    return (
      <Card className="bg-nested-card rounded-3xl">
        <Stack direction="column" spacing={4}>
          <Typography variant="h5">Create a poll</Typography>
          <Form {...form}>
            <form
              onSubmit={onSubmit ? form.handleSubmit(onSubmit) : undefined}
              ref={formRef as React.RefObject<HTMLFormElement>}
              className="w-full space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Poll title</FormLabel>
                    <FormControl>
                      <Input placeholder="Poll title" {...field} />
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
                    <FormLabel required>Poll description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Poll description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  name={`options.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent={'between'}
                          spacing={3}
                        >
                          <Input className="" {...field} placeholder={`Option ${index + 1}`} />
                          {index > 1 && (
                            <Button
                              type="button"
                              variant="link"
                              onClick={() => remove(index)}
                              className="text-destructive"
                              asChild
                            >
                              <TrashIcon size={20} />
                            </Button>
                          )}
                        </Stack>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <Stack direction="column">
                <Button
                  type="button"
                  variant="link"
                  onClick={handleAddOption}
                  className="self-start"
                >
                  <PlusIcon className="h-4 w-4" /> Add option
                </Button>

                {!hideSubmitButton && (
                  <Button type="submit" className="self-end" disabled={isSubmitting}>
                    Create poll
                  </Button>
                )}
              </Stack>
            </form>
          </Form>
        </Stack>
      </Card>
    );
  },
);
export default PollForm;
