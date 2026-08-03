import {
  BranchExecutionType,
  CodeAction,
  EmptyTrigger,
  FlowAction,
  FlowActionType,
  FlowTriggerType,
  LoopOnItemsAction,
  RouterAction,
  RouterExecutionType,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { projectFlowToMobileCards } from '@/app/builder/mobile/flow-card-projection';

describe('projectFlowToMobileCards', () => {
  it('keeps sequential actions and canonical after-step insertion slots', () => {
    const trigger = createTrigger(
      createCodeAction('step_1', createCodeAction('step_2')),
    );

    const projection = projectFlowToMobileCards(trigger);

    expect(projection.sequence.map((node) => node.step.name)).toEqual([
      'trigger',
      'step_1',
      'step_2',
    ]);
    expect(projection.sequence[1].addAfter).toMatchObject({
      parentStep: 'step_1',
      stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
    });
    expect(projection.stepNumberByName.get('step_2')).toBe(3);
    expect(projection.stepByName.get('step_1')).toBe(trigger.nextAction);
    expect(
      projection.selectorOwnerStepNameById.get(
        projection.sequence[1].addAfter.id,
      ),
    ).toBe('step_1');
  });

  it('keeps a loop body nested instead of flattening it into the main path', () => {
    const loop = createLoopAction(
      'step_1',
      createCodeAction('step_2', createCodeAction('step_4')),
      createCodeAction('step_3'),
    );

    const projection = projectFlowToMobileCards(createTrigger(loop));
    const loopCard = projection.sequence[1];

    expect(loopCard.step.name).toBe('step_1');
    expect(loopCard.branches).toHaveLength(1);
    expect(loopCard.branches[0].kind).toBe('loop');
    expect(loopCard.branches[0].content.map((node) => node.step.name)).toEqual([
      'step_2',
      'step_4',
    ]);
    expect(projection.sequence[2].step.name).toBe('step_3');
    expect(loopCard.branches[0].emptyAddSlot).toMatchObject({
      parentStep: 'step_1',
      stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
    });
    expect(
      projection.descendantStepNamesByBranchId.get('step_1:loop:default'),
    ).toEqual(['step_2', 'step_4']);
    expect(projection.ancestorStepNamesByStepName.get('step_2')).toEqual([
      'step_1',
    ]);
    expect(projection.ancestorStepNamesByStepName.get('step_3')).toEqual([]);
    expect(
      ['trigger', 'step_1', 'step_2', 'step_4', 'step_3'].map((stepName) =>
        projection.stepNumberByName.get(stepName),
      ),
    ).toEqual([1, 2, 3, 4, 5]);
  });

  it('preserves router branch identity and branch indices', () => {
    const router = createRouterAction('step_1', [
      createCodeAction('step_2'),
      null,
    ]);

    const projection = projectFlowToMobileCards(createTrigger(router));
    const branches = projection.sequence[1].branches;

    expect(branches?.map((branch) => branch.label)).toEqual([
      'Qualified',
      'Fallback',
    ]);
    expect(branches[0].content[0].step.name).toBe('step_2');
    expect(branches[1].content).toEqual([]);
    expect(branches[1].emptyAddSlot).toMatchObject({
      branchIndex: 1,
      parentStep: 'step_1',
      stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
    });
    expect(
      projection.selectorOwnerStepNameById.get(branches[1].emptyAddSlot.id),
    ).toBe('step_1');
  });

  it('preserves success and failure subtrees as separate paths', () => {
    const action = createCodeAction('step_1');
    action.settings.errorHandlingOptions = {
      continueOnFailure: { value: true },
    };
    action.continueOnFailureBranches = {
      onSuccess: createCodeAction('step_2'),
      onFailure: createCodeAction('step_3'),
    };

    const projection = projectFlowToMobileCards(createTrigger(action));
    const branches = projection.sequence[1].branches;

    expect(branches?.map((branch) => branch.kind)).toEqual([
      'success',
      'failure',
    ]);
    expect(branches[0].content[0].step.name).toBe('step_2');
    expect(branches[1].content[0].step.name).toBe('step_3');
    expect(branches[1].emptyAddSlot.stepLocationRelativeToParent).toBe(
      StepLocationRelativeToParent.INSIDE_ON_FAILURE_BRANCH,
    );
  });

  it('projects a long next-action chain as siblings', () => {
    let nextAction: FlowAction | undefined;
    for (let index = 1_500; index >= 1; index -= 1) {
      nextAction = createCodeAction('step_' + index, nextAction);
    }

    const projection = projectFlowToMobileCards(createTrigger(nextAction));

    expect(projection.sequence).toHaveLength(1_501);
    expect(projection.sequence[0].step.name).toBe('trigger');
    expect(projection.sequence[1_500].step.name).toBe('step_1500');
    expect(projection.totalSteps).toBe(1_501);
    expect(projection.stepNumberByName.get('step_1500')).toBe(1_501);
  });
});

function createTrigger(nextAction?: FlowAction): EmptyTrigger {
  return {
    name: 'trigger',
    valid: true,
    displayName: 'Webhook',
    type: FlowTriggerType.EMPTY,
    settings: {},
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    nextAction,
  };
}

function createCodeAction(name: string, nextAction?: FlowAction): CodeAction {
  return {
    name,
    valid: true,
    displayName: name,
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    type: FlowActionType.CODE,
    settings: {
      sourceCode: {
        code: 'export const code = async () => true;',
        packageJson: '{}',
      },
      input: {},
      errorHandlingOptions: {},
    },
    nextAction,
  };
}

function createLoopAction(
  name: string,
  firstLoopAction?: FlowAction,
  nextAction?: FlowAction,
): LoopOnItemsAction {
  return {
    name,
    valid: true,
    displayName: name,
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    type: FlowActionType.LOOP_ON_ITEMS,
    settings: { items: '{{trigger.body.items}}' },
    firstLoopAction,
    nextAction,
  };
}

function createRouterAction(
  name: string,
  children: Array<FlowAction | null>,
): RouterAction {
  return {
    name,
    valid: true,
    displayName: name,
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    type: FlowActionType.ROUTER,
    settings: {
      executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
      branches: [
        {
          branchName: 'Qualified',
          branchType: BranchExecutionType.CONDITION,
          conditions: [],
        },
        {
          branchName: 'Fallback',
          branchType: BranchExecutionType.FALLBACK,
        },
      ],
    },
    children,
  };
}
