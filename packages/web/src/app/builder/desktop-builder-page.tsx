import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { PanelImperativeHandle } from 'react-resizable-panels';
import { usePrevious } from 'react-use';

import { DataSelector } from '@/app/builder/data-selector';
import { CanvasControls } from '@/app/builder/flow-canvas/canvas-controls';
import { StepSettingsProvider } from '@/app/builder/step-settings/step-settings-context';
import { RightSideBarType } from '@/app/builder/types';
import { ChatDrawer } from '@/app/routes/chat/chat-drawer';
import { ShowPoweredBy } from '@/components/custom/show-powered-by';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { platformHooks } from '@/hooks/platform-hooks';
import { useElementSize } from '@/hooks/use-element-size';
import { cn } from '@/lib/utils';

import { BuilderHeader } from './builder-header/builder-header';
import { useBuilderPageRuntime } from './builder-page-runtime';
import { builderPageUtils } from './builder-page-utils';
import { CanvasNavigationProvider } from './canvas-navigation-context';
import { FlowCanvas } from './flow-canvas';
import { flowCanvasConsts } from './flow-canvas/utils/consts';
import { flowCanvasUtils } from './flow-canvas/utils/flow-canvas-utils';
import { BuilderBanner } from './flow-canvas/widgets/builder-banner';
import { FlowVersionsList } from './flow-versions';
import { PlugrChatPanel } from './plugr-chat/plugr-chat-panel';
import { PlugrChatWidget } from './plugr-chat/plugr-chat-widget';
import { RunsList } from './run-list';
import { CursorPositionProvider } from './state/cursor-position-context';
import { StepSettingsContainer } from './step-settings';

const ANIMATE_RESIZE_CLASS_NAME = 'transition-all';
const SPLIT_MODE_INITIAL_OPEN_SIZE_PX = 1000;
const SPLIT_MODE_SIDEBAR_SIZE_PX = 850;
const DEFAULT_SIDEBAR_SIZE = '25%';
const DEFAULT_MIN_SIZE = '400px';
const SPLIT_MODE_COLLAPSE_THRESHOLD_PX = 700;

function DesktopBuilderPage() {
  return (
    <ReactFlowProvider>
      <DesktopCanvasNavigationProvider>
        <DesktopBuilderContent />
      </DesktopCanvasNavigationProvider>
    </ReactFlowProvider>
  );
}

function DesktopCanvasNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { fitView } = useReactFlow();
  const focusStep = useCallback(
    (stepName: string) =>
      fitView(flowCanvasUtils.createFocusStepInGraphParams(stepName)),
    [fitView],
  );
  return (
    <CanvasNavigationProvider focusStep={focusStep}>
      {children}
    </CanvasNavigationProvider>
  );
}

