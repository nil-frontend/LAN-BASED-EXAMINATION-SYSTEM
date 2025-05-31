
import React, { useState, useEffect } from 'react';
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
import { Play, Clock, Award } from 'lucide-react';
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

interface MockTestDialogProps {
  exam: any;
}

const MockTestDialog = ({ exam }: MockTestDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (exam && open && !isTestStarted) {
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

  const startTest = () => {
    setIsTestStarted(true);
    setTimeLeft(exam.duration_minutes * 60);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsTestCompleted(false);
    setScore(0);
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

  const completeTest = () => {
    let totalScore = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correct_answer) {
        totalScore += question.marks;
      }
    });
    setScore(totalScore);
    setIsTestCompleted(true);
    setIsTestStarted(false);
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
    setScore(0);
  };

  if (!isTestStarted && !isTestCompleted) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Mock Test
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mock Test - {exam.title}</DialogTitle>
            <DialogDescription>
              Practice exam (results won't be saved)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <Button onClick={startTest} className="w-full">
              Start Mock Test
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isTestCompleted) {
    const percentage = ((score / exam.total_marks) * 100).toFixed(1);
    return (
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) resetTest();
        setOpen(newOpen);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mock Test Results</DialogTitle>
            <DialogDescription>
              Your practice test performance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="text-4xl font-bold text-primary">{percentage}%</div>
            <div className="text-lg">
              {score} out of {exam.total_marks} marks
            </div>
            <div className="text-sm text-muted-foreground">
              Questions answered: {Object.keys(answers).length} / {questions.length}
            </div>
            <Button onClick={resetTest} className="w-full">
              Take Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetTest();
      setOpen(newOpen);
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Mock Test - {exam.title}</span>
            <div className="flex items-center gap-2 text-lg font-mono">
              <Clock className="h-5 w-5" />
              {formatTime(timeLeft)}
            </div>
          </DialogTitle>
          <DialogDescription>
            Question {currentQuestionIndex + 1} of {questions.length}
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
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      answers[currentQuestion.id] === option
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => selectAnswer(currentQuestion.id, option)}
                  >
                    <span className="font-medium">{option}.</span>{' '}
                    {currentQuestion[`option_${option.toLowerCase()}` as keyof Question]}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
              >
                Previous
              </Button>
              
              <div className="flex gap-2">
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button onClick={completeTest}>
                    Complete Test
                  </Button>
                ) : (
                  <Button onClick={nextQuestion}>
                    Next
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-1 flex-wrap">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded text-sm border ${
                    index === currentQuestionIndex
                      ? 'bg-primary text-primary-foreground'
                      : answers[questions[index].id]
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MockTestDialog;
