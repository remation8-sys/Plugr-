import { useEffect } from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';

type PageTitleProps = {
  title: string;
  separator?: string;
  children: React.ReactNode;
};

const PageTitle = ({ title, separator = '|', children }: PageTitleProps) => {
  const websiteBranding = flagsHooks.useWebsiteBranding();

  useEffect(() => {
    document.title = `${title} ${separator} ${websiteBranding.websiteName}`;
  }, [title, separator, websiteBranding.websiteName]);

  return children;
};

PageTitle.displayName = 'PageTitle';

export { PageTitle };
