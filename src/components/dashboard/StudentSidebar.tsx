
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
import { 
  BookOpen, 
  LayoutDashboard, 
  Award,
  User,
  LogOut
} from 'lucide-react';

interface StudentSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const StudentSidebar = ({ activeSection, setActiveSection }: StudentSidebarProps) => {
  const { profile, signOut } = useAuth();

  const menuItems = [
    {
      title: "Exams",
      value: "exams",
      icon: BookOpen,
    },
    {
      title: "Results",
      value: "results",
      icon: Award,
    },
    {
      title: "Profile",
      value: "profile",
      icon: User,
    },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-lg font-semibold">Exam Nexus</h1>
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
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton 
                    onClick={() => setActiveSection(item.value)}
                    isActive={activeSection === item.value}
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
      
      <SidebarFooter className="p-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</p>
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
