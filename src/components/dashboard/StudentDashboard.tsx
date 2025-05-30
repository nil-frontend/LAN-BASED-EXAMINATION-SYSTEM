
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Clock, 
  Award, 
  User,
  FileText,
  TrendingUp
} from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import StudentSidebar from './StudentSidebar';
import PasswordUpdateDialog from './PasswordUpdateDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState('exams');
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const { toast } = useToast();

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('is_active', true)
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

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          *,
          exams(title)
        `)
        .eq('student_id', profile?.id)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      setResults(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch results",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchExams();
      fetchResults();
    }
  }, [profile?.id]);

  const renderExams = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-xs text-muted-foreground">
              Exams available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
            <p className="text-xs text-muted-foreground">
              Exams completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.length > 0 
                ? Math.round(results.reduce((acc: number, result: any) => acc + result.percentage, 0) / results.length)
                : '-'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              {results.length > 0 ? 'Overall average' : 'No results yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Exams</CardTitle>
          <CardDescription>Exams available for you to take</CardDescription>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exams available</h3>
              <p className="text-gray-600">Check back later for new exams</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {exams.map((exam: any) => (
                <Card key={exam.id}>
                  <CardHeader>
                    <CardTitle>{exam.title}</CardTitle>
                    <CardDescription>{exam.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Duration: {exam.duration_minutes} minutes</span>
                      <span>Total Marks: {exam.total_marks}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Exam Results</h2>
        <p className="text-muted-foreground">Your performance history</p>
      </div>
      
      <div className="grid gap-4">
        {results.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
              <p className="text-gray-600">Take an exam to see your results here</p>
            </CardContent>
          </Card>
        ) : (
          results.map((result: any) => (
            <Card key={result.id}>
              <CardHeader>
                <CardTitle>{result.exams?.title}</CardTitle>
                <CardDescription>
                  Completed on {new Date(result.completed_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold">{result.percentage}%</p>
                    <p className="text-sm text-muted-foreground">{result.score}/{result.total_marks} marks</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Duration: {Math.round((new Date(result.completed_at).getTime() - new Date(result.started_at).getTime()) / 60000)} minutes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile Information</h2>
        <p className="text-muted-foreground">Your account details</p>
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
              <User className="h-4 w-4 mr-2" />
              Student
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Account Status</label>
            <p className="text-green-600">Active</p>
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
      case 'exams':
        return renderExams();
      case 'results':
        return renderResults();
      case 'profile':
        return renderProfile();
      default:
        return renderExams();
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      <SidebarProvider>
        <StudentSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <SidebarInset>
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default StudentDashboard;
