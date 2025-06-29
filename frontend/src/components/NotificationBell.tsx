import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { notificationApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface Notification {
  _id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    console.log('Fetching notifications...');
    try {
      const response = await notificationApi.getNotifications();
      console.log('Notifications Response:', response.data);
      let notifications: Notification[] = [];
      if (response.data.success && response.data.data?.notifications) {
        notifications = response.data.data.notifications;
      } else if (response.data.status === 'success' && response.data.data?.notifications) {
        notifications = response.data.data.notifications;
      } else if (Array.isArray(response.data.notifications)) {
        notifications = response.data.notifications;
      } else {
        console.error('Unexpected notifications response shape:', response.data);
      }
      setNotifications(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    console.log('Marking notification as read:', notificationId);
    try {
      const response = await notificationApi.markAsRead(notificationId);
      console.log('Mark as read response:', response.data);
      
      setNotifications(prevNotifications => {
        const updated = prevNotifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        );
        console.log('Updated notifications:', updated);
        return updated;
      });

      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    console.log('Marking all notifications as read');
    try {
      const response = await notificationApi.markAllAsRead();
      console.log('Mark all as read response:', response.data);
      
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('NotificationBell mounted');
    fetchNotifications();
    // Set up polling for new notifications every minute
    const interval = setInterval(() => {
      console.log('Polling for new notifications...');
      fetchNotifications();
    }, 60000);
    return () => {
      console.log('NotificationBell unmounting');
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  console.log('Current unread count:', unreadCount);
  console.log('Current notifications:', notifications);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification._id}
              className={`flex flex-col items-start p-3 ${!notification.read ? 'bg-muted' : ''}`}
              onClick={() => !notification.read && handleMarkAsRead(notification._id)}
            >
              <div className="flex items-start justify-between w-full">
                <div className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                  {notification.type === 'admin_reminder' && (
                    <span className="inline-block mr-2 px-2 py-0.5 rounded bg-yellow-200 text-yellow-800 text-xs font-semibold">REMINDER</span>
                  )}
                  {notification.message}
                </div>
                {notification.read && (
                  <Check className="h-4 w-4 text-green-500 ml-2 flex-shrink-0" />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(notification.createdAt).toLocaleDateString()}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
