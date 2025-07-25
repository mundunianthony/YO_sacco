import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { notificationApi } from "@/lib/api";
import { Bell, CheckCircle, AlertCircle, Info } from "lucide-react";

interface Notification {
  _id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
}

const MemberNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getNotifications();
      console.log('Notifications response:', response);
      
      // Handle different response structures
      let notificationsData = [];
      let backendUnreadCount = 0;
      
      if (response.data && response.data.data && response.data.data.notifications) {
        notificationsData = response.data.data.notifications;
        backendUnreadCount = response.data.data.unreadCount || 0;
      } else if (response.data && response.data.notifications) {
        notificationsData = response.data.notifications;
        backendUnreadCount = response.data.unreadCount || 0;
      } else if (Array.isArray(response.data)) {
        notificationsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        notificationsData = response.data.data;
      }
      
      setNotifications(notificationsData);
      console.log('Processed notifications:', notificationsData);
      console.log('Backend unread count:', backendUnreadCount);
      console.log('Calculated unread count:', notificationsData.filter(n => !n.read).length);
      
      // Use backend unread count if available, otherwise calculate from notifications
      if (backendUnreadCount > 0) {
        setUnreadCount(backendUnreadCount);
      } else {
        setUnreadCount(notificationsData.filter(n => !n.read).length);
      }
      
      // Debug individual notifications
      notificationsData.forEach((notification, index) => {
        console.log(`Notification ${index}:`, {
          id: notification._id,
          type: notification.type,
          read: notification.read,
          message: notification.message?.substring(0, 50) + '...'
        });
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'loan_application':
      case 'loan_approved':
      case 'loan_rejected':
      case 'loan_payment':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'deposit':
      case 'withdrawal':
      case 'interest_earned':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'admin_reminder':
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'loan_application':
        return 'Loan Application';
      case 'loan_approved':
        return 'Loan Approved';
      case 'loan_rejected':
        return 'Loan Rejected';
      case 'loan_payment':
        return 'Loan Payment';
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'interest_earned':
        return 'Interest Earned';
      case 'admin_reminder':
        return 'Reminder';
      case 'overdue':
        return 'Overdue';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Notifications</h1>
            <p className="text-muted-foreground">
              View and manage your notifications
            </p>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Bell className="h-3 w-3" />
                {unreadCount} unread
              </Badge>
            )}
            {notifications.some(n => !n.read) && (
              <Button onClick={markAllAsRead}>
                Mark All as Read
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Notifications</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </div>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
                </div>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Read</p>
                  <p className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Your latest notifications and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No notifications yet</h3>
                <p className="text-sm text-muted-foreground">
                  You'll see notifications here when there are updates about your account.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      notification.read ? 'bg-muted/50' : 'bg-background border-primary/20'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                            {notification.priority}
                          </Badge>
                          {!notification.read && (
                            <Badge variant="destructive" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{notification.message}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {!notification.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(notification._id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MemberNotifications; 