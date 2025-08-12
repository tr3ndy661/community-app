export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export const sendNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    })
  }
}

export const sendUrgentNotification = (post) => {
  if (post.urgency === 'emergency') {
    sendNotification(`🚨 Emergency Help Needed!`, {
      body: `${post.title} in ${post.location}`,
      tag: 'emergency',
      requireInteraction: true
    })
  }
}