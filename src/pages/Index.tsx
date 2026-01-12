import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { PostCard } from '@/components/blog/PostCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AuthProvider } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Users, PenSquare, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

function IndexContent() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedPosts();
  }, []);

  const fetchFeaturedPosts = async () => {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          excerpt,
          cover_image,
          created_at,
          status,
          author_id,
          profiles!posts_author_id_fkey (name, avatar_url)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      const postsWithCounts = await Promise.all(
        (posts || []).map(async (post: any) => {
          const [likesRes, commentsRes] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id),
          ]);

          return {
            ...post,
            author: {
              name: post.profiles?.name || 'Unknown',
              avatar_url: post.profiles?.avatar_url,
            },
            likes_count: likesRes.count || 0,
            comments_count: commentsRes.count || 0,
          };
        })
      );

      setFeaturedPosts(postsWithCounts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const features = [
    {
      icon: PenSquare,
      title: 'Write & Publish',
      description: 'Create well-structured, visually appealing blog posts using a simple and intuitive editor. Save drafts and publish when you are ready.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect with students from diverse backgrounds, exchange ideas, and engage meaningfully through discussions,comments and interactions',
    },
    {
      icon: Sparkles,
      title: 'Discover',
      description: 'Explore a wide range of topics written by students across the globe. Gain new perspectives, stay inspired and continue learning.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar onOpenAuth={openAuth} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <BookOpen className="h-4 w-4" />
              A Modern Publishing Platform for Students
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Share Your{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Academic Journey
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              A modern platform for students to write, publish and connect through knowledge and ideas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => openAuth('signup')} className="group">
                Get Started for Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/blog">Explore Posts</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border/40">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Powerful features designed for students who want to share their ideas and perspectives.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-border/40 bg-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-12"
            >
              <div>
                <h2 className="text-3xl font-bold mb-2">Latest Posts</h2>
                <p className="text-muted-foreground">Fresh content from our student community.</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/blog">View All</Link>
              </Button>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredPosts.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-12 text-primary-foreground"
          >
            <h2 className="text-3xl font-bold mb-4">Start Your Writing Journey Today</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join a growing community of studnets sharing knowledge ,ideas, and experiences. Getting started is completely free!. 
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => openAuth('signup')}
              className="bg-background text-foreground hover:bg-background/90"
            >
              Create Your Account
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 StudentBlog. Built for learners, by students, for students.</p>
        </div>
      </footer>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <IndexContent />
    </AuthProvider>
  );
}
