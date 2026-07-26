import { InternalErrorImpactItem } from '@activepieces/shared';
import { t } from 'i18next';
import { CircleCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

type InternalErrorsTableProps = {
  internalErrors: InternalErrorImpactItem[] | undefined;
  isLoading: boolean;
};

export function InternalErrorsTable({
  internalErrors,
  isLoading,
}: InternalErrorsTableProps) {
  const navigate = useNavigate();
  const errors = internalErrors ?? [];
  const total = errors.reduce((sum, error) => sum + error.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-medium">
          <span>{t('Internal errors — impact')}</span>
          {total > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              {t('{count} errors', { count: total })}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {t(
            'Internal errors are failures inside Plugr itself (engine or worker), not in your flow logic. Grouped by the project and flow they affected.',
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : errors.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <CircleCheck className="size-8 text-emerald-500" />
            <p className="text-sm">{t('No internal errors in this period')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {errors.map((error) => (
                <button
                  key={`${error.projectId}-${error.flowId}-mobile`}
                  type="button"
                  className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                  onClick={() =>
                    navigate(
                      `/projects/${error.projectId}/runs?flowId=${error.flowId}`,
                    )
                  }
                >
                  <div className="flex min-h-14 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {t('Flow')}
                      </p>
                      <p className="truncate text-sm font-medium">
                        {error.flowName}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t('Project')}
                      </p>
                      <p className="truncate text-sm">{error.projectName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">
                        {t('Errors')}
                      </p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatUtils.formatNumber(error.count)}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t('Share')}
                      </p>
                      <p className="text-sm tabular-nums">
                        {total === 0
                          ? '\u2014'
                          : `${Math.round((error.count / total) * 100)}%`}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Project')}</TableHead>
                    <TableHead>{t('Flow')}</TableHead>
                    <TableHead className="text-right">{t('Errors')}</TableHead>
                    <TableHead className="text-right">{t('Share')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.map((error) => (
                    <TableRow
                      key={`${error.projectId}-${error.flowId}`}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/projects/${error.projectId}/runs?flowId=${error.flowId}`,
                        )
                      }
                    >
                      <TableCell className="text-muted-foreground">
                        {error.projectName}
                      </TableCell>
                      <TableCell className="font-medium">
                        {error.flowName}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatUtils.formatNumber(error.count)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {total === 0
                          ? '—'
                          : `${Math.round((error.count / total) * 100)}%`}
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
