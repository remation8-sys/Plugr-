import { t } from 'i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authenticationSession } from '@/lib/authentication-session';

import { McpCredentials } from './mcp-credentials';
import { McpFlows } from './mcp-flows';
import { McpTools } from './mcp-tools';
import { mcpHooks } from './utils/mcp-hooks';

export const McpServerSettings = () => {
  const currentProjectId = authenticationSession.getProjectId();
  const { data: mcpServer, isLoading } = mcpHooks.useMcpServer(
    currentProjectId!,
  );
  const { mutate: updateMcpServer, isPending: isUpdating } =
    mcpHooks.useUpdateMcpServer(currentProjectId!);

  if (isLoading) {
    return (
      <div aria-busy="true" className="w-full space-y-5 py-6" role="status">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full mt-4">
      {mcpServer && (
        <Tabs defaultValue="connection">
          <TabsList>
            <TabsTrigger value="connection">{t('Connection')}</TabsTrigger>
            <TabsTrigger value="tools">{t('Tools')}</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="mt-4 pb-6" tabIndex={-1}>
            <McpCredentials />
          </TabsContent>

          <TabsContent
            value="tools"
            className="mt-4 space-y-6 pb-6"
            tabIndex={-1}
          >
            <div>
              <h3 className="font-semibold text-base mb-1">
                {t('Internal Tools')}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t(
                  'Control which built-in Plugr tools are available to agents via this MCP server.',
                )}
              </p>
              <McpTools
                disabledTools={mcpServer.disabledTools}
                isPending={isUpdating}
                onUpdateDisabledTools={(tools) =>
                  updateMcpServer({ disabledTools: tools })
                }
              />
            </div>

            <div>
              <h3 className="font-semibold text-base mb-1">
                {t('Your Flows')}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t(
                  'Flows with the MCP Trigger are exposed as tools on this server.',
                )}
              </p>
              <McpFlows mcpServer={mcpServer} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

McpServerSettings.displayName = 'McpServerSettings';
