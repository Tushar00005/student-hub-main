import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Shield, Users, FileText, MessageCircle, Eye, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function AdminContent() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'admin') {
        navigate('/');
        return;
      }
      fetchData();
    }
  }, [user, role, authLoading, navigate]);

  const fetchData = async () => {
    try {
      const [usersRes, postsRes, commentsRes] = await Promise.all([
        supabase.from('profiles').select('*, user_roles(role)').order('created_at', { ascending: false }),
        supabase.from('posts').select('*, profiles!posts_author_id_fkey(name)').order('created_at', { ascending: false }),
        supabase.from('comments').select('*, profiles!comments_user_id_fkey(name), posts!comments_post_id_fkey(title)').order('created_at', { ascending: false }),
      ]);

      if (usersRes.data) {
        setUsers(usersRes.data.map((u: any) => ({
          ...u,
          role: u.user_roles?.[0]?.role || 'student',
        })));
      }
      if (postsRes.data) {
        setPosts(postsRes.data.map((p: any) => ({
          ...p,
          author_name: p.profiles?.name || 'Unknown',
        })));
      }
      if (commentsRes.data) {
        setComments(commentsRes.data.map((c: any) => ({
          ...c,
          user_name: c.profiles?.name || 'Unknown',
          post_title: c.posts?.title || 'Unknown Post',
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await supabase.from('posts').delete().eq('id', postId);
      setPosts(posts.filter((p) => p.id !== postId));
      toast.success('Post deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await supabase.from('comments').delete().eq('id', commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar onOpenAuth={() => {}} />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage users, posts, and comments</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{posts.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Total Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{comments.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="users">
                <TabsList>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="mt-4">
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {u.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                          {u.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="posts" className="mt-4">
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{post.title}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>By {post.author_name}</span>
                            <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                            {post.status}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/post/${post.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="mt-4">
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{comment.content}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>By {comment.user_name}</span>
                            <span>on "{comment.post_title}"</span>
                            <span>{format(new Date(comment.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-destructive hover:text-destructive ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

export default function Admin() {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
}
