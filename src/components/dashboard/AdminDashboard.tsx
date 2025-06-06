import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminSidebar from './AdminSidebar';
import PasswordUpdateDialog from './PasswordUpdateDialog';
import EditExamDialog from './EditExamDialog';
import ExamDetailsDialog from './ExamDetailsDialog';
import ExamResultsDialog from './ExamResultsDialog';
import AdminApplications from './AdminApplications';
import TopNavBar from './TopNavBar';
import { 
  FileText, 
  Users, 
  BarChart3, 
  Clock, 
  Award, 
  Calendar,
  Search,
  Trash2,
  Edit,
  Eye,
  Play,
  User,
  Mail,
  Shield
} from 'lucide-react';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResultsDialogOpen, setExamResultsDialogOpen] = useState(false);
  const [examDetailsDialogOpen, setExamDetailsDialogOpen] = useState(false);
  const [selectedExamForEdit, setSelectedExamForEdit] = useState(null);

  // Fetch data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'overview':
        fetchOverviewData();
        break;
      case 'exams':
        fetchExams();
        break;
      case 'results':
        fetchResults();
        fetchTopStudents();
        break;
      case 'students':
        fetchStudents();
        break;
      case 'admin-applications':
        // Data will be fetched by AdminApplications component
        break;
      default:
        break;
    }
  }, [activeTab]);

  const fetchOverviewData = async () => {
    try {
      // Fetch basic counts for overview
      const [examsRes, studentsRes, resultsRes] = await Promise.all([
        supabase.from('exams').select('id').eq('is_active', true),
        supabase.from('profiles').select('id').eq('is_student', true),
        supabase.from('exam_results').select('id')
      ]);

      setExams(examsRes.data || []);
      setStudents(studentsRes.data || []);
      setResults(resultsRes.data || []);
    } catch (error) {
      console.error('Error fetching overview data:', error);
    }
  };

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
        .eq('is_student', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          exam_name,
          total_marks,
          created_at,
          exam_results(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const fetchTopStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          percentage,
          profiles!exam_results_student_id_fkey(full_name),
          exams!exam_results_exam_id_fkey(exam_name, title)
        `)
        .order('percentage', { ascending: false })
        .limit(3);

      if (error) throw error;
      setTopStudents(data || []);
    } catch (error) {
      console.error('Error fetching top students:', error);
    }
  };

  const deleteExam = async (examId: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
  };

  const filteredExams = exams.filter((exam: any) =>
    exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.exam_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExamClick = (exam: any) => {
    setSelectedExam(exam);
    setExamResultsDialogOpen(true);
  };

  const handleExamDetailsClick = (exam: any) => {
    setSelectedExam(exam);
    setExamDetailsDialogOpen(true);
  };

  const handleEditExamClick = (exam: any) => {
    setSelectedExamForEdit(exam);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-xs text-muted-foreground">Active exams in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Results</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
            <p className="text-xs text-muted-foreground">Exam submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Average performance</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderExams = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Exams</h1>
          <p className="text-muted-foreground">Create, edit, and manage your exams</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Exams</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search exams by title or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
          <CardDescription>Manage your examination system</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam: any) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>{exam.exam_name}</TableCell>
                    <TableCell>{exam.duration_minutes} mins</TableCell>
                    <TableCell>{exam.total_marks}</TableCell>
                    <TableCell>
                      <Badge variant={exam.is_active ? "default" : "secondary"}>
                        {exam.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleExamDetailsClick(exam)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditExamClick(exam)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteExam(exam.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No exams found</h3>
              <p className="text-muted-foreground">Create your first exam to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Exam Results</h1>
        <p className="text-muted-foreground">View and analyze student performance</p>
      </div>

      {/* Top 3 Students Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top Performers
          </CardTitle>
          <CardDescription>Best performing students across all exams</CardDescription>
        </CardHeader>
        <CardContent>
          {topStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topStudents.map((student: any, index) => (
                <div key={index} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                    #{index + 1}
                  </div>
                  <h3 className="font-semibold text-foreground">{student.profiles?.full_name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{student.exams?.exam_name}</p>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {student.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No results yet</h3>
              <p className="text-muted-foreground">Student results will appear here once exams are completed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filter Exams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search exams by subject name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Exams List */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Results</CardTitle>
          <CardDescription>Click on an exam to view detailed results</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map((exam: any) => (
                <div
                  key={exam.id}
                  onClick={() => handleExamClick(exam)}
                  className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card"
                >
                  <h3 className="font-semibold text-foreground mb-2">{exam.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{exam.exam_name}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {exam.exam_results?.[0]?.count || 0} submissions
                    </span>
                    <Badge>{exam.total_marks} marks</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No exams found</h3>
              <p className="text-muted-foreground">Create some exams to view results</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStudents = () => (
    <Card>
      <CardHeader>
        <CardTitle>Students Management</CardTitle>
        <CardDescription>View and manage student accounts</CardDescription>
      </CardHeader>
      <CardContent>
        {students.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {student.full_name}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {student.email}
                  </TableCell>
                  <TableCell>
                    {new Date(student.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400">
                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No students found</h3>
            <p className="text-muted-foreground">Students will appear here once they register</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
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
                    <p className="text-foreground font-medium">{profile?.full_name}</p>
                  </div>
                </div>
                
                <div className="p-4 border border-border rounded-lg bg-muted/20">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Email Address</label>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <p className="text-foreground font-medium">{profile?.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-muted/20">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Role</label>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <p className="text-foreground font-medium">
                      {profile?.is_super_admin ? 'Super Admin' : 'Admin'}
                    </p>
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'exams':
        return renderExams();
      case 'results':
        return renderResults();
      case 'students':
        return renderStudents();
      case 'admin-applications':
        return profile?.is_super_admin ? <AdminApplications /> : renderOverview();
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

      {/* Dialogs */}
      <ExamDetailsDialog
        exam={selectedExam}
        isOpen={examDetailsDialogOpen}
        onClose={() => setExamDetailsDialogOpen(false)}
      />

      <EditExamDialog
        exam={selectedExamForEdit}
        onExamUpdated={fetchExams}
      />

      <ExamResultsDialog
        exam={selectedExam}
        isOpen={examResultsDialogOpen}
        onClose={() => setExamResultsDialogOpen(false)}
      />
    </SidebarProvider>
  );
};

export default AdminDashboard;
