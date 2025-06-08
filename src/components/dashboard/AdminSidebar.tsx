
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
  Users,
  Shield
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
    ...(profile?.is_super_admin ? [{
      title: "Admin Applications",
      icon: Shield,
      id: "admin-applications"
    }] : []),
    {
      title: "Profile",
      icon: Settings,
      id: "profile"
    }
  ];

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="font-semibold text-sm sm:text-lg text-sidebar-foreground truncate">Exam Antyvest</h1>
            <p className="text-xs sm:text-sm text-sidebar-foreground/70 truncate">
              {profile?.is_super_admin ? 'Super Admin Panel' : 'Admin Panel'}
            </p>
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
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-sm sm:text-base"
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs sm:text-sm text-sidebar-foreground/70">Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 py-2">
              <CreateExamDialog />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border p-3 sm:p-4">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-sidebar-foreground/70 truncate">Welcome, {profile?.full_name}</p>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-xs sm:text-sm">
            <LogOut className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
