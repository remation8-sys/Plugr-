import { flowStructureUtil, isNil, Step } from '@activepieces/shared';
import { MiniMap, MiniMapNodeProps } from '@xyflow/react';

import { useTheme } from '@/components/providers/theme-provider';
import { stepsHooks, StepMetadata } from '@/features/pieces';
import { colorsUtils } from '@/lib/color-utils';

import { useBuilderStateContext } from '../../builder-hooks';

const Minimap = () => {
  const [showMinimap] = useBuilderStateContext((state) => [state.showMinimap]);
  const { theme } = useTheme();
  const maskTransparency = theme === 'dark' ? 0.72 : 0.12;
  return (
    <>
      {showMinimap && (
        <MiniMap
          position="bottom-left"
          className="!bottom-16 !left-3 !rounded-lg !border !border-border/80 !bg-background/95 !shadow-lg backdrop-blur overflow-hidden animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none"
          zoomable
          pannable
          zoomStep={0.3}
          bgColor="var(--background)"
          maskColor={`rgba(0, 0, 0, ${maskTransparency})`}
          nodeComponent={(node) => <MinimapNode node={node} />}
        />
      )}
    </>
  );
};

const MinimapNodeContent = ({
  stepMetadata,
  node,
}: {
  stepMetadata: StepMetadata;
  node: MiniMapNodeProps;
}) => {
  const nodeColor = colorsUtils.useAverageColorInImage({
    imgUrl: stepMetadata.logoUrl ?? '',
    transparency: 45,
  });
  const defaultColor = 'oklch(92.8% 0.006 264.531)';

  return (
    <rect
      width={node.width}
      key={node.id}
      height={node.height}
      x={node.x}
      y={node.y}
      rx={6}
      ry={6}
      fill={nodeColor ?? defaultColor}
      stroke="var(--background)"
      strokeWidth={2}
    ></rect>
  );
};

const MinimapContentGuard = ({
  step,
  node,
}: {
  step: Step;
  node: MiniMapNodeProps;
}) => {
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step,
  });
  if (isNil(stepMetadata)) {
    return null;
  }
  return <MinimapNodeContent stepMetadata={stepMetadata} node={node} />;
};

const MinimapNode = ({ node }: { node: MiniMapNodeProps }) => {
  const [trigger] = useBuilderStateContext((state) => [
    state.flowVersion.trigger,
  ]);
  const step = flowStructureUtil.getStep(node.id, trigger);
  if (isNil(step)) {
    return null;
  }

  return <MinimapContentGuard step={step} node={node} />;
};
export default Minimap;
