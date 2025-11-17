// Lightweight cross-page/task sync using BroadcastChannel and window CustomEvent

export type TaskMovedPayload = {
  type: 'TASK_MOVED';
  projectId: string;
  taskId: number;
  from: { sprintId: number | null; columnId?: number | null };
  to: { sprintId: number | null; columnId?: number | null };
};

type TaskEvent = TaskMovedPayload;

const CHANNEL_NAME = 'tasks-sync';

let sharedChannel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  try {
    if (!sharedChannel) {
      sharedChannel = new BroadcastChannel(CHANNEL_NAME);
    }
    return sharedChannel;
  } catch {
    return null;
  }
}

export function publishTaskMoved(payload: TaskMovedPayload) {
  try {
    // In-app event for same document/components
    const evt = new CustomEvent('task:moved', { detail: payload });
    window.dispatchEvent(evt);
  } catch {}

  // Cross-tab/channel broadcast
  const channel = getChannel();
  try {
    channel?.postMessage(payload);
  } catch {}
}

export function subscribeTaskEvents(onTaskMoved: (payload: TaskMovedPayload) => void) {
  const windowHandler = (e: Event) => {
    const ce = e as CustomEvent<TaskEvent>;
    if (ce.detail?.type === 'TASK_MOVED') {
      onTaskMoved(ce.detail);
    }
  };
  window.addEventListener('task:moved', windowHandler as EventListener);

  const channel = getChannel();
  const bcHandler = (e: MessageEvent<TaskEvent>) => {
    const data = e.data;
    if (data?.type === 'TASK_MOVED') {
      onTaskMoved(data);
    }
  };
  if (channel) {
    // Some browser implementations use addEventListener; others set onmessage
    try {
      (channel as any).addEventListener?.('message', bcHandler);
    } catch {
      (channel as any).onmessage = bcHandler as any;
    }
  }

  return () => {
    window.removeEventListener('task:moved', windowHandler as EventListener);
    if (channel) {
      try {
        (channel as any).removeEventListener?.('message', bcHandler);
      } catch {}
      // Intentionally keep channel open for shared use
    }
  };
}