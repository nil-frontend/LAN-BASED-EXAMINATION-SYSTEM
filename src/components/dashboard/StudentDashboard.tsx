import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import StudentSidebar from './StudentSidebar';
import PasswordUpdateDialog from './PasswordUpdateDialog';
import TakeExamDialog from './TakeExamDialog';
import TopNavBar from './TopNavBar';
import StudentDashboardCards from './StudentDashboardCards';
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
  RefreshCw
} from 'lucide-react';

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('exams');
  const [availableExams, setAvailableExams] = useState([]);
  const [completedExams, setCompletedExams] = useState([]);
  const [results, setResults] = useState([]);
  const [completedExamIds, setCompletedExamIds] = useState(new Set());
  
  // Results filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // Fetch data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'exams':
        fetchExams();
        fetchResults();
        break;
      case 'results':
        fetchResults();
        break;
      default:
        break;
    }
  }, [activeTab, profile]);

  useEffect(() => {
    fetchExams();
    fetchResults();
    
    // Auto-refresh every 2 seconds
    const interval = setInterval(() => {
      if (activeTab === 'exams') {
        fetchExams();
        fetchResults();
      } else if (activeTab === 'results') {
        fetchResults();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [profile, activeTab]);

  const fetchExams = async () => {
    try {
      // Fetch all public and active exams
      const { data: allExams, error } = await supabase
        .from('exams')
        .select('*')
        .eq('exam_privacy', 'public')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Separate available and completed exams
      const available = allExams?.filter(exam => !completedExamIds.has(exam.id)) || [];
      const completed = allExams?.filter(exam => completedExamIds.has(exam.id)) || [];
      
      setAvailableExams(available);
      setCompletedExams(completed);
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
          exams!exam_results_exam_id_fkey(title, exam_name)
        `)
        .eq('student_id', profile.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      const formattedResults = data || [];
      setResults(formattedResults);
      
      // Track completed exam IDs
      const completedIds = new Set(formattedResults.map(result => result.exam_id));
      setCompletedExamIds(completedIds);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const isExamStarted = (examStartAt: string | null) => {
    if (!examStartAt) return true; // If no start time set, exam is available
    return new Date() >= new Date(examStartAt);
  };

  const getExamStatus = (exam: any) => {
    if (!exam.exam_start_at) return 'available';
    const now = new Date();
    const startTime = new Date(exam.exam_start_at);
    
    if (now >= startTime) return 'started';
    return 'scheduled';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderExamCard = (exam: any, isCompleted = false) => {
    const examStatus = getExamStatus(exam);
    const canStart = (examStatus === 'started' || examStatus === 'available') && !isCompleted;
    
    return (
      <Card key={exam.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg mb-1 text-card-foreground break-words">{exam.title}</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">{exam.exam_name}</p>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">{exam.description}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {isCompleted && (
                <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </div>
              )}
              
              {!isCompleted && examStatus === 'scheduled' && (
                <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Scheduled
                </div>
              )}
              
              {!isCompleted && examStatus === 'started' && (
                <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800">
                  <Play className="h-3 w-3 mr-1" />
                  Started
                </div>
              )}
              
              {!isCompleted && examStatus === 'available' && (
                <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <FileText className="h-3 w-3 mr-1" />
                  Available
                </div>
              )}
              
              {canStart ? (
                <TakeExamDialog exam={exam} />
              ) : isCompleted ? (
                <Button size="sm" disabled variant="outline" className="w-full sm:w-auto">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed
                </Button>
              ) : (
                <Button size="sm" disabled variant="outline" className="w-full sm:w-auto">
                  <Clock className="h-4 w-4 mr-2" />
                  Scheduled
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Clock className="h-4 sm:h-5 w-4 sm:w-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
              <div className="text-sm font-medium text-card-foreground">{exam.duration_minutes} mins</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <Award className="h-4 sm:h-5 w-4 sm:w-5 mx-auto mb-1 text-green-600 dark:text-green-400" />
              <div className="text-sm font-medium text-card-foreground">{exam.total_marks}</div>
              <div className="text-xs text-muted-foreground">Total Marks</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <Calendar className="h-4 sm:h-5 w-4 sm:w-5 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
              <div className="text-xs sm:text-sm font-medium text-card-foreground break-words">
                {exam.exam_start_at ? formatDateTime(exam.exam_start_at) : 'Anytime'}
              </div>
              <div className="text-xs text-muted-foreground">Start Time</div>
            </div>
          </div>
          
          {exam.exam_start_at && examStatus === 'scheduled' && !isCompleted && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-400 break-words">
                  Scheduled for: {formatDateTime(exam.exam_start_at)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderExams = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <StudentDashboardCards />

      {/* Available Exams Section */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground text-lg sm:text-xl">
            <FileText className="h-4 sm:h-5 w-4 sm:w-5" />
            Available Exams
          </CardTitle>
          <CardDescription className="text-sm">Exams you can participate in</CardDescription>
        </CardHeader>
        <CardContent>
          {availableExams.length > 0 ? (
            <div className="space-y-4">
              {availableExams.map((exam: any) => renderExamCard(exam, false))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Clock className="h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-card-foreground mb-2">No available exams</h3>
              <p className="text-sm text-muted-foreground">Check back later for new exams</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Exams Section */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground text-lg sm:text-xl">
            <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5" />
            Completed Exams
          </CardTitle>
          <CardDescription className="text-sm">Exams you have already taken</CardDescription>
        </CardHeader>
        <CardContent>
          {completedExams.length > 0 ? (
            <div className="space-y-4">
              {completedExams.map((exam: any) => renderExamCard(exam, true))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <CheckCircle className="h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-card-foreground mb-2">No completed exams</h3>
              <p className="text-sm text-muted-foreground">Complete some exams to see them here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Sort and filter results
  const filteredAndSortedResults = React.useMemo(() => {
    let filtered = results.filter((result: any) =>
      result.exams?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.exams?.exam_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort results
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.exams?.title || '').localeCompare(b.exams?.title || '');
        case 'name-desc':
          return (b.exams?.title || '').localeCompare(a.exams?.title || '');
        case 'marks-high':
          return b.percentage - a.percentage;
        case 'marks-low':
          return a.percentage - b.percentage;
        case 'date-desc':
          return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
        case 'date-asc':
          return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [results, searchTerm, sortBy]);

  const renderResults = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">My Exam Results</h1>
        <p className="text-sm text-muted-foreground">Your performance history</p>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Search className="h-4 sm:h-5 w-4 sm:w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by exam name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="marks-high">Marks (High to Low)</SelectItem>
                  <SelectItem value="marks-low">Marks (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground text-lg sm:text-xl">Results ({filteredAndSortedResults.length})</CardTitle>
          <CardDescription className="text-sm">Your exam performance details</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAndSortedResults.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedResults.map((result: any) => (
                <div key={result.id} className="border border-border rounded-lg p-3 sm:p-4 bg-card hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-card-foreground mb-1 text-sm sm:text-base break-words">{result.exams?.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">{result.exams?.exam_name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Completed on {new Date(result.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right w-full sm:w-auto">
                      <div className="text-xl sm:text-2xl font-bold text-card-foreground mb-1">
                        {result.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {result.score}/{result.total_marks} marks
                      </div>
                      <div className={`text-xs font-medium mt-1 ${
                        result.percentage >= 90 ? 'text-green-600 dark:text-green-400' :
                        result.percentage >= 75 ? 'text-blue-600 dark:text-blue-400' :
                        result.percentage >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {result.percentage >= 90 ? 'Excellent' :
                         result.percentage >= 75 ? 'Good' :
                         result.percentage >= 60 ? 'Average' : 'Needs Improvement'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-card-foreground mb-2">
                {searchTerm ? 'No results found' : 'No results yet'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria' : 'Take an exam to see your results here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground text-lg sm:text-xl">Profile Information</CardTitle>
          <CardDescription className="text-sm">Your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="p-3 sm:p-4 border border-border rounded-lg bg-muted/20">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 block">Full Name</label>
                  <div className="flex items-center gap-3">
                    <User className="h-4 sm:h-5 w-4 sm:w-5 text-primary flex-shrink-0" />
                    <p className="text-card-foreground font-medium text-sm sm:text-base break-words">{profile?.full_name}</p>
                  </div>
                </div>
                
                <div className="p-3 sm:p-4 border border-border rounded-lg bg-muted/20">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 block">Email Address</label>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 sm:h-5 w-4 sm:w-5 text-primary flex-shrink-0" />
                    <p className="text-card-foreground font-medium text-sm sm:text-base break-words">{profile?.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 sm:p-4 border border-border rounded-lg bg-muted/20">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 block">Role</label>
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 sm:h-5 w-4 sm:w-5 text-primary flex-shrink-0" />
                    <p className="text-card-foreground font-medium text-sm sm:text-base">Student</p>
                  </div>
                </div>
                
                <div className="p-3 sm:p-4 border border-border rounded-lg bg-muted/20">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 block">Account Status</label>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <p className="text-green-500 font-medium text-sm sm:text-base">Active</p>
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

export default StudentDashboard;
