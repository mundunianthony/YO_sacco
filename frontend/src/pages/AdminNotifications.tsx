import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";

interface Notification {
  _id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    memberId: string;
  };
}

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  memberId: string;
}

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      const [notificationsRes, transactionsRes, membersRes] = await Promise.all([
        adminApi.getNotifications(),
        adminApi.getTransactions({ limit: 50 }),
        adminApi.getUsers()
      ]);
      
      // Handle different response structures
      setNotifications(notificationsRes.data.data?.notifications || notificationsRes.data.notifications || []);
      setTransactions(transactionsRes.data.data || transactionsRes.data || []);
      setMembers(membersRes.data.data || membersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-100 text-green-800';
      case 'withdrawal':
        return 'bg-red-100 text-red-800';
      case 'loan_payment':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold">Notifications & Transactions</h1>
          <p className="text-muted-foreground">
            Manage system notifications and view recent transactions
          </p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
            <TabsTrigger value="reminders">Send Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>System Notifications</CardTitle>
                <CardDescription>
                  View and manage system notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No notifications found</p>
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  View all recent system transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No transactions found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {transaction.user?.firstName} {transaction.user?.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {transaction.user?.memberId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTransactionTypeColor(transaction.type)}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            UGX{transaction.amount?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.paymentMethod}</TableCell>
                          <TableCell>
                            {new Date(transaction.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reminders">
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminNotifications;
