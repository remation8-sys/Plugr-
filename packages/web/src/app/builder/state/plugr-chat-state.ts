import { flowStructureUtil, isNil, PopulatedFlow } from '@activepieces/shared';
import { StoreApi } from 'zustand';

import { RightSideBarType } from '@/app/builder/types';

import { BuilderState } from '../builder-hooks';

export type PlugrChatState = {
  isPlugrChatOpen: boolean;
  plugrChatConversationId: string | null;
  setPlugrChatOpen: (open: boolean) => void;
  setPlugrChatConversationId: (conversationId: string | null) => void;
  applyPlugrChatFlowUpdate: (flow: PopulatedFlow) => void;
};

// The builder store is destroyed whenever the user navigates away from the
// builder (e.g. to the Flows list), so the open flag and conversation id are
// mirrored per-flow in sessionStorage. Returning to the flow restores them and
// AIChatBox resumes the conversation — including an in-flight agent turn.
type PersistedPlugrChatState = {
  open: boolean;
  conversationId: string | null;
};

const storageKey = (flowId: string) => `plugr-chat-state:${flowId}`;

const readPersistedState = (flowId: string): PersistedPlugrChatState => {
  try {
    const raw = sessionStorage.getItem(storageKey(flowId));
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        const record = parsed as Record<string, unknown>;
        return {
          open: record.open === true,
          conversationId:
            typeof record.conversationId === 'string'
              ? record.conversationId
              : null,
        };
      }
    }
  } catch {
    // storage unavailable (private mode / quota) — fall through to defaults
  }
  return { open: false, conversationId: null };
};

const writePersistedState = (
  flowId: string,
  state: PersistedPlugrChatState,
): void => {
  try {
    sessionStorage.setItem(storageKey(flowId), JSON.stringify(state));
  } catch {
    // storage unavailable — chat still works, just without resume
  }
};

export const createPlugrChatState = (
  initialState: { flow: PopulatedFlow; readonly: boolean },
  set: StoreApi<BuilderState>['setState'],
): PlugrChatState => {
  const flowId = initialState.flow.id;
  let persisted = readPersistedState(flowId);
  const persist = (patch: Partial<PersistedPlugrChatState>) => {
    persisted = { ...persisted, ...patch };
    writePersistedState(flowId, persisted);
  };
  return {
    // readonly builders (run views) never show the chat widget, so don't
    // auto-restore the panel there either
    isPlugrChatOpen: persisted.open && !initialState.readonly,
    plugrChatConversationId: persisted.conversationId,
    setPlugrChatOpen: (open: boolean) => {
      persist({ open });
      set({ isPlugrChatOpen: open });
    },
    setPlugrChatConversationId: (conversationId: string | null) => {
      persist({ conversationId });
      set({ plugrChatConversationId: conversationId });
    },
    // Swaps in the server flow after a Plugr Chat turn edited it. Skipped while
    // the builder has unsaved edits in flight (saving) or shows a run/locked
    // version (readonly), so chat updates never clobber the user's work.
    applyPlugrChatFlowUpdate: (flow: PopulatedFlow) =>
      set((state) => {
        const unchanged =
          state.flowVersion.id === flow.version.id &&
          state.flowVersion.updated === flow.version.updated;
        if (state.saving || state.readonly || unchanged) {
          return state;
        }
        const selectedStepStillExists =
          !isNil(state.selectedStep) &&
          !isNil(
            flowStructureUtil.getStep(state.selectedStep, flow.version.trigger),
          );
        return {
          flow,
          flowVersion: flow.version,
          ...(selectedStepStillExists
            ? {}
            : {
                selectedStep: null,
                rightSidebar: RightSideBarType.NONE,
                selectedBranchIndex: null,
              }),
        };
      }),
  };
};
