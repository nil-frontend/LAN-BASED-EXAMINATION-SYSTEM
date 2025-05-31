
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import StudentSidebar from './StudentSidebar';
import PasswordUpdateDialog from './PasswordUpdateDialog';
import TakeExamDialog from './TakeExamDialog';
import ConnectionStatus from './ConnectionStatus';
import { 
  Clock, 
  Award, 
  User,
  FileText,
  TrendingUp,
  Calendar,
  Play,
  CheckCircle
} from 'lucide-react';

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('exams');
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [completedExamIds, setCompletedExamIds] = useState(new Set());
  const [stats, setStats] = useState({
    availableExams: 0,
    completedExams: 0,
    averageScore: 0
  });

  useEffect(() => {
    fetchExams();
    fetchResults();
    
    // Auto-refresh every 2 seconds
    const interval = setInterval(() => {
      fetchExams();
      fetchResults();
    }, 2000);

    return () => clearInterval(interval);
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
      
      // Track completed exam IDs
      const completedIds = new Set(formattedResults.map(result => result.exam_id));
      setCompletedExamIds(completedIds);
      
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

  const isExamCompleted = (examId: string) => {
    return completedExamIds.has(examId);
  };

  const isExamStarted = (examStartAt: string | null) => {
    if (!examStartAt) return true; // If no start time set, exam is available
    return new Date() >= new Date(examStartAt);
  };

  const getExamStatus = (exam: any) => {
    if (isExamCompleted(exam.id)) return 'completed';
    if (!exam.exam_start_at) return 'available';
    const now = new Date();
    const startTime = new Date(exam.exam_start_at);
    
    if (now >= startTime) return 'started';
    return 'scheduled';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderExams = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Exams</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.availableExams}</div>
            <p className="text-xs text-muted-foreground">
              Ready to take
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedExams}</div>
            <p className="text-xs text-muted-foreground">
              Exams taken
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
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
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Available Exams
          </CardTitle>
          <CardDescription>Exams you can participate in</CardDescription>
        </CardHeader>
        <CardContent>
          {exams.length > 0 ? (
            <div className="space-y-4">
              {exams.map((exam: any) => {
                const examStatus = getExamStatus(exam);
                const canStart = (examStatus === 'started' || examStatus === 'available') && !isExamCompleted(exam.id);
                
                return (
                  <Card key={exam.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{exam.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mb-2">{exam.exam_name}</p>
                          <p className="text-sm text-muted-foreground">{exam.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {examStatus === 'completed' && (
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </div>
                          )}
                          
                          {examStatus === 'scheduled' && (
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Scheduled
                            </div>
                          )}
                          
                          {examStatus === 'started' && !isExamCompleted(exam.id) && (
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
                              <Play className="h-3 w-3 mr-1" />
                              Started
                            </div>
                          )}
                          
                          {examStatus === 'available' && !isExamCompleted(exam.id) && (
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-200">
                              <FileText className="h-3 w-3 mr-1" />
                              Available
                            </div>
                          )}
                          
                          {canStart ? (
                            <TakeExamDialog exam={exam} onExamCompleted={fetchResults} />
                          ) : examStatus === 'completed' ? (
                            <Button size="sm" disabled variant="outline">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Completed
                            </Button>
                          ) : (
                            <Button size="sm" disabled variant="outline">
                              <Clock className="h-4 w-4 mr-2" />
                              Scheduled
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                          <div className="text-sm font-medium">{exam.duration_minutes} mins</div>
                          <div className="text-xs text-muted-foreground">Duration</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <Award className="h-5 w-5 mx-auto mb-1 text-green-600" />
                          <div className="text-sm font-medium">{exam.total_marks}</div>
                          <div className="text-xs text-muted-foreground">Total Marks</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <Calendar className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                          <div className="text-sm font-medium">
                            {exam.exam_start_at ? formatDateTime(exam.exam_start_at) : 'Anytime'}
                          </div>
                          <div className="text-xs text-muted-foreground">Start Time</div>
                        </div>
                      </div>
                      
                      {exam.exam_start_at && examStatus === 'scheduled' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">
                              Scheduled for: {formatDateTime(exam.exam_start_at)}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
          <ConnectionStatus />
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default StudentDashboard;
