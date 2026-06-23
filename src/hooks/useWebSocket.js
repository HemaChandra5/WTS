
import { useEffect, useRef } from 'react';

export const useWebSocket = (
  url,
  onMessage,
  onError
) => {
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  useEffect(() => {
    // Don't create a socket if URL is null
    if (!url) return;

    const token = localStorage.getItem('token');
    const wsUrl = `${url}?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Only files socket needs initial data
      if (url.includes('/ws/files/')) {
        ws.send(
          JSON.stringify({
            action: 'get_files',
          })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch (err) {
        console.error(
          'Failed to parse websocket message:',
          err
        );
      }
    };

    ws.onerror = (error) => {
      console.error(
        '❌ WebSocket error:',
        error
      );

      onErrorRef.current?.(error);
    };

    ws.onclose = () => {
      // Socket closed; reconnection strategy (if needed) is handled by caller lifecycle.
    };

    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, [url]);
};
