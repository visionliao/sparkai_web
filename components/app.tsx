'use client';

import { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { motion } from 'motion/react';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { SessionView } from '@/components/session-view';
import { Toaster } from '@/components/ui/sonner';
import { Welcome } from '@/components/welcome';
import useConnectionDetails from '@/hooks/useConnectionDetails';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import type { AppConfig } from '@/lib/types';
import Login from './Login';

const MotionWelcome = motion.create(Welcome);
const MotionSessionView = motion.create(SessionView);

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  // 所有Hook无条件调用
  const [user, setUser] = useState<{ name: string; identity: string } | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const { connectionDetails, refreshConnectionDetails } = useConnectionDetails();

  // 用户消息保存更多信息，AI消息只保存基础信息
  const handleSessionEnd = async (messages: any[]) => {
    if (messages && messages.length > 0) {
      const filtered = messages.map((msg) => {
        const isUser = msg.from?.isLocal;
        if (isUser) {
          return {
            id: msg.id,
            message: msg.message,
            role: 'user',
            name: user?.name ?? '',
            identity: user?.identity ?? '',
            sid: msg.from?.sid ?? '',
            timestamp: msg.timestamp,
          };
        } else {
          return {
            id: msg.id,
            message: msg.message,
            role: 'ai',
            timestamp: msg.timestamp,
          };
        }
      });
      try {
        await fetch('/api/save-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: filtered }),
        });
      } catch (e) {
        // 可选：toastAlert({ title: '保存失败', description: String(e) });
      }
    }
    // 结束会话时销毁 Room 实例，并重置 sessionStarted
    setRoom(null);
    setSessionStarted(false);
  };

  // 监听 Room 事件
  useEffect(() => {
    if (!room) return;
    const onDisconnected = () => {
      setSessionStarted(false);
      refreshConnectionDetails();
    };
    const onMediaDevicesError = (error: Error) => {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room, refreshConnectionDetails]);

  // 会话开始时新建 Room 实例并连接
  useEffect(() => {
    if (sessionStarted && connectionDetails) {
      const newRoom = new Room();
      setRoom(newRoom);
      Promise.all([
        newRoom.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: appConfig.isPreConnectBufferEnabled,
        }),
        newRoom.connect(connectionDetails.serverUrl, connectionDetails.participantToken),
      ]).catch((error) => {
        toastAlert({
          title: 'There was an error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
      });
      return () => {
        newRoom.disconnect();
      };
    }
    // 结束会话时断开并销毁 Room
    if (!sessionStarted && room) {
      room.disconnect();
      setRoom(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStarted, connectionDetails, appConfig.isPreConnectBufferEnabled]);

  // 只在return里条件渲染
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const { startButtonText } = appConfig;

  return (
    <>
      <MotionWelcome
        key="welcome"
        startButtonText={startButtonText}
        onStartCall={() => setSessionStarted(true)}
        disabled={sessionStarted}
        initial={{ opacity: 0 }}
        animate={{ opacity: sessionStarted ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'linear', delay: sessionStarted ? 0 : 0.5 }}
      />

      {room && (
        <RoomContext.Provider value={room}>
          <RoomAudioRenderer />
          <StartAudio label="Start Audio" />
          {/* --- */}
          <MotionSessionView
            key="session-view"
            appConfig={appConfig}
            disabled={!sessionStarted}
            sessionStarted={sessionStarted}
            initial={{ opacity: 0 }}
            animate={{ opacity: sessionStarted ? 1 : 0 }}
            transition={{
              duration: 0.5,
              ease: 'linear',
              delay: sessionStarted ? 0.5 : 0,
            }}
            onSessionEnd={handleSessionEnd}
          />
        </RoomContext.Provider>
      )}

      <Toaster />
    </>
  );
}