function DesktopBuilderContent() {
  const { platform } = platformHooks.useCurrentPlatform();
  const runtime = useBuilderPageRuntime();
  const { setStepDataPanelOpen, setStepDataPanelView } = runtime;
  const middlePanelRef = useRef<HTMLDivElement>(null);
  const middlePanelSize = useElementSize(middlePanelRef);
  const [hasCanvasBeenInitialised, setHasCanvasBeenInitialised] =
    useState(false);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const rightHandleRef = useRef<PanelImperativeHandle>(null);
  const rightSidePanelRef = useRef<HTMLDivElement>(null);
  const previousRightSidebar = usePrevious(runtime.rightSidebar);
  const isSplitForPiece =
    runtime.rightSidebar === RightSideBarType.PIECE_SETTINGS &&
    runtime.stepDataPanelView === 'split' &&
    runtime.isStepDataPanelOpen;
  const prefersSplitLayout =
    runtime.rightSidebar === RightSideBarType.PIECE_SETTINGS &&
    runtime.stepDataPanelView === 'split';

  useEffect(() => {
    const handlePointerUp = () => setIsDraggingHandle(false);
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  useLayoutEffect(() => {
    const handle = rightHandleRef.current;
    if (!handle) return;
    if (runtime.rightSidebar === RightSideBarType.NONE) {
      handle.resize('0%');
      return;
    }
    const isInitialOpen = previousRightSidebar === RightSideBarType.NONE;
    const targetSize = prefersSplitLayout
      ? isInitialOpen
        ? SPLIT_MODE_INITIAL_OPEN_SIZE_PX
        : SPLIT_MODE_SIDEBAR_SIZE_PX
      : DEFAULT_SIDEBAR_SIZE;
    handle.resize(targetSize);
    const frameId = window.requestAnimationFrame(() =>
      handle.resize(targetSize),
    );
    return () => window.cancelAnimationFrame(frameId);
  }, [prefersSplitLayout, previousRightSidebar, runtime.rightSidebar]);

  useEffect(() => {
    if (!isSplitForPiece || !isDraggingHandle) return;
    const element = rightSidePanelRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0 && width < SPLIT_MODE_COLLAPSE_THRESHOLD_PX) {
        setStepDataPanelView('drawer');
        setStepDataPanelOpen(false);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [
    isDraggingHandle,
    isSplitForPiece,
    setStepDataPanelOpen,
    setStepDataPanelView,
  ]);

  return (
    <div className="relative flex h-full max-h-[100vh] w-full flex-col">
      <div className="z-40">
        <BuilderHeader />
      </div>
      <div className="flex min-h-0 w-full flex-1">
        <ResizablePanelGroup orientation="horizontal" className="min-w-0">
          <ResizablePanel defaultSize="100%" id="flow-canvas">
            <div ref={middlePanelRef} className="relative h-full w-full">
              <CursorPositionProvider>
                <FlowCanvas
                  setHasCanvasBeenInitialised={setHasCanvasBeenInitialised}
                />
              </CursorPositionProvider>

              <BuilderBanner />
              {middlePanelRef.current &&
                middlePanelRef.current.clientWidth > 0 && (
                  <CanvasControls
                    canvasHeight={middlePanelRef.current.clientHeight ?? 0}
                    canvasWidth={middlePanelRef.current.clientWidth ?? 0}
                    hasCanvasBeenInitialised={hasCanvasBeenInitialised}
                    selectedStep={runtime.selectedStepName}
                  />
                )}
              <ShowPoweredBy
                position="absolute"
                show={platform?.plan.showPoweredBy}
              />
              <DataSelector
                parentHeight={middlePanelSize.height}
                parentWidth={middlePanelSize.width}
              />
              <PlugrChatWidget />
            </div>
          </ResizablePanel>

          <ResizableHandle
            disabled={runtime.rightSidebar === RightSideBarType.NONE}
            withHandle={runtime.rightSidebar !== RightSideBarType.NONE}
            onPointerDown={() => setIsDraggingHandle(true)}
            onPointerUp={() => setIsDraggingHandle(false)}
            onPointerCancel={() => setIsDraggingHandle(false)}
            className={
              runtime.rightSidebar === RightSideBarType.NONE
                ? 'bg-transparent'
                : ''
            }
          />

          <ResizablePanel
            panelRef={rightHandleRef}
            id="right-sidebar"
            collapsedSize="0%"
            defaultSize="0%"
            minSize={
              runtime.rightSidebar === RightSideBarType.NONE
                ? '0%'
                : DEFAULT_MIN_SIZE
            }
            maxSize={
              runtime.rightSidebar === RightSideBarType.NONE
                ? '0%'
                : prefersSplitLayout
                ? '95%'
                : '60%'
            }
            className={cn('z-30 min-w-0 bg-background', {
              [ANIMATE_RESIZE_CLASS_NAME]: !isDraggingHandle,
            })}
            style={{
              transitionDuration: `${
                isDraggingHandle
                  ? 0
                  : flowCanvasConsts.SIDEBAR_ANIMATION_DURATION
              }ms`,
            }}
          >
            <div ref={rightSidePanelRef} className="h-full w-full">
              {runtime.rightSidebar === RightSideBarType.PIECE_SETTINGS &&
                runtime.selectedStep && (
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
                )}
              {runtime.rightSidebar === RightSideBarType.RUNS && <RunsList />}
              {runtime.rightSidebar === RightSideBarType.VERSIONS && (
                <FlowVersionsList />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        <PlugrChatPanel />
      </div>

      <ChatDrawer />
    </div>
  );
}

DesktopBuilderPage.displayName = 'DesktopBuilderPage';

export { DesktopBuilderPage };
