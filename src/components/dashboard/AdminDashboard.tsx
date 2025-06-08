import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog';
import AdminSidebar from './AdminSidebar';
import PasswordUpdateDialog from './PasswordUpdateDialog';
import CreateExamDialog from './CreateExamDialog';
import EditExamDialog from './EditExamDialog';
import ExamDetailsDialog from './ExamDetailsDialog';
import ExamResultsDialog from './ExamResultsDialog';
import MockTestDialog from './MockTestDialog';
import AdminApplications from './AdminApplications';
import TopNavBar from './TopNavBar';
import { 
  Clock, 
  Award, 
  User,
  FileText,
  Calendar,
  Play,
  CheckCircle,
  Mail,
  Shield,
  Search,
  Filter,
  BarChart3,
  Users,
  FileCheck,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Target,
  Menu
} from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [recentExams, setRecentExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResultsDialogOpen, setExamResultsDialogOpen] = useState(false);
  const [examDetailsDialogOpen, setExamDetailsDialogOpen] = useState(false);
  const [selectedExamForEdit, setSelectedExamForEdit] = useState(null);
  const [editExamDialogOpen, setEditExamDialogOpen] = useState(false);

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
      const [examsRes, studentsRes, resultsRes, recentExamsRes] = await Promise.all([
        supabase.from('exams').select('id').eq('is_active', true),
        supabase.from('profiles').select('id').eq('is_student', true),
        supabase.from('exam_results').select('id'),
        supabase.from('exams').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      setExams(examsRes.data || []);
      setStudents(studentsRes.data || []);
      setResults(resultsRes.data || []);
      setRecentExams(recentExamsRes.data || []);
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
      toast.success('Exam deleted successfully');
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
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
    setEditExamDialogOpen(true);
  };

  const renderOverview = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 border border-blue-100 dark:border-blue-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
            <p className="text-muted-foreground text-lg">
              {profile?.is_super_admin ? 'Super Admin Control Center' : 'Admin Management Dashboard'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and manage your examination system
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Welcome back,</div>
            <div className="text-xl font-semibold text-foreground">{profile?.full_name}</div>
            <Badge variant="outline" className="mt-1">
              {profile?.is_super_admin ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Exams</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{exams.length}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Active examinations
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{students.length}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <User className="h-3 w-3 mr-1" />
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Results</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{results.length}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Target className="h-3 w-3 mr-1" />
              Completed submissions
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Performance</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Award className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">85%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Overall score average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Recent Exams
            </CardTitle>
            <CardDescription>Latest created examinations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExams.length > 0 ? (
                recentExams.map((exam: any) => (
                  <div key={exam.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{exam.title}</p>
                      <p className="text-xs text-muted-foreground">{exam.exam_name} • {exam.total_marks} marks</p>
                    </div>
                    <Badge variant={exam.is_active ? "default" : "secondary"} className="text-xs">
                      {exam.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">No exams created yet</p>
                    <p className="text-xs text-muted-foreground">Create your first exam to get started</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="justify-start h-auto p-4" onClick={() => setActiveTab('exams')}>
                <FileText className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Manage Exams</div>
                  <div className="text-xs text-muted-foreground">Create and edit examinations</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4" onClick={() => setActiveTab('students')}>
                <Users className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">View Students</div>
                  <div className="text-xs text-muted-foreground">Manage student accounts</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderExams = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Exams</h1>
          <p className="text-muted-foreground">Create, edit, and manage your examinations</p>
        </div>
        <CreateExamDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-start'>Search Exams</CardTitle>
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
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleExamDetailsClick(exam)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditExamClick(exam)}
                          title="Edit Exam"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <MockTestDialog exam={exam} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              title="Delete Exam"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the exam
                                "{exam.title}" and all associated data including questions and results.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteExam(exam.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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

      {/* Dialogs */}
      {selectedExam && (
        <ExamDetailsDialog
          exam={selectedExam}
          isOpen={examDetailsDialogOpen}
          onClose={() => {
            setExamDetailsDialogOpen(false);
            setSelectedExam(null);
          }}
        />
      )}

      {selectedExam && (
        <ExamResultsDialog
          exam={selectedExam}
          isOpen={examResultsDialogOpen}
          onClose={() => {
            setExamResultsDialogOpen(false);
            setSelectedExam(null);
          }}
        />
      )}

      {selectedExamForEdit && (
        <EditExamDialog
          exam={selectedExamForEdit}
          isOpen={editExamDialogOpen}
          onExamUpdated={() => {
            fetchExams(); // Refresh the exam list after editing
          }}
          onClose={() => {
            setEditExamDialogOpen(false);
            setSelectedExamForEdit(null);
          }}
        />
      )}
    </div>
  );

  const renderResults = () => (
    <div className="space-y-4 sm:space-y-6">
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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Students Management</h1>
        <p className="text-muted-foreground">View and manage student accounts</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>Registered student accounts in the system</CardDescription>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium">{student.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{student.email}</span>
                      </div>
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
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4 sm:space-y-6">
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
        return <AdminApplications />;
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
          <div className="flex items-center gap-2 p-4 border-b md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Exam Antyvest</h1>
          </div>
          <TopNavBar />
          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
