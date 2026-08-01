import {
  FlowAction,
  FlowActionType,
  FlowTrigger,
  Step,
  StepLocationRelativeToParent,
  flowCanvasUtils,
} from '@activepieces/shared';

function projectFlowToMobileCards(trigger: FlowTrigger): MobileFlowProjection {
  const context: ProjectionContext = {
    nextStepNumber: 1,
    stepByName: new Map(),
    stepNumberByName: new Map(),
    descendantStepNamesByBranchId: new Map(),
    ancestorStepNamesByStepName: new Map(),
  };
  const projectedRoot = projectSequence({
    firstStep: trigger,
    ancestorStepNames: [],
    context,
  });

  return {
    sequence: projectedRoot.nodes,
    totalSteps: context.stepByName.size,
    stepByName: context.stepByName,
    stepNumberByName: context.stepNumberByName,
    descendantStepNamesByBranchId: context.descendantStepNamesByBranchId,
    ancestorStepNamesByStepName: context.ancestorStepNamesByStepName,
  };
}

function projectSequence({
  firstStep,
  ancestorStepNames,
  context,
}: ProjectSequenceParams): ProjectedSequence {
  const nodes: MobileFlowCardNode[] = [];
  const stepNames: string[] = [];
  let currentStep: Step | undefined = firstStep;

  while (currentStep) {
    context.stepByName.set(currentStep.name, currentStep);
    context.stepNumberByName.set(currentStep.name, context.nextStepNumber);
    context.ancestorStepNamesByStepName.set(
      currentStep.name,
      ancestorStepNames,
    );
    context.nextStepNumber += 1;

    const branches = projectBranches({
      step: currentStep,
      ancestorStepNames,
      context,
    });
    nodes.push({
      step: currentStep,
      branches,
      addAfter: createAddSlot({
        parentStep: currentStep.name,
        stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
      }),
    });
    stepNames.push(
      currentStep.name,
      ...branches.flatMap(
        (branch) => context.descendantStepNamesByBranchId.get(branch.id) ?? [],
      ),
    );
    currentStep = currentStep.nextAction;
  }

  return { nodes, stepNames };
}

function projectBranches({
  step,
  ancestorStepNames,
  context,
}: ProjectBranchesParams): MobileFlowBranch[] {
  const branchAncestorStepNames = [...ancestorStepNames, step.name];

  if (step.type === FlowActionType.LOOP_ON_ITEMS) {
    return [
      createBranch({
        parentStep: step,
        label: 'For each item',
        kind: 'loop',
        content: step.firstLoopAction,
        stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
        ancestorStepNames: branchAncestorStepNames,
        context,
      }),
    ];
  }

  if (step.type === FlowActionType.ROUTER) {
    return step.settings.branches.map((branch, branchIndex) =>
      createBranch({
        parentStep: step,
        label: branch.branchName || 'Branch ' + (branchIndex + 1),
        kind: 'router',
        content: step.children[branchIndex] ?? undefined,
        stepLocationRelativeToParent:
          StepLocationRelativeToParent.INSIDE_BRANCH,
        branchIndex,
        ancestorStepNames: branchAncestorStepNames,
        context,
      }),
    );
  }

  if (flowCanvasUtils.hasContinueOnFailureBranches(step)) {
    const [onSuccess, onFailure] =
      flowCanvasUtils.getContinueOnFailureBranchPair(step);
    return [
      createBranch({
        parentStep: step,
        label: 'On success',
        kind: 'success',
        content: onSuccess,
        stepLocationRelativeToParent:
          StepLocationRelativeToParent.INSIDE_ON_SUCCESS_BRANCH,
        ancestorStepNames: branchAncestorStepNames,
        context,
      }),
      createBranch({
        parentStep: step,
        label: 'On failure',
        kind: 'failure',
        content: onFailure,
        stepLocationRelativeToParent:
          StepLocationRelativeToParent.INSIDE_ON_FAILURE_BRANCH,
        ancestorStepNames: branchAncestorStepNames,
        context,
      }),
    ];
  }

  return [];
}

function createBranch({
  parentStep,
  label,
  kind,
  content,
  stepLocationRelativeToParent,
  branchIndex,
  ancestorStepNames,
  context,
}: CreateBranchParams): MobileFlowBranch {
  const id = [parentStep.name, kind, branchIndex ?? 'default'].join(':');
  const projectedContent = content
    ? projectSequence({
        firstStep: content,
        ancestorStepNames,
        context,
      })
    : { nodes: [], stepNames: [] };
  context.descendantStepNamesByBranchId.set(id, projectedContent.stepNames);

  return {
    id,
    label,
    kind,
    content: projectedContent.nodes,
    emptyAddSlot: createAddSlot({
      parentStep: parentStep.name,
      stepLocationRelativeToParent,
      branchIndex,
    }),
  };
}

function createAddSlot({
  parentStep,
  stepLocationRelativeToParent,
  branchIndex,
}: Omit<MobileFlowAddSlot, 'id'>): MobileFlowAddSlot {
  return {
    id: [
      'mobile-add',
      parentStep,
      stepLocationRelativeToParent,
      branchIndex ?? 'default',
    ].join(':'),
    parentStep,
    stepLocationRelativeToParent,
    branchIndex,
  };
}

type MobileFlowProjection = {
  sequence: MobileFlowCardNode[];
  totalSteps: number;
  stepByName: ReadonlyMap<string, Step>;
  stepNumberByName: ReadonlyMap<string, number>;
  descendantStepNamesByBranchId: ReadonlyMap<string, readonly string[]>;
  ancestorStepNamesByStepName: ReadonlyMap<string, readonly string[]>;
};

type MobileFlowCardNode = {
  step: Step;
  branches: MobileFlowBranch[];
  addAfter: MobileFlowAddSlot;
};

type MobileFlowBranch = {
  id: string;
  label: string;
  kind: MobileFlowBranchKind;
  content: MobileFlowCardNode[];
  emptyAddSlot: MobileFlowAddSlot;
};

type MobileFlowBranchKind = 'loop' | 'router' | 'success' | 'failure';

type MobileFlowAddSlot = {
  id: string;
  parentStep: string;
  stepLocationRelativeToParent: StepLocationRelativeToParent;
  branchIndex?: number;
};

type ProjectionContext = {
  nextStepNumber: number;
  stepByName: Map<string, Step>;
  stepNumberByName: Map<string, number>;
  descendantStepNamesByBranchId: Map<string, readonly string[]>;
  ancestorStepNamesByStepName: Map<string, readonly string[]>;
};

type ProjectSequenceParams = {
  firstStep: Step;
  ancestorStepNames: readonly string[];
  context: ProjectionContext;
};

type ProjectedSequence = {
  nodes: MobileFlowCardNode[];
  stepNames: string[];
};

type ProjectBranchesParams = {
  step: Step;
  ancestorStepNames: readonly string[];
  context: ProjectionContext;
};

type CreateBranchParams = {
  parentStep: FlowAction;
  label: string;
  kind: MobileFlowBranchKind;
  content?: FlowAction;
  stepLocationRelativeToParent: Exclude<
    StepLocationRelativeToParent,
    StepLocationRelativeToParent.AFTER
  >;
  branchIndex?: number;
  ancestorStepNames: readonly string[];
  context: ProjectionContext;
};

export {
  projectFlowToMobileCards,
  type MobileFlowAddSlot,
  type MobileFlowBranch,
  type MobileFlowBranchKind,
  type MobileFlowCardNode,
  type MobileFlowProjection,
};
