import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import CreateExamDialog from './CreateExamDialog';

interface AdminDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, setActiveTab }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      {activeTab === 'overview' && (
        <div>
          <h2 className="text-3xl font-bold text-foreground">Overview</h2>
          <p className="text-muted-foreground">Statistics and summary of the platform</p>
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Manage Exams</h2>
              <p className="text-muted-foreground">Create, edit, and manage your examinations</p>
            </div>
            <div className="flex items-center gap-3">
              <CreateExamDialog />
            </div>
          </div>

          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search exams by title or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'results' && (
        <div>
          <h2 className="text-3xl font-bold text-foreground">Results</h2>
          <p className="text-muted-foreground">View and manage exam results</p>
        </div>
      )}

      {activeTab === 'students' && (
        <div>
          <h2 className="text-3xl font-bold text-foreground">Students</h2>
          <p className="text-muted-foreground">Manage student accounts and permissions</p>
        </div>
      )}

      {activeTab === 'admin-applications' && (
        <div>
          <h2 className="text-3xl font-bold text-foreground">Admin Applications</h2>
          <p className="text-muted-foreground">Review and approve admin applications</p>
        </div>
      )}

      {activeTab === 'profile' && (
        <div>
          <h2 className="text-3xl font-bold text-foreground">Profile</h2>
          <p className="text-muted-foreground">Manage your profile settings</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
