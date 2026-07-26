import { StuckJob } from '@activepieces/shared';
import { t } from 'i18next';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatUtils } from '@/lib/format-utils';

type StuckJobsTableProps = {
  stuckJobs: StuckJob[] | undefined;
  isLoading: boolean;
};

export function StuckJobsTable({ stuckJobs, isLoading }: StuckJobsTableProps) {
  const navigate = useNavigate();
  const jobs = stuckJobs ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          {t('Stuck jobs')}
          {jobs.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <TriangleAlert className="size-3" />
              {t('{count} stuck', { count: jobs.length })}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <CircleCheck className="size-8 text-emerald-500" />
            <p className="text-sm">{t('No stuck jobs')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {jobs.map((job) => (
                <button
                  key={`${job.flowRunId}-mobile`}
                  type="button"
                  className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                  onClick={() =>
                    navigate(`/projects/${job.projectId}/runs/${job.flowRunId}`)
                  }
                >
                  <div className="flex min-h-14 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {t('Flow')}
                      </p>
                      <p className="truncate text-sm font-medium">
                        {job.flowName}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t('Project')}
                      </p>
                      <p className="truncate text-sm">{job.projectName}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {formatUtils.convertEnumToHumanReadable(job.status)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Flow')}</TableHead>
                    <TableHead>{t('Project')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow
                      key={job.flowRunId}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/projects/${job.projectId}/runs/${job.flowRunId}`,
                        )
                      }
                    >
                      <TableCell className="font-medium">
                        {job.flowName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {job.projectName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatUtils.convertEnumToHumanReadable(job.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
