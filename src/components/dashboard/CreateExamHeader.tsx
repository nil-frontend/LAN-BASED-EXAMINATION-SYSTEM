
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CreateExamHeaderProps {
  onCreateExam: () => void;
}

const CreateExamHeader = ({ onCreateExam }: CreateExamHeaderProps) => {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Manage Exams</h1>
        <p className="text-muted-foreground">Create, edit, and manage your examinations</p>
      </div>
      <Button 
        onClick={onCreateExam}
        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 px-6 py-3 text-sm font-medium"
      >
        <Plus className="h-5 w-5 mr-2" />
        Create New Exam
      </Button>
    </div>
  );
};

export default CreateExamHeader;
