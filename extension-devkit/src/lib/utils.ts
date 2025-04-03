import { PollOption } from '@/api/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getOptionPercentage = (
  optionId: string,
  votesByOption: { option: PollOption; votesCount: number }[],
  total: number,
) => {
  if (!total) {
    return 0;
  }
  const optionVotes = votesByOption.find(item => item.option.id === optionId);
  const votesForOption = optionVotes?.votesCount || 0;
  return Math.round((votesForOption / total) * 100);
};
