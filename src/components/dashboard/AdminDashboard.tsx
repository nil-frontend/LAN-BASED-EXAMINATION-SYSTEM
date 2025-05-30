
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText,
  Users,
  Award,
  UserCheck,
  Trophy,
  Medal
} from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import CreateExamDialog from './CreateExamDialog';
import PasswordUpdateDialog from './PasswordUpdateDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [exams, setExams] = useState([]);
  const [toppers, setToppers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExams(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch exams",
        variant: "destructive",
      });
    }
  };

  const fetchToppers = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          *,
          profiles!exam_results_student_id_fkey(full_name),
          exams(title)
        `)
        .order('percentage', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      setToppers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch results",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchExams();
    fetchToppers();
  }, []);

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-xs text-muted-foreground">
              Exams created
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Registered students
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Results</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toppers.length}</div>
            <p className="text-xs text-muted-foreground">
              Exam results
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with these common tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <CreateExamDialog onExamCreated={fetchExams} />
        </CardContent>
      </Card>
    </div>
  );

  const renderExams = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manage Exams</h2>
          <p className="text-muted-foreground">Create and manage your exams</p>
        </div>
        <CreateExamDialog onExamCreated={fetchExams} />
      </div>
      
      <div className="grid gap-4">
        {exams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exams yet</h3>
              <p className="text-gray-600 mb-4">Create your first exam to get started</p>
            </CardContent>
          </Card>
        ) : (
          exams.map((exam: any) => (
            <Card key={exam.id}>
              <CardHeader>
                <CardTitle>{exam.title}</CardTitle>
                <CardDescription>{exam.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Duration: {exam.duration_minutes} minutes</span>
                  <span>Total Marks: {exam.total_marks}</span>
                  <span>Status: {exam.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Top Performers</h2>
        <p className="text-muted-foreground">Top 3 highest scoring students</p>
      </div>
      
      <div className="grid gap-4">
        {toppers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
              <p className="text-gray-600">Results will appear here once students take exams</p>
            </CardContent>
          </Card>
        ) : (
          toppers.map((result: any, index: number) => {
            const icons = [Trophy, Medal, Award];
            const Icon = icons[index] || Award;
            const positions = ['1st', '2nd', '3rd'];
            const colors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
            
            return (
              <Card key={result.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <Icon className={`h-8 w-8 ${colors[index]}`} />
                    <div>
                      <h3 className="font-semibold">{positions[index]} Place</h3>
                      <p className="text-sm text-muted-foreground">{result.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{result.exams?.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{result.percentage}%</p>
                    <p className="text-sm text-muted-foreground">{result.score}/{result.total_marks} marks</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <p className="text-gray-900">{profile?.full_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{profile?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Role</label>
            <p className="text-gray-900 flex items-center">
              <UserCheck className="h-4 w-4 mr-2" />
              Administrator
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <p className="text-green-600">Approved</p>
          </div>
          <div className="pt-4">
            <PasswordUpdateDialog />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'exams':
        return renderExams();
      case 'results':
        return renderResults();
      case 'profile':
        return renderProfile();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      <SidebarProvider>
        <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <SidebarInset>
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default AdminDashboard;
