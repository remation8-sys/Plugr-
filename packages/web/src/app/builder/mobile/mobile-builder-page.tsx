import { lazy, memo, Suspense, useRef } from 'react';

import { DataSelector } from '@/app/builder/data-selector';
import { StepSettingsProvider } from '@/app/builder/step-settings/step-settings-context';
import { RightSideBarType } from '@/app/builder/types';
import { ChatDrawer } from '@/app/routes/chat/chat-drawer';
import { ShowPoweredBy } from '@/components/custom/show-powered-by';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { platformHooks } from '@/hooks/platform-hooks';
import { useElementSize } from '@/hooks/use-element-size';

import { useBuilderPageRuntime } from '../builder-page-runtime';
import { builderPageUtils } from '../builder-page-utils';
import { builderUiConstants } from '../builder-ui-constants';
import { BuilderBanner } from '../flow-canvas/widgets/builder-banner';
import { FlowVersionsList } from '../flow-versions';
import { PlugrChatPanel } from '../plugr-chat/plugr-chat-panel';
import { PlugrChatWidget } from '../plugr-chat/plugr-chat-widget';
import { RunsList } from '../run-list';
import { StepSettingsContainer } from '../step-settings';

import { MobileBuilderHeader } from './mobile-builder-header';
import { MobileFlowBuilder } from './mobile-flow-builder';
import { MobileSampleDataBoundary } from './mobile-sample-data-boundary';

const MemoizedMobileFlowBuilder = memo(MobileFlowBuilder);
MemoizedMobileFlowBuilder.displayName = 'MemoizedMobileFlowBuilder';

const LazyEmbeddedBuilderHeader = lazy(async () => {
  const { BuilderHeader } = await import('../builder-header/builder-header');
  return { default: BuilderHeader };
});

function EmbeddedBuilderHeaderFallback() {
  return (
    <div
      aria-hidden="true"
      className="shrink-0 border-b border-border/80 bg-background"
      style={{ height: builderUiConstants.BUILDER_HEADER_HEIGHT }}
    />
  );
}

function MobileBuilderPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { embedState } = useEmbedding();
  const runtime = useBuilderPageRuntime();
  const middlePanelRef = useRef<HTMLDivElement>(null);
  const middlePanelSize = useElementSize(middlePanelRef);
  const mobileDrawerOpen = runtime.rightSidebar !== RightSideBarType.NONE;

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="z-40">
        {embedState.isEmbedded ? (
          <Suspense fallback={<EmbeddedBuilderHeaderFallback />}>
            <LazyEmbeddedBuilderHeader />
          </Suspense>
        ) : (
          <MobileBuilderHeader />
        )}
      </div>

      <div ref={middlePanelRef} className="relative min-h-0 w-full flex-1">
        <MemoizedMobileFlowBuilder />
        <BuilderBanner />
        <ShowPoweredBy
          position="absolute"
          show={platform?.plan.showPoweredBy}
        />
        {runtime.selectedStep &&
          runtime.rightSidebar === RightSideBarType.PIECE_SETTINGS && (
            <DataSelector
              parentHeight={middlePanelSize.height}
              parentWidth={middlePanelSize.width}
            />
          )}
        <PlugrChatWidget />
      </div>

      <Drawer
        open={mobileDrawerOpen}
        onOpenChange={(open) => {
          if (!open) runtime.exitStepSettings();
        }}
        direction="bottom"
        modal={false}
      >
        <DrawerContent
          data-mobile-step-editor
          className="flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
          style={{
            height:
              'min(calc(var(--mobile-viewport-height, 100dvh) - 1rem), 920px)',
          }}
        >
          {runtime.rightSidebar === RightSideBarType.PIECE_SETTINGS &&
            runtime.selectedStep && (
              <MobileSampleDataBoundary>
                <StepSettingsProvider
                  pieceModel={runtime.pieceModel}
                  selectedStep={runtime.selectedStep}
                  key={builderPageUtils.constructContainerKey({
                    flowVersionId: runtime.flowVersion.id,
                    step: runtime.selectedStep,
                    hasPieceModelLoaded: !!runtime.pieceModel,
                  })}
                >
                  <StepSettingsContainer />
                </StepSettingsProvider>
              </MobileSampleDataBoundary>
            )}
          {runtime.rightSidebar === RightSideBarType.RUNS && <RunsList />}
          {runtime.rightSidebar === RightSideBarType.VERSIONS && (
            <FlowVersionsList />
          )}
        </DrawerContent>
      </Drawer>

      <ChatDrawer />
      <PlugrChatPanel />
    </div>
  );
}

MobileBuilderPage.displayName = 'MobileBuilderPage';

export { MobileBuilderPage };
