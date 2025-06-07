
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  exam_privacy: string;
}

const ExamPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAlreadyTaken, setHasAlreadyTaken] = useState(false);

  useEffect(() => {
    if (!user || !profile) {
      navigate('/');
      return;
    }
    
    if (id) {
      fetchExamData();
    }
  }, [id, user, profile]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isExamStarted && timeLeft > 0 && !isExamCompleted) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isExamStarted && !isExamCompleted) {
      // Time's up - complete the exam
      toast({
        title: 'Time Up!',
        description: 'Your exam time has ended. Submitting automatically.',
        variant: 'destructive'
      });
      completeExam();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isExamStarted, isExamCompleted]);

  const fetchExamData = async () => {
    try {
      setLoading(true);

      // Fetch exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', id)
        .single();

      if (examError) throw examError;

      if (examData.exam_privacy !== 'public') {
        toast({
          title: 'Access Denied',
          description: 'This exam is not publicly available.',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }

      setExam(examData);

      // Check if already taken
      const { data: resultData, error: resultError } = await supabase
        .from('exam_results')
        .select('id')
        .eq('exam_id', id)
        .eq('student_id', profile?.id)
        .maybeSingle();

      if (resultError) throw resultError;
      
      if (resultData) {
        setHasAlreadyTaken(true);
        setLoading(false);
        return;
      }

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', id);

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

    } catch (error) {
      console.error('Error fetching exam data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load exam data',
        variant: 'destructive'
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const startExam = async () => {
    try {
      // Create exam result record
      const { data, error } = await supabase
        .from('exam_results')
        .insert({
          exam_id: id,
          student_id: profile?.id,
          started_at: new Date().toISOString(),
          total_marks: exam?.total_marks || 0,
          score: 0,
          percentage: 0,
          answers: {}
        })
        .select()
        .single();

      if (error) throw error;

      setIsExamStarted(true);
      setTimeLeft((exam?.duration_minutes || 0) * 60);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setIsExamCompleted(false);
    } catch (error) {
      console.error('Error starting exam:', error);
      toast({
        title: 'Error',
        description: 'Failed to start exam',
        variant: 'destructive'
      });
    }
  };

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const completeExam = async () => {
    try {
      let totalScore = 0;
      questions.forEach(question => {
        if (answers[question.id] === question.correct_answer) {
          totalScore += question.marks;
        }
      });

      const percentage = ((totalScore / (exam?.total_marks || 1)) * 100);

      // Update exam result
      const { error } = await supabase
        .from('exam_results')
        .update({
          completed_at: new Date().toISOString(),
          score: totalScore,
          percentage: percentage,
          answers: answers
        })
        .eq('exam_id', id)
        .eq('student_id', profile?.id);

      if (error) throw error;

      setIsExamCompleted(true);
      setIsExamStarted(false);
      
      toast({
        title: 'Exam Completed',
        description: `You scored ${totalScore}/${exam?.total_marks} (${percentage.toFixed(1)}%)`,
      });

    } catch (error) {
      console.error('Error completing exam:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit exam',
        variant: 'destructive'
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (hasAlreadyTaken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Exam Already Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-green-500 mx-auto" />
            <p className="text-muted-foreground">You have already completed this exam.</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExamCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Exam Completed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-lg text-green-600 dark:text-green-400 font-medium">
              Your exam has been submitted successfully
            </div>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isExamStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {exam?.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Important Instructions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Once started, the timer will begin counting down</li>
                    <li>Make sure you have stable internet connection</li>
                    <li>Your answers will be automatically saved as you select them</li>
                    <li>You can only take this exam once</li>
                    <li>The exam will automatically submit when time runs out</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Duration: {exam?.duration_minutes} minutes</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Total Questions: {questions.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Marks: {exam?.total_marks}
              </div>
            </div>
            
            <Button onClick={startExam} className="w-full">
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-semibold text-card-foreground">{exam?.title}</h1>
            <div className="flex items-center gap-2 text-lg font-mono text-red-600 dark:text-red-400">
              <Clock className="h-5 w-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length} | {currentQuestion?.marks} mark(s)
          </div>
        </div>

        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">
                {currentQuestion.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['A', 'B', 'C', 'D'].map((option) => (
                <div
                  key={option}
                  className={`p-4 border border-border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    answers[currentQuestion.id] === option
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => selectAnswer(currentQuestion.id, option)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestion.id] === option
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    }`}>
                      {option}
                    </div>
                    <span className="text-card-foreground">{currentQuestion[`option_${option.toLowerCase()}` as keyof Question]}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center mb-4">
          <Button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {Object.keys(answers).length} of {questions.length} answered
          </span>
          
          <div className="flex gap-2">
            {currentQuestionIndex === questions.length - 1 ? (
              <Button 
                onClick={completeExam}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Exam
              </Button>
            ) : (
              <Button 
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              >
                Next Question
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2">Question Navigator:</div>
            <div className="flex gap-1 flex-wrap">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded text-sm border transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-primary text-primary-foreground border-primary'
                      : answers[questions[index].id]
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-300 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/30'
                      : 'bg-muted hover:bg-muted/80 border-border text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExamPage;
