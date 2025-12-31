// src/components/ui/ToastNotification.jsx
import { useEffect, useState } from "react";
import "../../styles/ToastNotifications.css";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export default function ToastNotification({
  type = "success",
  message,
  onClose,
  duration = 4000,
}) {
  const [state, setState] = useState("enter"); // enter | exit

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setState("exit");
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration]);

  useEffect(() => {
    if (state === "exit") {
      const exitTimer = setTimeout(() => {
        onClose?.();
      }, 300); // must match exit animation
      return () => clearTimeout(exitTimer);
    }
  }, [state, onClose]);

  if (!message) return null;

  const Icon = type === "success" ? CheckCircle : AlertCircle;
  const bg = type === "success" ? "bg-green-600" : "bg-red-600";

  return (
    <div
      className={`toast-final ${bg} toast-${state}`}
      role="status"
      aria-live="polite"
    >
      <Icon className="toast-icon" />
      <span className="toast-text">{message}</span>
      <button onClick={() => setState("exit")} className="toast-close">
        <X />
      </button>
    </div>
  );
}
