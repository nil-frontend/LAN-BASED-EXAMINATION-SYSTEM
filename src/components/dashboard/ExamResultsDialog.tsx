
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, Medal, Award } from 'lucide-react';

interface ExamResultsDialogProps {
  exam: any;
  isOpen: boolean;
  onClose: () => void;
}

const ExamResultsDialog = ({ exam, isOpen, onClose }: ExamResultsDialogProps) => {
  const [results, setResults] = useState([]);
  const [sortBy, setSortBy] = useState('marks-high');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && exam) {
      fetchExamResults();
    }
  }, [isOpen, exam]);

  useEffect(() => {
    if (results.length > 0) {
      sortResults();
    }
  }, [sortBy]);

  const fetchExamResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          *,
          profiles!exam_results_student_id_fkey(full_name)
        `)
        .eq('exam_id', exam.id)
        .order('percentage', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching exam results:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortResults = () => {
    const sortedResults = [...results].sort((a, b) => {
      switch (sortBy) {
        case 'marks-high':
          return b.percentage - a.percentage;
        case 'marks-low':
          return a.percentage - b.percentage;
        case 'name-az':
          return (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || '');
        case 'name-za':
          return (b.profiles?.full_name || '').localeCompare(a.profiles?.full_name || '');
        default:
          return 0;
      }
    });
    setResults(sortedResults);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium">{index + 1}</span>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exam?.title} - Results</DialogTitle>
          <DialogDescription>
            Subject: {exam?.exam_name} • Total Marks: {exam?.total_marks}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Student Results ({results.length} participants)</h3>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marks-high">Marks (High to Low)</SelectItem>
                <SelectItem value="marks-low">Marks (Low to High)</SelectItem>
                <SelectItem value="name-az">Name (A-Z)</SelectItem>
                <SelectItem value="name-za">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading results...</div>
          ) : results.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result: any, index) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRankIcon(index)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {result.profiles?.full_name || 'Unknown Student'}
                    </TableCell>
                    <TableCell>
                      {result.score}/{result.total_marks}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{result.percentage.toFixed(1)}%</span>
                        <Badge variant={result.percentage >= 60 ? 'default' : 'destructive'}>
                          {result.percentage >= 60 ? 'Pass' : 'Fail'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={result.percentage >= 80 ? 'default' : result.percentage >= 60 ? 'secondary' : 'destructive'}>
                        {result.percentage >= 80 ? 'Excellent' : result.percentage >= 60 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {result.completed_at ? new Date(result.completed_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

export default ExamResultsDialog;
