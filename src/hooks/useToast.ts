import { useCallback, useEffect, useRef, useState } from "react";

const TOAST_MS = 2400;

export interface ToastController {
  message: string;
  visible: boolean;
  notify: (message: string) => void;
}

export function useToast(): ToastController {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((next: string) => {
    setMessage(next);
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), TOAST_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { message, visible, notify };
}
