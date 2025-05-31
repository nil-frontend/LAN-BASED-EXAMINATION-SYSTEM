import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import CreateExamDialog from './CreateExamDialog';
import EditExamDialog from './EditExamDialog';
import MockTestDialog from './MockTestDialog';
import PasswordUpdateDialog from './PasswordUpdateDialog';
import ConnectionStatus from './ConnectionStatus';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Eye,
  Edit,
  Trash2,
  Play,
  Calendar,
  Clock,
  Award
} from 'lucide-react';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [examResults, setExamResults] = useState([]);

  useEffect(() => {
    fetchExams();
    fetchStudents();
    fetchExamResults();
  }, []);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_student', true);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchExamResults = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select('*');

      if (error) throw error;
      setExamResults(data || []);
    } catch (error) {
      console.error('Error fetching exam results:', error);
    }
  };

  const deleteExam = async (examId: string) => {
    try {
      await supabase.from('exams').delete().eq('id', examId);
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleString();
  };

  const getExamStatus = (exam: any) => {
    if (!exam.exam_start_at) return 'available';
    const now = new Date();
    const startTime = new Date(exam.exam_start_at);
    
    if (now >= startTime) return 'started';
    return 'scheduled';
  };

  const renderDashboard = () => (
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
              Active examinations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered students
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Results</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{examResults.length}</div>
            <p className="text-xs text-muted-foreground">
              Completed attempts
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
          <CreateExamDialog />
        </CardContent>
      </Card>
    </div>
  );

  const renderExams = () => (
    <Card>
      <CardHeader>
        <CardTitle>Manage Exams</CardTitle>
        <CardDescription>View and manage your examinations</CardDescription>
      </CardHeader>
      <CardContent>
        {exams.length > 0 ? (
          <div className="space-y-4">
            {exams.map((exam: any) => {
              const status = getExamStatus(exam);
              return (
                <Card key={exam.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">{exam.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mb-2">{exam.exam_name}</p>
                        <p className="text-sm text-muted-foreground">{exam.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <EditExamDialog exam={exam} onExamUpdated={fetchExams} />
                        <MockTestDialog exam={exam} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                        <BarChart3 className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                        <div className="text-sm font-medium">{status === 'started' ? 'Active' : status === 'scheduled' ? 'Scheduled' : 'Available'}</div>
                        <div className="text-xs text-muted-foreground">Status</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <FileText className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                        <div className="text-sm font-medium">{exam.is_active ? 'Active' : 'Inactive'}</div>
                        <div className="text-xs text-muted-foreground">Visibility</div>
                      </div>
                    </div>
                    
                    {exam.exam_start_at && (
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
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exams yet</h3>
            <p className="text-gray-600 mb-6">Create your first exam to get started</p>
            <CreateExamDialog />
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStudents = () => (
    <Card>
      <CardHeader>
        <CardTitle>Manage Students</CardTitle>
        <CardDescription>View and manage your students</CardDescription>
      </CardHeader>
      <CardContent>
        {students.length > 0 ? (
          <div className="space-y-4">
            {students.map((student: any) => (
              <Card key={student.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{student.full_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-2">{student.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => deleteExam(student.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Eye className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <div className="text-sm font-medium">{student.profile_picture}</div>
                      <div className="text-xs text-muted-foreground">Profile Picture</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <Edit className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <div className="text-sm font-medium">{student.phone_number}</div>
                      <div className="text-xs text-muted-foreground">Phone Number</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Play className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                      <div className="text-sm font-medium">{student.gender}</div>
                      <div className="text-xs text-muted-foreground">Gender</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <FileText className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                      <div className="text-sm font-medium">{student.dob}</div>
                      <div className="text-xs text-muted-foreground">Date of Birth</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
            <p className="text-gray-600">Students will appear here once they register</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top 3 Performers</CardTitle>
          <CardDescription>Highest scoring students across all exams</CardDescription>
        </CardHeader>
        <CardContent>
          {examResults.length > 0 ? (
            <div className="space-y-4">
              {examResults.map((result, index) => {
                const icons = [Trophy, Medal, Award];
                const colors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
                const Icon = icons[index];
                
                return (
                  <div key={result.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Icon className={`h-8 w-8 ${colors[index]}`} />
                    <div className="flex-1">
                      <h3 className="font-semibold">{result.student_name}</h3>
                      <p className="text-sm text-muted-foreground">{result.exam_title}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{result.percentage.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">
                        {result.score}/{result.total_marks}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-muted-foreground">
                      #{index + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
              <p className="text-gray-600">Results will appear here once students take exams</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your account information</CardDescription>
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
          <p className="text-gray-900">Administrator</p>
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
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'exams':
        return renderExams();
      case 'students':
        return renderStudents();
      case 'results':
        return renderResults();
      case 'profile':
        return renderProfile();
      default:
        return renderDashboard();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
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

export default AdminDashboard;
