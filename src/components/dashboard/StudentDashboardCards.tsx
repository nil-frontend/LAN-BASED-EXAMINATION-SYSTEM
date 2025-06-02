
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp, Award } from 'lucide-react';

const StudentDashboardCards = () => {
  const { profile } = useAuth();
  const [availableExams, setAvailableExams] = useState(0);
  const [completedExams, setCompletedExams] = useState(0);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      fetchStudentStats();
    }
  }, [profile?.id]);

  const fetchStudentStats = async () => {
    try {
      // Fetch only public exams that are active
      const { data: allExams, error: examsError } = await supabase
        .from('exams')
        .select('id')
        .eq('exam_privacy', 'public')
        .eq('is_active', true);

      if (examsError) throw examsError;

      // Fetch completed exams by student
      const { data: completedResults, error: resultsError } = await supabase
        .from('exam_results')
        .select('exam_id, percentage')
        .eq('student_id', profile?.id);

      if (resultsError) throw resultsError;

      const totalPublicExams = allExams?.length || 0;
      const completedExamsCount = completedResults?.length || 0;
      const availableExamsCount = Math.max(0, totalPublicExams - completedExamsCount);

      // Calculate average score
      const avgScore = completedResults?.length > 0 
        ? completedResults.reduce((sum, result) => sum + result.percentage, 0) / completedResults.length
        : 0;

      setAvailableExams(availableExamsCount);
      setCompletedExams(completedExamsCount);
      setAverageScore(avgScore);

    } catch (error) {
      console.error('Error fetching student stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">Available Exams</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">{availableExams}</div>
          <p className="text-xs text-muted-foreground">
            Exams you can take
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">Completed Exams</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">{completedExams}</div>
          <p className="text-xs text-muted-foreground">
            Exams completed
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-card-foreground">Average Score</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">{averageScore.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Overall performance
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboardCards;
