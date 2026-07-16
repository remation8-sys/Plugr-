import { isNil, USE_DRAFT_QUERY_PARAM_NAME } from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSearchParam } from 'react-use';

import { ChatDrawerSource } from '@/app/builder/types';
import { LoadingScreen } from '@/components/custom/loading-screen';
import { Messages } from '@/features/chat';
import { flowHooks } from '@/features/flows';

import { ChatNotFound, FlowChat } from './flow-chat';

const EMBED_QUERY_PARAM_NAME = 'embed';
const MAX_PERSISTED_MESSAGES = 50;

const sessionStorageKey = (flowId: string) => `plugr-chat-session:${flowId}`;
const messagesStorageKey = (flowId: string, sessionId: string) =>
  `plugr-chat-messages:${flowId}:${sessionId}`;

function readOrCreateSessionId(flowId: string | undefined): string | null {
  if (!flowId) {
    return null;
  }
  try {
    const existing = localStorage.getItem(sessionStorageKey(flowId));
    if (existing) {
      return existing;
    }
    const fresh = nanoid();
    localStorage.setItem(sessionStorageKey(flowId), fresh);
    return fresh;
  } catch {
    return nanoid();
  }
}

function loadPersistedMessages(
  flowId: string | undefined,
  sessionId: string | null,
): Messages {
  if (!flowId || !sessionId) {
    return [];
  }
  try {
    const raw = localStorage.getItem(messagesStorageKey(flowId, sessionId));
    if (!raw) {
      return [];
    }
    const parsed = Messages.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function persistMessages(
  flowId: string,
  sessionId: string,
  messages: Messages,
) {
  try {
    // blob: object URLs don't survive a reload, drop them before persisting
    const serializable = messages
      .slice(-MAX_PERSISTED_MESSAGES)
      .map((message) => ({
        ...message,
        files: message.files?.filter((file) =>
          'url' in file ? !file.url.startsWith('blob:') : true,
        ),
      }));
    localStorage.setItem(
      messagesStorageKey(flowId, sessionId),
      JSON.stringify(serializable),
    );
  } catch {
    // storage full or unavailable — the chat still works without persistence
  }
}

export function ChatPage() {
  const { flowId } = useParams();
  const hasDraftSearchParam =
    useSearchParam(USE_DRAFT_QUERY_PARAM_NAME) === 'true';
  const isEmbedded = useSearchParam(EMBED_QUERY_PARAM_NAME) === 'true';

  const [chatSessionId, setChatSessionId] = useState<string | null>(() =>
    readOrCreateSessionId(flowId),
  );
  const [messages, setMessages] = useState<Messages>(() =>
    loadPersistedMessages(flowId, chatSessionId),
  );
  const { data: flow, isLoading } = flowHooks.useGetFlow({
    flowId: flowId ?? '',
  });
  useEffect(() => {
    if (!chatSessionId) {
      setChatSessionId(nanoid());
    }
  }, [chatSessionId]);

  useEffect(() => {
    if (flowId && chatSessionId) {
      persistMessages(flowId, chatSessionId, messages);
    }
  }, [flowId, chatSessionId, messages]);

  const addMessage = (message: Messages[0]) => {
    setMessages((prev) => [...prev, message]);
  };

  const startNewChat = () => {
    if (!flowId) {
      return;
    }
    const fresh = nanoid();
    try {
      if (chatSessionId) {
        localStorage.removeItem(messagesStorageKey(flowId, chatSessionId));
      }
      localStorage.setItem(sessionStorageKey(flowId), fresh);
    } catch {
      // ignore storage errors, the in-memory session still resets
    }
    setMessages([]);
    setChatSessionId(fresh);
  };

  if (!flowId) {
    return <ChatNotFound />;
  }
  if (isLoading) {
    return <LoadingScreen />;
  }

  const isDraft =
    hasDraftSearchParam || (flow && isNil(flow.publishedVersionId));
  return (
    <FlowChat
      flowId={flowId}
      mode={isDraft ? ChatDrawerSource.TEST_FLOW : null}
      embedded={isEmbedded}
      onNewChat={startNewChat}
      onSendingMessage={() => {}}
      onError={(error) => {
        console.error('Chat error:', error);
      }}
      messages={messages}
      chatSessionId={chatSessionId}
      onAddMessage={addMessage}
      onSetSessionId={setChatSessionId}
    />
  );
}
