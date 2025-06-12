
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const AdminNotifications = () => {
  const [selectedMember, setSelectedMember] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");

  // Mock data for notifications
  const notifications = [
    {
      id: 1,
      type: "Loan Application",
      message: "John Doe applied for a $5,000 personal loan",
      date: "2024-06-12 10:30 AM",
      readStatus: false
    },
    {
      id: 2,
      type: "Repayment Due",
      message: "Jane Smith has a loan payment due tomorrow",
      date: "2024-06-11 2:15 PM",
      readStatus: true
    },
    {
      id: 3,
      type: "New Member",
      message: "Bob Johnson joined the sacco",
      date: "2024-06-10 9:45 AM",
      readStatus: true
    },
  ];

  // Mock data for members with active loans
  const membersWithLoans = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "Bob Johnson" },
  ];

  const handleSendReminder = () => {
    if (selectedMember && reminderMessage) {
      console.log(`Sending reminder to ${selectedMember}: ${reminderMessage}`);
      // Logic to send reminder
      setSelectedMember("");
      setReminderMessage("");
    }
  };

  const markAsRead = (notificationId: number) => {
    console.log(`Mark notification ${notificationId} as read`);
    // Logic to mark notification as read
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage notifications and send reminders
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>
                  System notifications and alerts
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
                      <TableRow key={notification.id}>
                        <TableCell>
                          <Badge variant="outline">{notification.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {notification.message}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {notification.date}
                        </TableCell>
                        <TableCell>
                          <Badge variant={notification.readStatus ? "secondary" : "default"}>
                            {notification.readStatus ? "Read" : "Unread"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!notification.readStatus && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
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
          </div>

          {/* Send Reminder Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Send Reminder</CardTitle>
                <CardDescription>
                  Send payment reminders to members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Member</label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {membersWithLoans.map((member) => (
                        <SelectItem key={member.id} value={member.name}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Enter reminder message..."
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleSendReminder}
                  disabled={!selectedMember || !reminderMessage}
                  className="w-full"
                >
                  Send Reminder
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminNotifications;
