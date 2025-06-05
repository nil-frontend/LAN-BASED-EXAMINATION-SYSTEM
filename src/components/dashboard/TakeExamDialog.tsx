
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, AlertCircle, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TakeExamDialogProps {
  exam: any;
  onExamCompleted?: () => Promise<void>;
}

const TakeExamDialog = ({ exam, onExamCompleted }: TakeExamDialogProps) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [hasAlreadyTaken, setHasAlreadyTaken] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      checkIfAlreadyTaken();
    }
  }, [isOpen, exam.id, profile]);

  const checkIfAlreadyTaken = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exam_results')
        .select('id')
        .eq('exam_id', exam.id)
        .eq('student_id', profile?.id)
        .maybeSingle();

      if (error) throw error;
      setHasAlreadyTaken(!!data);
    } catch (error) {
      console.error('Error checking exam status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    if (!user || !profile) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to take the exam',
        variant: 'destructive'
      });
      return;
    }

    if (hasAlreadyTaken) {
      toast({
        title: 'Exam Already Taken',
        description: 'You have already completed this exam',
        variant: 'destructive'
      });
      return;
    }

    // Navigate to the exam page
    navigate(`/exam/${exam.id}`);
    setIsOpen(false);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Take Exam
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Play className="h-4 w-4 mr-2" />
          Take Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {exam.title}
          </DialogTitle>
          <DialogDescription>
            Read the instructions carefully before starting
          </DialogDescription>
        </DialogHeader>

        {hasAlreadyTaken ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-green-600" />
              <div className="text-sm text-green-800">
                You have already completed this exam. You can only take each exam once.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
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

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Duration: {formatTime(exam.duration_minutes)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Total Marks: {exam.total_marks}</span>
              </div>

              <div className="text-sm text-muted-foreground">
                Total Questions: {exam.questions?.length || 'Loading...'}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!hasAlreadyTaken && (
            <Button onClick={handleStartExam} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Start Exam
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TakeExamDialog;
