
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
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ui/theme-toggle';
import CreateExamDialog from './CreateExamDialog';
import { 
  BookOpen, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut,
  Plus,
  Users
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const menuItems = [
    {
      title: "Overview",
      icon: BarChart3,
      id: "overview"
    },
    {
      title: "Manage Exams",
      icon: FileText,
      id: "exams"
    },
    {
      title: "Results",
      icon: Users,
      id: "results"
    },
    {
      title: "Students",
      icon: Users,
      id: "students"
    },
    {
      title: "Profile",
      icon: Settings,
      id: "profile"
    }
  ];

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="font-semibold text-lg text-sidebar-foreground">Exam Antyvest</h1>
            <p className="text-sm text-sidebar-foreground/70">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <CreateExamDialog 
                trigger={
                  <Button 
                    className="w-full justify-start gap-2 text-white border-none shadow-sm hover:shadow-md transition-all duration-200"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    <Plus className="h-4 w-4" />
                    Create New Exam
                  </Button>
                }
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-2">
          <p className="text-sm text-sidebar-foreground/70">Welcome, {profile?.full_name}</p>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
