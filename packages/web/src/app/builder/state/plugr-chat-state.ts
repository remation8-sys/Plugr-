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

export const createPlugrChatState = (
  set: StoreApi<BuilderState>['setState'],
): PlugrChatState => {
  return {
    isPlugrChatOpen: false,
    plugrChatConversationId: null,
    setPlugrChatOpen: (open: boolean) => set({ isPlugrChatOpen: open }),
    setPlugrChatConversationId: (conversationId: string | null) =>
      set({ plugrChatConversationId: conversationId }),
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
