
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Clock, Award, AlertCircle } from 'lucide-react';
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

interface TakeExamDialogProps {
  exam: any;
  onExamCompleted: () => void;
}

const TakeExamDialog = ({ exam, onExamCompleted }: TakeExamDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [examResultId, setExamResultId] = useState<string | null>(null);
  const [hasAlreadyTaken, setHasAlreadyTaken] = useState(false);
  const [isEntryBlocked, setIsEntryBlocked] = useState(false);

  useEffect(() => {
    if (exam && open && !isTestStarted) {
      checkIfAlreadyTaken();
      checkEntryBlockTime();
      fetchQuestions();
    }
  }, [exam, open, isTestStarted]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTestStarted && timeLeft > 0 && !isTestCompleted) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTestStarted) {
      completeTest();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isTestStarted, isTestCompleted]);

  // Effect to handle exam end time auto-submit
  useEffect(() => {
    let examEndTimer: NodeJS.Timeout;
    
    if (isTestStarted && !isTestCompleted && exam.exam_end_at) {
      const examEndTime = new Date(exam.exam_end_at).getTime();
      const currentTime = new Date().getTime();
      const timeUntilEnd = examEndTime - currentTime;
      
      if (timeUntilEnd > 0) {
        examEndTimer = setTimeout(() => {
          completeTest();
        }, timeUntilEnd);
      } else if (timeUntilEnd <= 0) {
        // Exam end time has already passed
        completeTest();
      }
    }
    
    return () => {
      if (examEndTimer) {
        clearTimeout(examEndTimer);
      }
    };
  }, [isTestStarted, isTestCompleted, exam.exam_end_at]);

  // Check if exam entry is blocked based on exam_entry_block_at
  const checkEntryBlockTime = () => {
    if (exam.exam_entry_block_at) {
      const blockTime = new Date(exam.exam_entry_block_at);
      const currentTime = new Date();
      setIsEntryBlocked(currentTime > blockTime);
    } else {
      setIsEntryBlocked(false);
    }
  };

  const checkIfAlreadyTaken = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select('id')
        .eq('exam_id', exam.id)
        .eq('student_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      setHasAlreadyTaken(!!data);
    } catch (error) {
      console.error('Error checking if exam already taken:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', exam.id);

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load questions',
        variant: 'destructive'
      });
    }
  };

  const startTest = async () => {
    try {
      // Create exam result record
      const { data, error } = await supabase
        .from('exam_results')
        .insert({
          exam_id: exam.id,
          student_id: profile?.id,
          started_at: new Date().toISOString(),
          total_marks: exam.total_marks,
          score: 0,
          percentage: 0,
          answers: {}
        })
        .select()
        .single();

      if (error) throw error;
      
      setExamResultId(data.id);
      setIsTestStarted(true);
      setTimeLeft(exam.duration_minutes * 60);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setIsTestCompleted(false);
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

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeTest = async () => {
    if (!examResultId) return;

    try {
      let totalScore = 0;
      questions.forEach(question => {
        if (answers[question.id] === question.correct_answer) {
          totalScore += question.marks;
        }
      });

      const percentage = (totalScore / exam.total_marks) * 100;

      // Update exam result
      const { error } = await supabase
        .from('exam_results')
        .update({
          completed_at: new Date().toISOString(),
          score: totalScore,
          percentage: percentage,
          answers: answers
        })
        .eq('id', examResultId);

      if (error) throw error;

      setIsTestCompleted(true);
      setIsTestStarted(false);
      
      toast({
        title: 'Exam Completed',
        description: `You scored ${totalScore}/${exam.total_marks} (${percentage.toFixed(1)}%)`,
      });

      onExamCompleted();
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

  const resetTest = () => {
    setIsTestStarted(false);
    setIsTestCompleted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(0);
    setExamResultId(null);
  };

  if (hasAlreadyTaken) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" disabled variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Already Taken
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exam Already Completed</DialogTitle>
            <DialogDescription>
              You have already taken this exam
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="text-lg text-green-600 font-medium">
              You have already completed this exam
            </div>
            <div className="text-sm text-muted-foreground">
              You can view your results in the "My Results" section
            </div>
            <Button onClick={() => setOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isEntryBlocked) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" disabled variant="outline" className="opacity-50">
            <Play className="h-4 w-4 mr-2" />
            Entry Blocked
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exam Entry Blocked</DialogTitle>
            <DialogDescription>
              Entry time for this exam has expired
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="text-lg text-red-600 font-medium">
              You can no longer enter this exam
            </div>
            <div className="text-sm text-muted-foreground">
              The entry time for this exam has passed. Contact your administrator if you believe this is an error.
            </div>
            <Button onClick={() => setOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isTestStarted && !isTestCompleted) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Play className="h-4 w-4 mr-2" />
            Start Exam
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{exam.title}</DialogTitle>
            <DialogDescription>
              Read the instructions carefully before starting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Instructions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You cannot pause the exam once started</li>
                    <li>Make sure you have stable internet connection</li>
                    <li>Your answers will be automatically saved</li>
                    <li>You can only take this exam once</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Duration: {exam.duration_minutes} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Total Marks: {exam.total_marks}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Total Questions: {questions.length}
              </div>
            </div>
            
            <Button onClick={startTest} className="w-full">
              Start Exam
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isTestCompleted) {
    return (
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) resetTest();
        setOpen(newOpen);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exam Completed!</DialogTitle>
            <DialogDescription>
              Thank you for taking the exam
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="text-lg text-green-600 font-medium">
              Your exam has been submitted successfully
            </div>
            <div className="text-sm text-muted-foreground">
              You can view your results in the "My Results" section
            </div>
            <Button onClick={() => setOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && isTestStarted) {
        // Warn before closing during exam
        if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
          resetTest();
          setOpen(false);
        }
      } else if (!newOpen) {
        setOpen(false);
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{exam.title}</span>
            <div className="flex items-center gap-2 text-lg font-mono text-red-600">
              <Clock className="h-5 w-5" />
              {formatTime(timeLeft)}
            </div>
          </DialogTitle>
          <DialogDescription>
            Question {currentQuestionIndex + 1} of {questions.length} | {currentQuestion?.marks} mark(s)
          </DialogDescription>
        </DialogHeader>

        {currentQuestion && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {currentQuestion.question_text}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <div
                    key={option}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      answers[currentQuestion.id] === option
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted border-border'
                    }`}
                    onClick={() => selectAnswer(currentQuestion.id, option)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        answers[currentQuestion.id] === option
                          ? 'border-primary-foreground bg-primary-foreground text-primary'
                          : 'border-gray-300'
                      }`}>
                        {option}
                      </div>
                      <span>{currentQuestion[`option_${option.toLowerCase()}` as keyof Question]}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <Button
                onClick={prevQuestion}
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
                    onClick={completeTest}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Submit Exam
                  </Button>
                ) : (
                  <Button onClick={nextQuestion}>
                    Next Question
                  </Button>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
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
                        ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TakeExamDialog;
