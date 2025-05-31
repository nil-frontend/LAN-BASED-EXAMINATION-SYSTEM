
import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
}

const CreateExamDialog = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    total_marks: 0
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      marks: 1
    }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      marks: 1
    }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const calculateTotalMarks = () => {
    return questions.reduce((total, q) => total + q.marks, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalMarks = calculateTotalMarks();
      
      // Create exam
      const { data: createdExam, error: examError } = await supabase
        .from('exams')
        .insert({
          title: examForm.title,
          description: examForm.description,
          duration_minutes: examForm.duration_minutes,
          total_marks: totalMarks,
          created_by: profile?.id
        })
        .select()
        .single();

      if (examError) throw examError;

      // Create questions
      const questionsToInsert = questions.map(q => ({
        ...q,
        exam_id: createdExam.id
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: 'Success',
        description: 'Exam created successfully!'
      });

      // Reset form
      setExamForm({
        title: '',
        description: '',
        duration_minutes: 60,
        total_marks: 0
      });
      setQuestions([{
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        marks: 1
      }]);
      setOpen(false);

    } catch (error) {
      console.error('Error creating exam:', error);
      toast({
        title: 'Error',
        description: 'Failed to create exam. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>
            Fill in the exam details and add questions
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Exam Title</Label>
              <Input
                id="title"
                value={examForm.title}
                onChange={(e) => setExamForm({...examForm, title: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={examForm.duration_minutes}
                onChange={(e) => setExamForm({...examForm, duration_minutes: parseInt(e.target.value)})}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={examForm.description}
              onChange={(e) => setExamForm({...examForm, description: e.target.value})}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Questions (Total Marks: {calculateTotalMarks()})</h3>
              <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((question, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Textarea
                    value={question.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Option A</Label>
                    <Input
                      value={question.option_a}
                      onChange={(e) => updateQuestion(index, 'option_a', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option B</Label>
                    <Input
                      value={question.option_b}
                      onChange={(e) => updateQuestion(index, 'option_b', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option C</Label>
                    <Input
                      value={question.option_c}
                      onChange={(e) => updateQuestion(index, 'option_c', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option D</Label>
                    <Input
                      value={question.option_d}
                      onChange={(e) => updateQuestion(index, 'option_d', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={question.correct_answer}
                      onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marks</Label>
                    <Input
                      type="number"
                      value={question.marks}
                      onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Exam'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExamDialog;
