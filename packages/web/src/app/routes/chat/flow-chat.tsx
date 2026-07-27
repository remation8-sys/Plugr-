import {
  ApErrorParams,
  ChatUIResponse,
  ErrorCode,
  isNil,
  HumanInputFormResultTypes,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { RotateCcw, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useEffect, useRef, useState } from 'react';

import { ChatDrawerSource } from '@/app/builder/types';
import { LoadingScreen } from '@/components/custom/loading-screen';
import { Button } from '@/components/ui/button';
import {
  ChatInput,
  ChatMessage,
  ChatIntro,
  ImageDialog,
  ChatMessageList,
  Messages,
} from '@/features/chat';
import { humanInputApi } from '@/features/forms';
import { cn } from '@/lib/utils';

import NotFoundPage from '../404-page';

interface FlowChatProps {
  flowId: string;
  className?: string;
  showWelcomeMessage?: boolean;
  mode: ChatDrawerSource | null;
  onError?: (error: ApErrorParams | null) => void;
  onSendingMessage?: (message: ChatMessage) => void;
  closeChat?: () => void;
  messages?: Messages;
  chatSessionId?: string | null;
  onAddMessage?: (message: Messages[0]) => void;
  onSetSessionId?: (sessionId: string) => void;
  embedded?: boolean;
  onNewChat?: () => void;
}

export function FlowChat({
  flowId,
  className,
  showWelcomeMessage = true,
  mode,
  onError,
  onSendingMessage,
  closeChat,
  messages = [],
  chatSessionId,
  onAddMessage,
  onSetSessionId,
  embedded = false,
  onNewChat,
}: FlowChatProps) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const {
    data: chatUI,
    isLoading,
    isError: isLoadingError,
  } = useQuery<ChatUIResponse | null, Error>({
    queryKey: ['chat', flowId],
    queryFn: () =>
      humanInputApi.getChatUI(
        flowId,
        mode === ChatDrawerSource.TEST_FLOW ||
          mode === ChatDrawerSource.TEST_STEP
          ? true
          : false,
      ),
    enabled: !isNil(flowId),
    staleTime: Infinity,
    retry: false,
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      const lastMessage = document.getElementById('last-message');
      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Initialize chat session ID if not set and we have the callback
  useEffect(() => {
    if (!chatSessionId && onSetSessionId) {
      onSetSessionId(nanoid());
    }
  }, [chatSessionId, onSetSessionId]);

  const previousInputRef = useRef('');
  const previousFilesRef = useRef<File[]>([]);
  const [sendingError, setSendingError] = useState<ApErrorParams | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const botName =
    chatUI?.props.botName ?? `${chatUI?.platformName ?? 'Plugr'} Bot`;

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async ({
      isRetrying,
      message,
    }: {
      isRetrying: boolean;
      message?: ChatMessage;
    }) => {
      if (!flowId || !chatSessionId) return null;

      const savedInput = isRetrying
        ? previousInputRef.current
        : message?.textContent || '';
      const savedFiles = isRetrying
        ? previousFilesRef.current
        : message?.files || [];

      previousInputRef.current = savedInput;
      previousFilesRef.current = savedFiles;

      if (!isRetrying && message && onAddMessage) {
        onAddMessage({
          role: 'user',
          textContent: savedInput,
          files: savedFiles.map((file) => ({
            url: URL.createObjectURL(file),
            mimeType: file.type,
          })),
        });
      }

      scrollToBottom();
      const isDraft = mode === ChatDrawerSource.TEST_FLOW;
      const isTestStep = mode === ChatDrawerSource.TEST_STEP;
      return humanInputApi.sendMessage({
        flowId,
        chatId: chatSessionId,
        message: savedInput,
        files: savedFiles,
        mode: isDraft ? 'draft' : isTestStep ? 'test' : 'locked',
      });
    },

    onSuccess: (result) => {
      if (mode === ChatDrawerSource.TEST_STEP) {
        closeChat?.();
      }
      if (!result) {
        const error: ApErrorParams = {
          code: ErrorCode.NO_CHAT_RESPONSE,
          params: {},
        };
        setSendingError(error);
        onError?.(error);
        return;
      }

      if ('type' in result && onAddMessage) {
        setSendingError(null);
        onError?.(null);

        switch (result.type) {
          case HumanInputFormResultTypes.FILE: {
            if ('url' in result.value) {
              onAddMessage({
                role: 'bot',
                files: [
                  {
                    url: result.value.url,
                    mimeType: result.value.mimeType,
                  },
                ],
              });
            }
            break;
          }

          case HumanInputFormResultTypes.MARKDOWN: {
            const validFiles = (result.files ?? []).filter(
              (file) => 'url' in file && 'mimeType' in file,
            );

            onAddMessage({
              role: 'bot',
              textContent: result.value,
              files: validFiles.length > 0 ? validFiles : undefined,
            });
            break;
          }
        }
      }

      scrollToBottom();

      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
        }
      }, 100);
    },

    onError: (error: AxiosError) => {
      const errorData = error.response?.data as ApErrorParams;
      setSendingError(errorData);
      onError?.(errorData);
      scrollToBottom();
    },
  });

  useEffect(scrollToBottom, [messages, isSending]);

  const handleSendMessage = (message: ChatMessage) => {
    onSendingMessage?.(message);
    sendMessage({ isRetrying: false, message });
  };

  if (isLoadingError) {
    return <ChatNotFound />;
  }

  if (isLoading) return <LoadingScreen />;

  const toggleImageDialog = (imageUrl: string | null) => {
    setImageDialogOpen(!!imageUrl);
    setSelectedImage(imageUrl);
  };

  return (
    <main
      className={cn(
        'relative flex h-[var(--mobile-viewport-height,100dvh)] w-full flex-col md:h-screen',
        className,
      )}
      data-mobile-keyboard-viewport
    >
      {embedded && (
        <header className="flex w-full shrink-0 items-center justify-between border-b bg-background px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            {chatUI?.platformLogoUrl && (
              <img
                src={chatUI.platformLogoUrl}
                alt=""
                className="size-5 shrink-0 rounded-full object-cover"
              />
            )}
            <span className="truncate text-sm font-medium">{botName}</span>
          </div>
          <div className="flex items-center gap-1">
            {onNewChat && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Start a new chat"
                onClick={onNewChat}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close chat"
              onClick={() =>
                window.parent.postMessage({ type: 'plugr-chat:close' }, '*')
              }
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>
      )}
      {!embedded && onNewChat && messages.length > 0 && (
        <div className="absolute right-3 top-3 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={onNewChat}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New chat
          </Button>
        </div>
      )}
      <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pb-6">
        {messages.length > 0 ? (
          <>
            <ChatMessageList
              messagesRef={messagesRef}
              messages={messages}
              chatUI={chatUI}
              sendingError={sendingError}
              isSending={isSending}
              flowId={flowId}
              sendMessage={sendMessage}
              setSelectedImage={toggleImageDialog}
            />
            <div className="w-full max-w-3xl px-4" data-mobile-keyboard-anchor>
              <ChatInput
                ref={chatInputRef}
                onSendMessage={handleSendMessage}
                disabled={isSending}
                placeholder="Type your message here..."
              />
            </div>
          </>
        ) : (
          <>
            {showWelcomeMessage && (
              <ChatIntro chatUI={chatUI} botName={botName} />
            )}
            <div
              className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] w-full max-w-3xl px-4 md:bottom-6"
              data-mobile-keyboard-anchor
            >
              <ChatInput
                ref={chatInputRef}
                onSendMessage={handleSendMessage}
                disabled={isSending}
                placeholder="Type your message here..."
              />
            </div>
          </>
        )}
      </div>
      <ImageDialog
        open={imageDialogOpen}
        onOpenChange={(open) => {
          setImageDialogOpen(open);
          if (!open) setSelectedImage(null);
        }}
        imageUrl={selectedImage}
      />
    </main>
  );
}

export const ChatNotFound = () => {
  return (
    <NotFoundPage
      title="Hmm... this chat isn't here"
      description="The chat you're looking for isn't here or maybe hasn't been published by the owner yet"
    />
  );
};
