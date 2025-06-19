import { api } from './api';

export const notificationApi = {
  getNotifications: () => api.get('/notifications'),
  
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
  
  deleteAllNotifications: () => api.delete('/notifications'),

  // Add broadcast notification endpoint
  createBroadcastNotification: (data: { message: string; type: string; priority?: string; category?: string }) => 
    api.post('/notifications/broadcast', data),
}; 