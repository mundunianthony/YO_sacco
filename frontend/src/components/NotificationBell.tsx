
import { useState } from "react";
import { Bell } from "lucide-react";
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

export const NotificationBell = () => {
  const [notifications] = useState([
    {
      id: 1,
      type: "loan_application",
      message: "New loan application submitted by John Doe",
      date: "2024-06-12",
      read: false,
    },
    {
      id: 2,
      type: "repayment_reminder",
      message: "Loan repayment due tomorrow",
      date: "2024-06-11",
      read: false,
    },
    {
      id: 3,
      type: "deposit_confirmation",
      message: "Your deposit of $500 has been processed",
      date: "2024-06-10",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

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
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.map((notification) => (
          <DropdownMenuItem key={notification.id} className="flex flex-col items-start">
            <div className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
              {notification.message}
            </div>
            <div className="text-xs text-muted-foreground">{notification.date}</div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
