// src/components/ui/ToastNotification.jsx
import { useEffect } from 'react';
import '../../styles/ToastNotifications.css';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function ToastNotification({ type, message, onClose, duration = 4000 }) {
  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  // 🕒 Auto-close after 'duration' ms
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  return (
    <div
      className={`fixed top-[80px] right-4 z-50 flex flex-col space-y-1 rounded-md p-3 shadow-lg text-white ${bgColor} animate-slide-in w-96`}
    >
      <div className="flex items-center justify-between space-x-2">
        <Icon className="w-5 h-5" />
        <p className="font-medium flex-1">{message}</p>
        <button onClick={onClose} className="focus:outline-none">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ⏳ Progress bar animation */}
      <div
        className="h-1 rounded bg-white bg-opacity-70 animate-loading-bar"
        style={{ animationDuration: `${duration}ms` }}
      ></div>
    </div>
  );
}
