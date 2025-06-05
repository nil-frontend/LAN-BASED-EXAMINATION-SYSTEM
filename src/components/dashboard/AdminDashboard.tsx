import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import CreateExamDialog from './CreateExamDialog';
import EditExamDialog from './EditExamDialog';
import ExamDetailsDialog from './ExamDetailsDialog';
import ExamResultsDialog from './ExamResultsDialog';
import MockTestDialog from './MockTestDialog';
import PasswordUpdateDialog from './PasswordUpdateDialog';
import TopNavBar from './TopNavBar';
import { 
  BookOpen, 
  Users, 
  Award, 
  TrendingUp, 
  FileText, 
  Edit,
  Eye,
  TestTube,
  Trash2,
  User,
  Mail,
  Shield,
  Search,
  Trophy,
  Medal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedExamForResults, setSelectedExamForResults] = useState(null);
  const [isExamDetailsOpen, setIsExamDetailsOpen] = useState(false);
  const [isExamResultsOpen, setIsExamResultsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExams, setFilteredExams] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [stats, setStats] = useState({
    totalExams: 0,
    totalStudents: 0,
    totalResults: 0,
    averageScore: 0
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscriptions for auto-refresh
    const examsChannel = supabase
      .channel('exams_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => {
        fetchExams();
      })
      .subscribe();

    const resultsChannel = supabase
      .channel('results_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_results' }, () => {
        fetchResults();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(examsChannel);
      supabase.removeChannel(resultsChannel);
    };
  }, []);

  // Auto-refresh exam data every 3 seconds when on manage exams tab
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeTab === 'exams') {
      interval = setInterval(() => {
        fetchExams();
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeTab]);

  // Filter exams based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredExams(exams);
    } else {
      const filtered = exams.filter((exam: any) =>
        exam.exam_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredExams(filtered);
    }
  }, [exams, searchQuery]);

  const fetchDashboardData = async () => {
    await Promise.all([
      fetchExams(),
      fetchResults(),
      fetchStudents()
    ]);
  };

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
      setStats(prev => ({ ...prev, totalExams: data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          *,
          exams!exam_results_exam_id_fkey(title, exam_name),
          profiles!exam_results_student_id_fkey(full_name)
        `)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      const formattedResults = data || [];
      setResults(formattedResults);
      
      // Calculate average score
      const avgScore = formattedResults.length > 0 
        ? formattedResults.reduce((sum, result) => sum + result.percentage, 0) / formattedResults.length
        : 0;

      // Get top 3 students
      const topThree = formattedResults
        .filter(result => result.profiles?.full_name)
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3);
      
      setTopStudents(topThree);

      setStats(prev => ({
        ...prev,
        totalResults: formattedResults.length,
        averageScore: Math.round(avgScore * 10) / 10
      }));
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_student', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
      setStats(prev => ({ ...prev, totalStudents: data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      // First delete all questions for this exam
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('exam_id', examId);

      if (questionsError) throw questionsError;

      // Then delete all exam results for this exam
      const { error: resultsError } = await supabase
        .from('exam_results')
        .delete()
        .eq('exam_id', examId);

      if (resultsError) throw resultsError;

      // Finally delete the exam
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;

      toast({
        title: 'Exam Deleted',
        description: 'Exam and all related data have been deleted successfully',
      });

      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete exam',
        variant: 'destructive'
      });
    }
  };

  const handlePrivacyChange = async (examId: string, newPrivacy: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ exam_privacy: newPrivacy })
        .eq('id', examId);

      if (error) throw error;

      toast({
        title: 'Privacy Updated',
        description: `Exam privacy changed to ${newPrivacy}`,
      });

      fetchExams();
    } catch (error) {
      console.error('Error updating exam privacy:', error);
      toast({
        title: 'Error',
        description: 'Failed to update exam privacy',
        variant: 'destructive'
      });
    }
  };

  const handleExamDetailsClick = (exam: any) => {
    setSelectedExam(exam);
    setIsExamDetailsOpen(true);
  };

  const handleExamResultsClick = (exam: any) => {
    setSelectedExamForResults(exam);
    setIsExamResultsOpen(true);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const renderProfile = () => (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Profile Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-muted/20">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Full Name</label>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <p className="text-card-foreground font-medium">{profile?.full_name}</p>
                  </div>
                </div>
                
                <div className="p-4 border border-border rounded-lg bg-muted/20">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Email Address</label>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <p className="text-card-foreground font-medium">{profile?.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-muted/20">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Role</label>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <p className="text-card-foreground font-medium">Administrator</p>
                  </div>
                </div>
                
                <div className="p-4 border border-border rounded-lg bg-muted/20">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Account Status</label>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-green-500 font-medium">Active</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border">
              <PasswordUpdateDialog />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalExams}</div>
            <p className="text-xs text-muted-foreground">
              Active examinations
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Students</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Registered students
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Exam Results</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalResults}</div>
            <p className="text-xs text-muted-foreground">
              Completed attempts
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500 bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.averageScore > 0 ? `${stats.averageScore}%` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall performance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Exams</CardTitle>
            <CardDescription>Latest created examinations</CardDescription>
          </CardHeader>
          <CardContent>
            {exams.slice(0, 5).map((exam: any) => (
              <div key={exam.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-card-foreground">{exam.title}</p>
                  <p className="text-sm text-muted-foreground">{exam.duration_minutes} mins • {exam.total_marks} marks</p>
                </div>
                <Badge variant={exam.is_active ? 'default' : 'secondary'}>
                  {exam.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Top Students</CardTitle>
            <CardDescription>Best performing students</CardDescription>
          </CardHeader>
          <CardContent>
            {results
              .filter(result => result.profiles?.full_name)
              .sort((a, b) => b.percentage - a.percentage)
              .slice(0, 5)
              .map((result: any, index) => (
                <div key={result.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{result.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{result.exams?.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-card-foreground">{result.percentage.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">{result.score}/{result.total_marks}</p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStudents = () => (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">All Students</CardTitle>
        <CardDescription>Manage registered students</CardDescription>
      </CardHeader>
      <CardContent>
        {students.length > 0 ? (
          <div className="space-y-4">
            {students.map((student: any) => (
              <div key={student.id} className="border border-border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-card-foreground">{student.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined: {new Date(student.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={student.admin_approved ? 'default' : 'secondary'}>
                    {student.admin_approved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">No students yet</h3>
            <p className="text-muted-foreground">Students will appear here once they register</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderResults = () => (
    <div className="space-y-6">
      {/* Top 3 Students Hero Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Top Performers
          </CardTitle>
          <CardDescription>Best performing students across all exams</CardDescription>
        </CardHeader>
        <CardContent>
          {topStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topStudents.map((result: any, index) => (
                <Card key={result.id} className="border-2 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {getRankIcon(index)}
                      <div className="text-sm font-medium text-muted-foreground">
                        {index === 0 ? '1st Place' : index === 1 ? '2nd Place' : '3rd Place'}
                      </div>
                    </div>
                    <h3 className="font-semibold text-card-foreground">{result.profiles?.full_name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{result.exams?.exam_name}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-primary">{result.percentage.toFixed(1)}%</span>
                      <span className="text-sm text-muted-foreground">{result.score}/{result.total_marks}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No exam results available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exams List with Search */}
      <Card className="bg-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-card-foreground">Exam Results</CardTitle>
              <CardDescription>Click on any exam to view detailed results</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredExams.length > 0 ? (
            <div className="space-y-4">
              {filteredExams.map((exam: any) => (
                <Card 
                  key={exam.id} 
                  className="border-l-4 border-l-primary bg-card cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleExamResultsClick(exam)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-card-foreground mb-1">{exam.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">Subject: {exam.exam_name}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Duration: {exam.duration_minutes} mins</span>
                          <span>Total Marks: {exam.total_marks}</span>
                          <span>Created: {new Date(exam.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No exams found</h3>
              <p className="text-muted-foreground">Try adjusting your search query</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No exams yet</h3>
              <p className="text-muted-foreground">Create your first exam to see results here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderExams = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Manage Exams</h2>
          <p className="text-muted-foreground">Create and manage your exams</p>
        </div>
        <CreateExamDialog />
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">All Exams</CardTitle>
          <CardDescription>Manage your exam collection</CardDescription>
        </CardHeader>
        <CardContent>
          {exams.length > 0 ? (
            <div className="space-y-4">
              {exams.map((exam: any) => (
                <Card key={exam.id} className="border-l-4 border-l-primary bg-card">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-card-foreground">{exam.title}</h3>
                          <Badge variant={exam.exam_privacy === 'public' ? 'default' : 'secondary'}>
                            {exam.exam_privacy}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{exam.exam_name}</p>
                        <p className="text-sm text-muted-foreground mb-4">{exam.description}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Duration: {exam.duration_minutes} mins</span>
                          <span>Total Marks: {exam.total_marks}</span>
                          <span>Created: {new Date(exam.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <EditExamDialog exam={exam} onExamUpdated={fetchExams} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExamDetailsClick(exam)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <MockTestDialog exam={exam} />
                        </div>
                        
                        <div className="flex gap-2">
                          <Select
                            value={exam.exam_privacy}
                            onValueChange={(value) => handlePrivacyChange(exam.id, value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the exam "{exam.title}" and remove all associated questions and student results from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteExam(exam.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Yes, delete exam
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No exams yet</h3>
              <p className="text-muted-foreground">Create your first exam to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'exams':
        return renderExams();
      case 'students':
        return renderStudents();
      case 'results':
        return renderResults();
      case 'profile':
        return renderProfile();
      default:
        return renderOverview();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SidebarInset>
          <TopNavBar />
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
      
      {selectedExam && (
        <ExamDetailsDialog
          exam={selectedExam}
          isOpen={isExamDetailsOpen}
          onClose={() => {
            setIsExamDetailsOpen(false);
            setSelectedExam(null);
          }}
        />
      )}

      {selectedExamForResults && (
        <ExamResultsDialog
          exam={selectedExamForResults}
          isOpen={isExamResultsOpen}
          onClose={() => {
            setIsExamResultsOpen(false);
            setSelectedExamForResults(null);
          }}
        />
      )}
    </SidebarProvider>
  );
};

export default AdminDashboard;
