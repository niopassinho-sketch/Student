import { motion } from 'framer-motion';
import { Bell, BookOpen, CalendarDays, History, BarChart3, LogOut } from 'lucide-react';
import { useStudy } from '@/contexts/StudyContext';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewCard } from '@/components/ReviewCard';
import { AddStudyDialog } from '@/components/AddStudyDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { StudyCard } from '@/components/StudyCard';
import { Button } from '@/components/ui/button';
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Tab = 'today' | 'agenda' | 'history' | 'stats';

const Index = () => {
  const { studies, todayReviews, loading } = useStudy();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [settings, setSettings] = useState<{ logo_url: string | null; favicon_url: string | null; theme: string } | null>(null);

  useEffect(() => {
    console.log("Settings state:", settings);
    if (!user) return;

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          // Removemos o filtro '.eq('user_id', user.id)' para buscar a configuração global
          // (a mais recente salva no banco independentemente do usuário)
          .order('updated_at', { ascending: false })
          .limit(1);
        
        if (data && data.length > 0) {
          setSettings(data[0]);
        }
      } catch (err) {
        console.error('Unexpected error loading settings:', err);
      }
    };
    loadSettings();

    // Real-time subscription - ouvindo todas as alterações na tabela
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'app_settings'
      }, (payload) => {
        if (payload.new) setSettings(payload.new as any);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get all upcoming reviews
  const upcomingReviews = studies.flatMap(s =>
    s.reviews
      .filter(r => !r.completed && !isToday(parseISO(r.scheduledDate)))
      .map(r => ({ ...r, subjectName: s.subject }))
  ).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  // Stats
  const totalStudies = studies.length;
  const completedStudies = studies.filter(s => s.completed).length;
  const totalReviews = studies.flatMap(s => s.reviews).length;
  const completedReviews = studies.flatMap(s => s.reviews).filter(r => r.completed).length;
  const overdueReviews = studies.flatMap(s =>
    s.reviews.filter(r => !r.completed && isPast(parseISO(r.scheduledDate)) && !isToday(parseISO(r.scheduledDate)))
  ).length;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header and Banner are fixed */}
      <div className="shrink-0">
        <header className="border-b border-border bg-card/60 backdrop-blur-md">
          <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <img 
                 src={settings?.logo_url || "/logo_3d.png"} 
                 alt="Student Logo" 
                 className="w-10 h-10 object-contain"
               />
              <div>
                <h1 className="font-display text-xl font-bold">Student</h1>
                <p className="text-xs text-muted-foreground">Gestão de Revisões Espaçadas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* --- INICIO DA ALTERAÇÃO --- */}
              <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-sm font-semibold text-foreground">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Aluno'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
              {/* --- FIM DA ALTERAÇÃO --- */}

              {todayReviews.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <Bell className="w-5 h-5 text-secondary" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {todayReviews.length}
                  </span>
                </motion.div>
              )}
              <SettingsDialog />
              <AddStudyDialog />
              <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Today's Alert Banner */}
        {todayReviews.length > 0 && activeTab !== 'today' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary/10 border-b border-secondary/20 cursor-pointer"
            onClick={() => setActiveTab('today')}
          >
            <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4 text-secondary" />
              <span className="font-medium">Você tem {todayReviews.length} revisão(ões) para hoje!</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
            {/* The tabs trigger issticky to stay at the top of the scrollable area */}
            <TabsList className="w-full justify-start gap-1 bg-muted/50 mb-6 sticky top-0 z-40">
              <TabsTrigger value="stats" className="gap-1.5 data-[state=active]:bg-card">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="today" className="gap-1.5 data-[state=active]:bg-card">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Hoje</span>
                {todayReviews.length > 0 && (
                  <span className="ml-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {todayReviews.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="agenda" className="gap-1.5 data-[state=active]:bg-card">
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Agenda</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 data-[state=active]:bg-card">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Histórico</span>
              </TabsTrigger>
            </TabsList>
            
            {/* TODAY */}
            <TabsContent value="today" className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold mb-1">Revisões de Hoje</h2>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              {todayReviews.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card rounded-xl p-12 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-1">Tudo em dia! 🎉</h3>
                  <p className="text-sm text-muted-foreground">Nenhuma revisão pendente para hoje.</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {todayReviews.map(review => (
                    <ReviewCard key={review.id} review={review} showNotes={true} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* AGENDA */}
            <TabsContent value="agenda" className="space-y-4">
              <h2 className="font-display text-2xl font-bold">Agenda de Revisões</h2>
              {upcomingReviews.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                  <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma revisão agendada.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingReviews.map(review => (
                    <ReviewCard key={review.id} review={review} showNotes={false} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* HISTORY */}
            <TabsContent value="history" className="space-y-4">
              <h2 className="font-display text-2xl font-bold">Histórico de Estudos</h2>
              {studies.filter(s => s.completed).length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                  <History className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum estudo concluído ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...studies].filter(s => s.completed).reverse().map(study => (
                    <StudyCard key={study.id} study={study} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* STATS */}
            <TabsContent value="stats" className="space-y-6 bg-muted/30 p-6 rounded-2xl border border-border/50">
              <h2 className="font-display text-2xl font-bold">Dashboard</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Aulas', value: totalStudies, color: 'text-primary' },
                  { label: 'Concluídas', value: completedStudies, color: 'text-success' },
                  { label: 'Revisões Feitas', value: completedReviews, color: 'text-accent' },
                  { label: 'Atrasadas', value: overdueReviews, color: 'text-destructive' },
                ].map(stat => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card rounded-xl p-4 text-center bg-card/50"
                  >
                    <p className={cn("font-display text-3xl font-bold", stat.color)}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-4 bg-card/50">
                  <h3 className="font-display font-semibold mb-4">Revisões por Matéria</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={studies.map(s => ({ name: s.subject, reviews: s.reviews.length }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="reviews" fill="#8884d8" radius={[4, 4, 0, 0]}>
                          {studies.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658'][index % 3]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {totalReviews > 0 && (
                  <div className="glass-card rounded-xl p-4 bg-card/50">
                    <h3 className="font-display font-semibold mb-4">Progresso Geral</h3>
                    <div className="flex items-center justify-center h-48">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-primary">{Math.round((completedReviews / totalReviews) * 100)}%</p>
                        <p className="text-sm text-muted-foreground mt-2">de revisões concluídas</p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden mt-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(completedReviews / totalReviews) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-display font-semibold">Aulas Agendadas</h3>
                {studies.filter(s => !s.completed).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma aula agendada.</p>
                ) : (
                  <div className="space-y-3">
                    {studies.filter(s => !s.completed).map(study => (
                      <StudyCard key={study.id} study={study} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
