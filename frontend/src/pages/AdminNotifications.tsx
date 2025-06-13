import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";

interface Notification {
  _id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  memberId: string;
}

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notificationsRes, membersRes] = await Promise.all([
        adminApi.getNotifications(),
        adminApi.getUsers()
      ]);
      setNotifications(notificationsRes.data.data);
      setMembers(membersRes.data.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!selectedMember || !reminderMessage) {
      toast({
        title: "Error",
        description: "Please select a member and enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      await adminApi.sendReminder(selectedMember, { message: reminderMessage });
      toast({
        title: "Success",
        description: "Reminder sent successfully",
      });
      setSelectedMember("");
      setReminderMessage("");
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await adminApi.markNotificationAsRead(notificationId);
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
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
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage system notifications and send reminders
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                View and manage system notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification._id}>
                      <TableCell>
                        <Badge variant="outline">{notification.type}</Badge>
                      </TableCell>
                      <TableCell>{notification.message}</TableCell>
                      <TableCell>
                        {new Date(notification.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={notification.read ? "secondary" : "default"}
                        >
                          {notification.read ? "Read" : "Unread"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!notification.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(notification._id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Reminder</CardTitle>
              <CardDescription>
                Send payment reminders to members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Member</label>
                <Select
                  value={selectedMember}
                  onValueChange={setSelectedMember}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.firstName} {member.lastName} ({member.memberId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Enter reminder message"
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSendReminder}
                disabled={!selectedMember || !reminderMessage}
              >
                Send Reminder
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminNotifications;
