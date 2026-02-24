import api from './api';

// Simple in-memory pub/sub for notification updates
const subscribers = new Set();
let lastFetched = null;
let pollInterval = null;
const POLL_MS = 30000; // 30s

function notifySubscribers(update) {
  subscribers.forEach((cb) => {
    try {
      cb(update);
    } catch (err) {
    }
  });
}

async function getAllNotifications(options = {}) {
  try {
    const res = await api.get('/api/notifications/student');
    const data = res.data?.data || [];
    const unreadCount = data.filter((n) => n.status !== 'read').length;
    lastFetched = Date.now();

    notifySubscribers({ type: 'ALL_NOTIFICATIONS', data: { notifications: data, unreadCount } });
    return { notifications: data, unreadCount };
  } catch (error) {
    throw error;
  }
}

async function getCourseNotifications(courseId, options = {}) {
  try {
    // Backend may not support course-scoped notifications; pass as query param if present
    const res = await api.get('/api/notifications/student', { params: { courseId } });
    const data = res.data?.data || [];
    const unreadCount = data.filter((n) => n.status !== 'read').length;

    notifySubscribers({ type: 'COURSE_NOTIFICATIONS', courseId, data: { notifications: data, unreadCount } });
    return { notifications: data, unreadCount };
  } catch (error) {
    throw error;
  }
}

async function markAsRead(notificationIds = []) {
  try {
    // Backend supports marking single id via PUT /mark-read/:id
    await Promise.all(
      notificationIds.map((id) => api.put(`/api/notifications/mark-read/${id}`))
    );

    notifySubscribers({ type: 'MARK_AS_READ', success: true, notificationIds, optimistic: true });
    return true;
  } catch (error) {
    notifySubscribers({ type: 'MARK_AS_READ', success: false, notificationIds, optimistic: false });
    throw error;
  }
}

async function markAllAsRead(courseId = null) {
  try {
    // Fetch relevant notifications and mark them
    const { notifications } = courseId ? await getCourseNotifications(courseId) : await getAllNotifications();
    const unread = notifications.filter((n) => n.status !== 'read');
    const ids = unread.map((n) => n._id);
    if (ids.length) {
      await markAsRead(ids);
    }
    notifySubscribers({ type: 'MARK_ALL_AS_READ', success: true, courseId });
    return true;
  } catch (error) {
    notifySubscribers({ type: 'MARK_ALL_AS_READ', success: false, courseId });
    throw error;
  }
}

async function createNotification(payload) {
  try {
    const res = await api.post('/api/notifications', payload);
    const notification = res.data?.data;
    // Inform subscribers of new notification
    if (notification) {
      notifySubscribers({ type: 'NEW_NOTIFICATION', notification });
    }
    return notification;
  } catch (error) {
    throw error;
  }
}

async function deleteNotification(notificationId) {
  try {
    const res = await api.delete(`/api/notifications/${notificationId}`);
    notifySubscribers({ type: 'DELETE_NOTIFICATION', notificationId });
    return res.data;
  } catch (error) {
    throw error;
  }
}

function subscribe(cb) {
  if (typeof cb !== 'function') throw new Error('Subscriber must be a function');
  subscribers.add(cb);

  // Immediately issue a current snapshot so listeners can initialize
  // Fire off a background fetch but don't block subscribe
  getAllNotifications().catch(() => {});

  // Start poller if not running
  if (!pollInterval) {
    pollInterval = setInterval(async () => {
      try {
        await getAllNotifications();
      } catch (err) {
      }
    }, POLL_MS);
  }

  // Return unsubscribe function
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0 && pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
}

export default {
  subscribe,
  getAllNotifications,
  getCourseNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
};