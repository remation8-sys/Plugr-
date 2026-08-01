// @vitest-environment jsdom
import {
  FlowOperationStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  PieceTrigger,
  PopulatedFlow,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StoreApi } from 'zustand';

import { BuilderState } from '@/app/builder/builder-hooks';
import { createCanvasState } from '@/app/builder/state/canvas-state';
import {
  createFlowState,
  FlowInitialState,
} from '@/app/builder/state/flow-state';
import { RightSideBarType } from '@/app/builder/types';

describe('builder state initialization', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/flows/flow-id');
  });

  it('keeps mobile step settings closed without changing the desktop default', () => {
    const flowVersion = createFlowVersion();
    const setState = vi.fn() as unknown as StoreApi<BuilderState>['setState'];

    const mobileState = createCanvasState(
      {
        flowVersion,
        hideTestWidget: false,
        initiallySelectStep: false,
        readonly: false,
        run: null,
      },
      setState,
    );
    const desktopState = createCanvasState(
      {
        flowVersion,
        hideTestWidget: false,
        readonly: false,
        run: null,
      },
      setState,
    );

    expect(mobileState.selectedStep).toBeNull();
    expect(mobileState.rightSidebar).toBe(RightSideBarType.NONE);
    expect(desktopState.selectedStep).toBe('trigger');
    expect(desktopState.rightSidebar).toBe(RightSideBarType.PIECE_SETTINGS);
  });
});

describe('flow sample-data hydration', () => {
  it('preserves local values while hydrating the same flow version', () => {
    const store = createFlowStateStore({
      inputSampleData: { trigger: 'initial input' },
      outputSampleData: { trigger: 'initial output' },
    });

    store.getState().setSampleDataLocally({
      stepName: 'trigger',
      type: 'input',
      value: 'local input',
    });
    store.getState().setSampleDataLocally({
      stepName: 'trigger',
      type: 'output',
      value: 'local output',
    });
    store.getState().hydrateSampleData({
      flowVersionId: 'version-1',
      input: { trigger: 'server input', step_1: 'server step input' },
      output: { trigger: 'server output', step_1: 'server step output' },
    });

    expect(store.getState().inputSampleData).toEqual({
      trigger: 'local input',
      step_1: 'server step input',
    });
    expect(store.getState().outputSampleData).toEqual({
      trigger: 'local output',
      step_1: 'server step output',
    });
  });

  it('replaces local values when hydrating a different flow version', () => {
    const store = createFlowStateStore({
      inputSampleData: {
        trigger: 'old input',
        old_step: 'stale input',
      },
      outputSampleData: {
        trigger: 'old output',
        old_step: 'stale output',
      },
    });

    store.getState().hydrateSampleData({
      flowVersionId: 'version-2',
      input: { trigger: 'new input' },
      output: { trigger: 'new output' },
    });

    expect(store.getState().sampleDataFlowVersionId).toBe('version-2');
    expect(store.getState().inputSampleData).toEqual({
      trigger: 'new input',
    });
    expect(store.getState().outputSampleData).toEqual({
      trigger: 'new output',
    });
  });
});

function createFlowStateStore({
  inputSampleData,
  outputSampleData,
}: Pick<FlowInitialState, 'inputSampleData' | 'outputSampleData'>) {
  const flowVersion = createFlowVersion();
  const initialState: FlowInitialState = {
    flow: createPopulatedFlow(flowVersion),
    flowVersion,
    inputSampleData,
    outputSampleData,
    queryClient: new QueryClient(),
  };
  let state = {} as BuilderState;
  const getState = () => state;
  const setState = (update: BuilderStateUpdate) => {
    const nextState = typeof update === 'function' ? update(state) : update;
    state = { ...state, ...nextState };
  };
  state = createFlowState(
    initialState,
    getState as StoreApi<BuilderState>['getState'],
    setState as StoreApi<BuilderState>['setState'],
  ) as BuilderState;

  return { getState };
}

function createFlowVersion(): FlowVersion {
  const trigger: PieceTrigger = {
    name: 'trigger',
    valid: true,
    displayName: 'Webhook',
    type: FlowTriggerType.PIECE,
    settings: {
      input: {},
      pieceName: '@activepieces/piece-webhook',
      pieceVersion: '~0.1.0',
      propertySettings: {},
      triggerName: 'catch_webhook',
    },
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  };
  return {
    id: 'version-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    flowId: 'flow-id',
    displayName: 'Test flow',
    trigger,
    updatedBy: null,
    valid: true,
    schemaVersion: null,
    agentIds: [],
    state: FlowVersionState.DRAFT,
    connectionIds: [],
    backupFiles: null,
    notes: [],
  };
}

function createPopulatedFlow(flowVersion: FlowVersion): PopulatedFlow {
  return {
    id: 'flow-id',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    projectId: 'project-id',
    externalId: 'external-flow-id',
    ownerId: null,
    folderId: null,
    status: FlowStatus.DISABLED,
    publishedVersionId: null,
    metadata: null,
    operationStatus: FlowOperationStatus.NONE,
    timeSavedPerRun: null,
    templateId: null,
    createdBy: null,
    version: flowVersion,
  };
}

type BuilderStateUpdate =
  | BuilderState
  | Partial<BuilderState>
  | ((state: BuilderState) => BuilderState | Partial<BuilderState>);
