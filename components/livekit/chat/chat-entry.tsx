import * as React from 'react';
import type { MessageFormatter, ReceivedChatMessage } from '@livekit/components-react';
import { cn } from '@/lib/utils';
import { useChatMessage } from './hooks/utils';

// 辅助函数：将ReactNode转为纯文本
function extractTextFromReactNode(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromReactNode).join('');
  if (React.isValidElement(node)) return extractTextFromReactNode((node.props as { children?: React.ReactNode }).children);
  return '';
}

export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /** The chat massage object to display. */
  entry: ReceivedChatMessage;
  /** Hide sender name. Useful when displaying multiple consecutive chat messages from the same person. */
  hideName?: boolean;
  /** Hide message timestamp. */
  hideTimestamp?: boolean;
  /** An optional formatter for the message body. */
  messageFormatter?: MessageFormatter;
}

export const ChatEntry = ({
  entry,
  messageFormatter,
  hideName,
  hideTimestamp,
  className,
  ...props
}: ChatEntryProps) => {
  const { message, hasBeenEdited, time, locale, name } = useChatMessage(entry, messageFormatter);

  const isUser = entry.from?.isLocal ?? false;
  const messageOrigin = isUser ? 'remote' : 'local';

  return (
    <li
      data-lk-message-origin={messageOrigin}
      title={time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      className={cn('group flex flex-col gap-0.5', className)}
      {...props}
    >
      {(!hideTimestamp || !hideName || hasBeenEdited) && (
        <span className="text-muted-foreground flex text-sm">
          {!hideName && <strong className="mt-2">{name}</strong>}

          {!hideTimestamp && (
            <span className={cn(
              "align-self-end font-mono text-xs transition-opacity ease-linear",
              isUser ? "ml-auto" : "mr-auto"
            )}>
              {hasBeenEdited && '*'}
              {time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </span>
      )}

      <div className={cn('flex items-start', isUser ? 'justify-end' : 'justify-start')}>
        <span className={cn('max-w-4/5 rounded-[20px] p-2', isUser ? 'bg-muted ml-auto' : 'mr-auto')}>
          {message}
        </span>
        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(extractTextFromReactNode(message));
            }
          }}
          title="复制消息"
          className={cn("ml-2 mt-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors align-self-start", isUser ? '' : 'order-first mr-2 ml-0')}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="4" y="4" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/><rect x="7" y="2" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/></svg>
        </button>
      </div>
    </li>
  );
};
