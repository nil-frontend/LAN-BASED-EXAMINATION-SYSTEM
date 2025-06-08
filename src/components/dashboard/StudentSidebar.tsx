
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ui/theme-toggle';
import { 
  BookOpen, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut,
  Users
} from 'lucide-react';

interface StudentSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const StudentSidebar = ({ activeTab, setActiveTab }: StudentSidebarProps) => {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: BarChart3,
      id: "dashboard"
    },
    {
      title: "Take Exam",
      icon: FileText,
      id: "exams"
    },
    {
      title: "My Results",
      icon: Users,
      id: "results"
    },
    {
      title: "Profile",
      icon: Settings,
      id: "profile"
    }
  ];

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="font-semibold text-sm sm:text-lg text-sidebar-foreground truncate">Exam Antyvest</h1>
            <p className="text-xs sm:text-sm text-sidebar-foreground/70 truncate">Student Portal</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs sm:text-sm text-sidebar-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground text-sm sm:text-base"
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t p-3 sm:p-4">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-sidebar-foreground/70 truncate">Welcome, {profile?.full_name}</p>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full text-xs sm:text-sm">
            <LogOut className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default StudentSidebar;
