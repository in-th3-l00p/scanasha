import { Progress } from '@/components/ui/progress';
import { Stack } from "../ui/stack";
import { Typography } from "../ui/typography";
import { Check } from "lucide-react";
import { Badge } from "../ui/badge";

export const Option = ({
  value,
  percentage,
  selected,
  onSelected,
  canVote = true,
  ...props
}: React.ComponentProps<typeof Stack> & {
  value: string;
  percentage: number;
  selected: boolean;
  canVote?: boolean;
  onSelected: (selected: boolean) => void;
}) => {
  return (
    <Stack spacing={1} className="mb-4" {...props}>
      <Typography variant="sm" bold>
        {value}
      </Typography>
      <Stack direction="row" alignItems="center" justifyContent="between" spacing={2}>
        <Stack direction="row" spacing={2} className="w-full">
          <Progress value={percentage} className="w-[75%]" />
          <Typography variant="xs" className="text-muted-foreground">
            ({percentage})%
          </Typography>
        </Stack>
        {selected ? (
          <Badge className="cursor-pointer w-[88px]">
            <Check /> Selected
          </Badge>
        ) : (
          <Badge
            variant="outline"
            title={canVote ? '' : 'You need to re-login to be able to vote'}
            onClick={() => {
              if (canVote) {
                onSelected(true);
              }
            }}
            className="cursor-pointer w-[88px]"
          >
            Select
          </Badge>
        )}
      </Stack>
    </Stack>
  );
};