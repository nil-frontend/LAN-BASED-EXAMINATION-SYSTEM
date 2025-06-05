
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
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="font-semibold text-lg">Exam Antyvest</h1>
            <p className="text-sm text-muted-foreground">Student Portal</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t p-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</p>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default StudentSidebar;
