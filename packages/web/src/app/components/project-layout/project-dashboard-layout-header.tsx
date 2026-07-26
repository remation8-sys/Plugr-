import { t } from 'i18next';
import { Table2 } from 'lucide-react';
import { ComponentType } from 'react';
import { useLocation } from 'react-router-dom';

import { ProjectDashboardPageHeader } from './project-dashboard-page-header';

import { McpSvg } from '@/assets/img/custom/mcp';
import { BoxIcon } from '@/components/icons/box';
import { ConnectIcon } from '@/components/icons/connect';
import { HistoryIcon } from '@/components/icons/history';
import { VariableIcon } from '@/components/icons/variable';
import { WorkflowIcon } from '@/components/icons/workflow';

function ProjectDashboardLayoutHeader() {
  const location = useLocation();
  const pageTitle = getPageTitle({
    pathname: location.pathname,
    search: location.search,
  });

  return (
    <div className="flex flex-col">
      <ProjectDashboardPageHeader
        titleOverride={
          pageTitle ? <PageTitleContent title={pageTitle} /> : undefined
        }
      />
    </div>
  );
}

function getPageTitle({
  pathname,
  search,
}: {
  pathname: string;
  search: string;
}): PageTitleInfo | null {
  if (pathname.includes('/automations')) {
    return search.includes('type=table')
      ? { label: t('Tables'), icon: Table2 }
      : { label: t('Flows'), icon: WorkflowIcon };
  }
  if (pathname.includes('/runs')) {
    return { label: t('Runs'), icon: HistoryIcon };
  }
  if (pathname.includes('/connections')) {
    return { label: t('Connections'), icon: ConnectIcon };
  }
  if (pathname.includes('/variables')) {
    return { label: t('Variables'), icon: VariableIcon };
  }
  if (pathname.includes('/releases')) {
    return { label: t('Releases'), icon: BoxIcon };
  }
  if (pathname.includes('/mcp')) {
    return { label: t('MCP Server'), icon: McpSvg };
  }
  return null;
}

function PageTitleContent({ title }: { title: PageTitleInfo }) {
  const Icon = title.icon;

  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">{title.label}</span>
    </div>
  );
}

ProjectDashboardLayoutHeader.displayName = 'ProjectDashboardLayoutHeader';

type PageTitleInfo = {
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
};

export { ProjectDashboardLayoutHeader };
export default ProjectDashboardLayoutHeader;
