"use client";

import * as React from "react";
import {
  Home,
  BookOpen,
  PlusCircle,
  Edit2,
  LifeBuoy,
  Send,
  Frame,
  PieChart,
  Map,
  Command,
} from "lucide-react";

// Import your custom nav components
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";

// Import Shadcn UI sidebar components
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Andrew Davies",
    email: "m.andrew.davies@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Admin Home",
      url: "/admin/",
      icon: Home,
    },
    {
      title: "CMS",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Create Article",
          url: "/admin/create-article",
          icon: PlusCircle,
        },
        {
          title: "Edit Article",
          url: "/admin/edit-article",
          icon: Edit2,
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="w-4 h-4" />
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* Optionally include additional nav sections, e.g., NavSecondary */}
      </SidebarContent>
      {/* Optionally include a footer with user info */}
      {/* <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter> */}
    </Sidebar>
  );
}
