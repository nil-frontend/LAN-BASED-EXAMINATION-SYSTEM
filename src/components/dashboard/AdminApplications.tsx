
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Search, Shield, Mail, User } from 'lucide-react';

interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  admin_approved: boolean;
  created_at: string;
  is_admin: boolean;
  is_super_admin: boolean;
}

const AdminApplications = () => {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdmins();
    
    // Set up interval to fetch data every 3 seconds
    const interval = setInterval(() => {
      fetchAdmins();
    }, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', true)
        .eq('is_super_admin', false) // Exclude super admins
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAdminStatus = async (adminId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ admin_approved: approved })
        .eq('id', adminId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Admin ${approved ? 'approved' : 'revoked'} successfully`,
      });

      // Immediately fetch updated data
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive",
      });
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingAdmins = filteredAdmins.filter(admin => !admin.admin_approved);
  const approvedAdmins = filteredAdmins.filter(admin => admin.admin_approved);

  if (loading && admins.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Applications</h1>
          <p className="text-muted-foreground">Manage admin account approvals and permissions</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Pending Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Pending Approvals ({pendingAdmins.length})
          </CardTitle>
          <CardDescription>Admin accounts waiting for approval</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingAdmins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {admin.full_name}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {admin.email}
                    </TableCell>
                    <TableCell>
                      {new Date(admin.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateAdminStatus(admin.id, true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateAdminStatus(admin.id, false)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No pending applications</h3>
              <p className="text-muted-foreground">All admin applications have been reviewed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Approved Admins ({approvedAdmins.length})
          </CardTitle>
          <CardDescription>Currently approved admin accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {approvedAdmins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Approved Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {admin.full_name}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {admin.email}
                    </TableCell>
                    <TableCell>
                      {new Date(admin.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400">
                        Approved
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAdminStatus(admin.id, false)}
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No approved admins</h3>
              <p className="text-muted-foreground">No admin accounts have been approved yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminApplications;
