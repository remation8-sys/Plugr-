import { t } from 'i18next';

import { McpServerSettings } from '@/app/components/project-settings/mcp-server';

const McpPage = () => {
  return (
    <div className="flex w-full flex-col px-4 py-2 md:px-6">
      <p className="text-sm text-muted-foreground">
        {t(
          'Expose this project’s tools and flows to AI assistants through the MCP server.',
        )}
      </p>
      <McpServerSettings />
    </div>
  );
};

export default McpPage;
