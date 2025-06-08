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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  
  const [examData, setExamData] = useState({
    title: '',
    exam_name: '',
    description: '',
    duration_minutes: 60,
    exam_start_at: '',
    exam_privacy: 'public',
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
          title: examData.title,
          exam_name: examData.exam_name,
          description: examData.description,
          duration_minutes: examData.duration_minutes,
          exam_start_at: examData.exam_start_at || null,
          exam_privacy: examData.exam_privacy,
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
      setExamData({
        title: '',
        exam_name: '',
        description: '',
        duration_minutes: 60,
        exam_start_at: '',
        exam_privacy: 'public',
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
        <Button 
          className="w-auto justify-between gap-2 text-white border-none shadow-sm hover:shadow-md transition-all duration-200"
          style={{ backgroundColor: '#2563EB' }}
        >
          Create New Exam
          <Plus className="h-4 w-4" />
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
                value={examData.title}
                onChange={(e) => setExamData({...examData, title: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam_name">Exam Name</Label>
              <Input
                id="exam_name"
                value={examData.exam_name}
                onChange={(e) => setExamData({...examData, exam_name: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={examData.duration_minutes}
                onChange={(e) => setExamData({...examData, duration_minutes: parseInt(e.target.value)})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam_start_at">Exam Start Time</Label>
              <Input
                id="exam_start_at"
                type="datetime-local"
                value={examData.exam_start_at}
                onChange={(e) => setExamData({...examData, exam_start_at: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam_privacy">Exam Privacy</Label>
              <Select value={examData.exam_privacy} onValueChange={(value) => setExamData({...examData, exam_privacy: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select privacy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={examData.description}
              onChange={(e) => setExamData({...examData, description: e.target.value})}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Questions (Total Marks: {calculateTotalMarks()})</h3>
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

            <div className="flex justify-center">
              <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
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
