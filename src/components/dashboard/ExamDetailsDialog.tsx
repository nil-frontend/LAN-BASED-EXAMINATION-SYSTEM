
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ArrowUpDown, Trophy, Medal, Award } from 'lucide-react';

interface ExamDetailsDialogProps {
  exam: any;
  isOpen: boolean;
  onClose: () => void;
}

const ExamDetailsDialog = ({ exam, isOpen, onClose }: ExamDetailsDialogProps) => {
  const [results, setResults] = useState([]);
  const [sortBy, setSortBy] = useState('marks-high');

  useEffect(() => {
    if (exam && isOpen) {
      fetchExamResults();
    }
  }, [exam, isOpen]);

  useEffect(() => {
    if (results.length > 0) {
      sortResults();
    }
  }, [sortBy]);

  const fetchExamResults = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          *,
          profiles!exam_results_student_id_fkey(full_name)
        `)
        .eq('exam_id', exam.id);

      if (error) throw error;
      
      const formattedResults = data?.map(result => ({
        ...result,
        student_name: result.profiles?.full_name || 'Unknown Student'
      })) || [];

      setResults(formattedResults);
    } catch (error) {
      console.error('Error fetching exam results:', error);
    }
  };

  const sortResults = () => {
    const sorted = [...results].sort((a, b) => {
      switch (sortBy) {
        case 'marks-high':
          return b.score - a.score;
        case 'marks-low':
          return a.score - b.score;
        case 'name-az':
          return a.student_name.localeCompare(b.student_name);
        case 'name-za':
          return b.student_name.localeCompare(a.student_name);
        default:
          return 0;
      }
    });
    setResults(sorted);
  };

  const getRankIcon = (index: number) => {
    const icons = [Trophy, Medal, Award];
    const colors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
    
    if (index < 3) {
      const Icon = icons[index];
      return <Icon className={`h-5 w-5 ${colors[index]}`} />;
    }
    return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {exam?.title} - Student Results
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Subject: {exam?.exam_name} | Total Marks: {exam?.total_marks}
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              Participants ({results.length})
            </h3>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marks-high">Marks (High to Low)</SelectItem>
                <SelectItem value="marks-low">Marks (Low to High)</SelectItem>
                <SelectItem value="name-az">Name (A-Z)</SelectItem>
                <SelectItem value="name-za">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((result, index) => (
                <Card key={result.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getRankIcon(index)}
                        <div>
                          <h4 className="font-semibold text-card-foreground">
                            {result.student_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Completed: {new Date(result.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {result.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.score}/{result.total_marks} marks
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No students have taken this exam yet.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamDetailsDialog;
