'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const DuplexButtonContext = React.createContext<{
  active: boolean;
  size: React.ComponentProps<typeof Button>['size'];
  loading?: boolean;
  disabled?: boolean;
} | null>(null);

const useDuplexButtonContext = () => {
  const context = React.useContext(DuplexButtonContext);
  if (!context) {
    throw new Error('`useDuplexButtonContext` must be used within `DuplexButton`');
  }
  return context;
};

const DuplexButton = ({
  size = 'default',
  active,
  loading,
  disabled,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  active: boolean;
  size?: React.ComponentProps<typeof Button>['size'];
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <DuplexButtonContext.Provider
      value={{
        active,
        size,
        loading,
        disabled,
      }}
    >
      <div
        data-slot="duplex-button"
        className={cn('group/duplex-button [&_button]:w-full space-2', className)}
        {...props}
      >
        {children}
      </div>
    </DuplexButtonContext.Provider>
  );
};

const DuplexButtonActive = ({
  className,
  ...props
}: React.ComponentProps<'button'> & React.ComponentProps<typeof Button>) => {
  const { active, loading, disabled, size } = useDuplexButtonContext();
  if (!active) return;
  return (
    <Button
      data-slot="duplex-button-active"
      loading={loading}
      disabled={disabled}
      size={size}
      className={cn(
        {
          'group-hover/duplex-button:hidden': !loading && !disabled,
        },
        className,
      )}
      {...props}
    />
  );
};

const DuplexButtonHover = ({
  className,
  ...props
}: React.ComponentProps<'button'> & React.ComponentProps<typeof Button>) => {
  const { active, loading, disabled, size } = useDuplexButtonContext();
  if (loading || disabled || !active) return;
  return (
    <Button
      data-slot="duplex-button-hover"
      size={size}
      className={cn(
        'hidden group-hover/duplex-button:flex border border-destructive text-destructive bg-transparent hover:bg-transparent',
        className,
      )}
      {...props}
    />
  );
};

const DuplexButtonInactive = (
  props: React.ComponentProps<'button'> & React.ComponentProps<typeof Button>,
) => {
  const { active, loading, disabled, size } = useDuplexButtonContext();
  if (active) return;
  return (
    <Button
      data-slot="duplex-button-inactive"
      size={size}
      loading={loading}
      disabled={disabled}
      {...props}
    />
  );
};

export { DuplexButton, DuplexButtonActive, DuplexButtonHover, DuplexButtonInactive };
