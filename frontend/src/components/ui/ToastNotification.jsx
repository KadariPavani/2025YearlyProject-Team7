// ToastNotification.jsx
import '../../styles/toastNotifications.css';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function ToastNotification({ type, message, onClose }) {
  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed top-4 right-4 z-50 flex flex-col space-y-1 rounded-md p-3 shadow-lg text-white ${bgColor} animate-slide-in w-96`}>
      <div className="flex items-center justify-between space-x-2">
        <Icon className="w-5 h-5" />
        <p className="font-medium flex-1">{message}</p>
        <button onClick={onClose} className="focus:outline-none">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-1 rounded bg-white bg-opacity-70 animate-loading-bar"></div>
    </div>
  );
}
