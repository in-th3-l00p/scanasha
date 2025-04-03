'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  ProfileAvatar,
  ProfileAvatarFallback,
  ProfileAvatarImage,
} from '@/components/ui/profile-avatar';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';

const FeedCTA = ({
  avatarSrc,
  profileDID,
  cta,
  className,
  children,
  ...props
}: {
  avatarSrc: string;
  profileDID: string;
  cta: string;
} & React.ComponentProps<'div'>) => {
  return (
    <Card className={cn('border-border bg-nested-card p-4', className)} {...props}>
      <Stack direction="row" alignItems="center" justifyContent="between">
        <Stack direction="row" alignItems="center" spacing={2}>
          <ProfileAvatar profileDID={profileDID}>
            <ProfileAvatarImage src={avatarSrc} alt="Profile avatar" />
            <ProfileAvatarFallback />
          </ProfileAvatar>
          <Typography variant="xs" bold>
            {cta}
          </Typography>
        </Stack>
        {children}
      </Stack>
    </Card>
  );
};

export { FeedCTA };
