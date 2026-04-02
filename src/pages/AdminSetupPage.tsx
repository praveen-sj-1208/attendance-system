import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminSetupPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) throw error;
      if (!data.user) throw new Error('No user returned');

      const { data: result, error: rpcError } = await supabase.rpc('setup_first_admin', {
        _user_id: data.user.id,
      });

      if (rpcError) throw rpcError;

      if (result) {
        toast({ title: 'Success!', description: 'Admin account created. Please sign in.' });
      } else {
        toast({ title: 'Note', description: 'An admin already exists. Your account was created as a student.', variant: 'destructive' });
      }
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <CardDescription>Create the initial administrator account. Only works if no admin exists.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="Admin User" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@college.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Setting up...' : 'Create Admin Account'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link to="/login" className="text-primary hover:underline font-medium">Back to Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetupPage;
