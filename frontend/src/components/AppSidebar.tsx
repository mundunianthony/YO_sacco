import { Home, Users, DollarSign, CreditCard, Bell, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const isAdmin = currentUser.role === "admin";

  const adminItems = [
    { title: "Dashboard", url: "/admin-dashboard", icon: Home },
    { title: "Members", url: "/admin/members", icon: Users },
    { title: "Loans", url: "/admin/loans", icon: CreditCard },
    { title: "Notifications", url: "/admin/notifications", icon: Bell },
  ];

  const memberItems = [
    { title: "Dashboard", url: "/member-dashboard", icon: Home },
    { title: "Savings", url: "/member/savings", icon: DollarSign },
    { title: "Loans", url: "/member/loans", icon: CreditCard },
    { title: "Notifications", url: "/member/notifications", icon: Bell },
    { title: "Profile", url: "/member/profile", icon: User },
  ];

  const items = isAdmin ? adminItems : memberItems;

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isAdmin ? "Admin Panel" : "Member Panel"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
