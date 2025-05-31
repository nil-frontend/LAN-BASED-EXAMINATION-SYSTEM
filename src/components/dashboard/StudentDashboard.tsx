
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import StudentSidebar from './StudentSidebar';
import PasswordUpdateDialog from './PasswordUpdateDialog';
import { 
  Clock, 
  Award, 
  User,
  FileText,
  TrendingUp
} from 'lucide-react';

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('exams');
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({
    availableExams: 0,
    completedExams: 0,
    averageScore: 0
  });

  useEffect(() => {
    fetchExams();
    fetchResults();
  }, [profile]);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
      setStats(prev => ({ ...prev, availableExams: data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchResults = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          *,
          exams!exam_results_exam_id_fkey(title)
        `)
        .eq('student_id', profile.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      const formattedResults = data || [];
      setResults(formattedResults);
      
      // Calculate stats
      const completedCount = formattedResults.length;
      const averageScore = completedCount > 0 
        ? formattedResults.reduce((sum, result) => sum + result.percentage, 0) / completedCount 
        : 0;

      setStats(prev => ({
        ...prev,
        completedExams: completedCount,
        averageScore: Math.round(averageScore * 10) / 10
      }));
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const renderExams = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableExams}</div>
            <p className="text-xs text-muted-foreground">
              Ready to take
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedExams}</div>
            <p className="text-xs text-muted-foreground">
              Exams taken
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
              {stats.averageScore > 0 ? `${stats.averageScore}%` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall performance
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Exams</CardTitle>
          <CardDescription>Exams you can take</CardDescription>
        </CardHeader>
        <CardContent>
          {exams.length > 0 ? (
            <div className="space-y-4">
              {exams.map((exam: any) => (
                <div key={exam.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{exam.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{exam.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {exam.duration_minutes} mins
                    </span>
                    <span>Total Marks: {exam.total_marks}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exams available</h3>
              <p className="text-gray-600">Check back later for new exams</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderResults = () => (
    <Card>
      <CardHeader>
        <CardTitle>My Exam Results</CardTitle>
        <CardDescription>Your performance history</CardDescription>
      </CardHeader>
      <CardContent>
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result: any) => (
              <div key={result.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{result.exams?.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Completed on {new Date(result.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{result.percentage.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">
                      {result.score}/{result.total_marks}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
            <p className="text-gray-600">Take an exam to see your results here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderProfile = () => (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Your account details</CardDescription>
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
  );

  const renderContent = () => {
    switch (activeTab) {
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StudentSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SidebarInset>
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default StudentDashboard;
