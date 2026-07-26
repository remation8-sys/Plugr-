import React from 'react';
import { Link } from 'react-router-dom';

import { FeatureKey, RequestTrial } from './request-trial';

import { Button } from '@/components/ui/button';

type LockedFeatureGuardProps = {
  children: React.ReactNode;
  locked: boolean;
  lockTitle: string;
  lockDescription: string;
  lockVideoUrl?: string;
  lockDocumentationUrl?: string;
  featureKey: FeatureKey;
  showContactSales?: boolean;
  upgradeHref?: string;
  upgradeLabel?: string;
};

export const LockedFeatureGuard = ({
  children,
  locked,
  lockTitle,
  lockDescription,
  lockVideoUrl,
  lockDocumentationUrl,
  featureKey,
  showContactSales = true,
  upgradeHref,
  upgradeLabel = 'Upgrade',
}: LockedFeatureGuardProps) => {
  if (!locked) {
    return children;
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2">
      <div className="pt-8 text-center flex flex-col gap-2 justify-center items-center">
        <h1 className="text-3xl font-bold">{lockTitle}</h1>
        <div className="my-4 flex w-full max-w-lg flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-md leading-relaxed text-muted-foreground">
            {lockDescription}
            {lockDocumentationUrl && (
              <>
                {' '}
                <a
                  href={lockDocumentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Learn more
                </a>
              </>
            )}
          </p>
          {upgradeHref ? (
            <div className="my-4">
              <Button asChild>
                <Link to={upgradeHref}>{upgradeLabel}</Link>
              </Button>
            </div>
          ) : (
            showContactSales && (
              <div className="my-4">
                <RequestTrial featureKey={featureKey} />
              </div>
            )
          )}
        </div>

        {lockVideoUrl && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-auto w-full max-w-3xl rounded-lg"
            controls={false}
            src={lockVideoUrl}
          />
        )}
      </div>
    </div>
  );
};

export default LockedFeatureGuard;
