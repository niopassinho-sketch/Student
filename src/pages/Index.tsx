import { motion } from 'framer-motion';
import { Bell, BookOpen, CalendarDays, History, BarChart3, LogOut, Search, CheckCircle2 } from 'lucide-react';
import { useStudy } from '@/contexts/StudyContext';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewCard } from '@/components/ReviewCard';
import { AddStudyDialog } from '@/components/AddStudyDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { StudyCard } from '@/components/StudyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

type Tab = 'today' | 'agenda' | 'history' | 'stats';

const Index = () => {
  const { studies, todayReviews, loading } = useStudy();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [settings, setSettings] = useState<{ logo_url: string | null; favicon_url: string | null; theme: string } | null>(null);
  
  // Agenda filters
  const [agendaSearchTerm, setAgendaSearchTerm] = useState('');
  const [agendaReviewFilter, setAgendaReviewFilter] = useState('all');

  useEffect(() => {
    console.log("Settings state:", settings);
    if (!user?.id) return;

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
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get all upcoming reviews
  let upcomingReviews = studies.flatMap(s =>
    s.reviews
      .filter(r => !r.completed && !isToday(parseISO(r.scheduledDate)))
      .map(r => ({ ...r, subjectName: s.subject, disciplineName: s.discipline }))
  ).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  if (agendaSearchTerm) {
    const term = agendaSearchTerm.toLowerCase();
    upcomingReviews = upcomingReviews.filter(r => 
      r.subjectName.toLowerCase().includes(term) || 
      (r.disciplineName?.toLowerCase().includes(term))
    );
  }

  if (agendaReviewFilter !== 'all') {
    upcomingReviews = upcomingReviews.filter(r => r.reviewNumber.toString() === agendaReviewFilter);
  }

  // Get today's scheduled studies
  const todayStudies = studies.filter(s => !s.completed && s.studyDate && isToday(parseISO(s.studyDate)));

  // Stats
  const totalStudies = studies.length;
  const completedStudies = studies.filter(s => s.completed).length;
  const totalReviews = studies.flatMap(s => s.reviews).length;
  const completedReviews = studies.flatMap(s => s.reviews).filter(r => r.completed).length;
  const overdueReviews = studies.flatMap(s =>
    s.reviews.filter(r => !r.completed && isPast(parseISO(r.scheduledDate)) && !isToday(parseISO(r.scheduledDate)))
  ).length;

  // Chart Data Preparation
  const chartData = [...studies.reduce((acc, s) => {
    const name = s.discipline || 'Outros';
    if (!acc.has(name)) {
      acc.set(name, { name, concluidas: 0, pendentes: 0, total: 0 });
    }
    const stat = acc.get(name)!;
    s.reviews.forEach(r => {
      if (r.completed) stat.concluidas++;
      else stat.pendentes++;
      stat.total++;
    });
    return acc;
  }, new Map())].map(([_, val]) => val).sort((a, b) => b.total - a.total);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header and Banner are fixed */}
      <div className="shrink-0">
        <header className="border-b border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-indigo-400/5 to-background backdrop-blur-md shadow-sm">
          <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <img 
                 src={settings?.logo_url || "/logo_3d.png"} 
                 alt="Student Logo" 
                 className="w-10 h-10 object-contain"
               />
              <div>
                <h1 className="font-display text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-blue-500">Student</h1>
                <p className="text-xs text-muted-foreground font-medium">Gestão de Revisões Espaçadas</p>
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

              {(todayReviews.length > 0 || todayStudies.length > 0) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <Bell className="w-5 h-5 text-secondary" />
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {todayReviews.length + todayStudies.length}
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
        {(todayReviews.length > 0 || todayStudies.length > 0) && activeTab !== 'today' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary/10 border-b border-secondary/20 cursor-pointer"
            onClick={() => setActiveTab('today')}
          >
            <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4 text-secondary" />
              <span className="font-medium">
                Você tem {(todayReviews.length > 0 && todayStudies.length > 0) ? `${todayStudies.length} aula(s) e ${todayReviews.length} revisão(ões)` : todayStudies.length > 0 ? `${todayStudies.length} aula(s)` : `${todayReviews.length} revisão(ões)`} pendentes para hoje!
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
            {/* The tabs trigger issticky to stay at the top of the scrollable area */}
            <TabsList className="w-full justify-start gap-2 bg-slate-500/10 dark:bg-slate-500/20 backdrop-blur-md mb-6 sticky top-0 z-40 p-2 h-auto border-b border-border/50 shadow-sm rounded-xl">
              <TabsTrigger value="stats" className="gap-1.5 data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-lg py-2 transition-all">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="today" className="gap-1.5 data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-lg py-2 transition-all">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Hoje</span>
                {(todayReviews.length > 0 || todayStudies.length > 0) && (
                  <span className="ml-1 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                    {todayReviews.length + todayStudies.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="agenda" className="gap-1.5 data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-lg py-2 transition-all">
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Agenda</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-lg py-2 transition-all">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Histórico</span>
              </TabsTrigger>
            </TabsList>
            
            {/* TODAY */}
            <TabsContent value="today" className="space-y-8">
              <div>
                <h2 className="font-display text-2xl font-bold mb-1">Seu Dia</h2>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>

              {/* Today's Studies (Aulas) */}
              <div className="space-y-4">
                <h3 className="font-display font-semibold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-5 h-5" /> Aulas e Estudos de Hoje
                </h3>
                {todayStudies.length === 0 ? (
                 <div className="p-6 text-center bg-muted/20 border border-border/40 rounded-xl border-dashed">
                    <p className="text-sm text-muted-foreground">Nenhuma aula agendada para assistir hoje.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayStudies.map(study => (
                      <StudyCard key={study.id} study={study} />
                    ))}
                  </div>
                )}
              </div>

              {/* Today's Reviews */}
              <div className="space-y-4">
                <h3 className="font-display font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" /> Revisões de Hoje
                </h3>
                {todayReviews.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 text-center bg-muted/20 border border-border/40 rounded-xl border-dashed"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h3 className="font-display font-medium text-lg mb-1">Tudo em dia! 🎉</h3>
                    <p className="text-sm text-muted-foreground">Você não tem revisões pendentes para hoje.</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {todayReviews.map(review => (
                      <ReviewCard key={review.id} review={review} showNotes={true} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* AGENDA */}
            <TabsContent value="agenda" className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold mb-1">Agenda de Revisões</h2>
                <p className="text-sm text-muted-foreground">O que você tem planejado para o futuro</p>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar matéria ou disciplina..." 
                    className="pl-9 bg-card focus-visible:ring-indigo-500/30"
                    value={agendaSearchTerm}
                    onChange={e => setAgendaSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select value={agendaReviewFilter} onValueChange={setAgendaReviewFilter}>
                    <SelectTrigger className="bg-card w-full">
                      <SelectValue placeholder="Todas as revisões" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as revisões</SelectItem>
                      <SelectItem value="1">1ª Revisão</SelectItem>
                      <SelectItem value="2">2ª Revisão</SelectItem>
                      <SelectItem value="3">3ª Revisão</SelectItem>
                      <SelectItem value="4">4ª Revisão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {upcomingReviews.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center border-dashed">
                  <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <h3 className="font-display font-medium text-lg mb-1">Nada agendado</h3>
                  <p className="text-sm text-muted-foreground">Nenhuma revisão foi encontrada com seus filtros.</p>
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
            <TabsContent value="stats" className="space-y-8 mt-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Dashboard</h2>
                <p className="text-sm text-muted-foreground">Resumo do seu desempenho geral</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Aulas', value: totalStudies, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/5 border-blue-500/20' },
                  { label: 'Concluídas', value: completedStudies, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
                  { label: 'Revisões Feitas', value: completedReviews, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/20' },
                  { label: 'Atrasadas', value: overdueReviews, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/5 border-rose-500/20' },
                ].map(stat => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn("rounded-xl py-3 px-4 text-center border shadow-sm transition-all hover:shadow-md flex flex-col justify-center", stat.bg)}
                  >
                    <p className={cn("font-display text-3xl font-bold leading-none", stat.color)}>{stat.value}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-1.5 uppercase tracking-wide">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-6 border border-border shadow-sm bg-card relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
                  <h3 className="font-display font-semibold mb-6">Revisões por Matéria</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          fontSize={11} 
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          dy={10} 
                          tickFormatter={(value) => value.length > 20 ? value.substring(0, 18) + '...' : value}
                        />
                        <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip 
                          cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="concluidas" name="Concluídas" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={32} />
                        <Bar dataKey="pendentes" name="Pendentes" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {totalReviews > 0 && (
                  <div className="rounded-2xl p-6 border border-border bg-card shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/5 rounded-tr-full pointer-events-none" />
                    <h3 className="font-display font-semibold absolute top-6 left-6">Progresso Geral</h3>
                    <div className="text-center relative z-10 w-full px-6">
                      <motion.p 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="text-8xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-emerald-500 tracking-tighter"
                      >
                        {Math.round((completedReviews / totalReviews) * 100)}<span className="text-5xl">%</span>
                      </motion.p>
                      <p className="text-sm font-semibold text-muted-foreground mt-4 uppercase tracking-widest">
                        de todas revisões prontas
                      </p>
                      <div className="w-full max-w-[280px] mx-auto bg-muted rounded-full h-3 overflow-hidden mt-8 shadow-inner border border-border/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(completedReviews / totalReviews) * 100}%` }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl p-6 border border-border bg-card shadow-sm relative overflow-hidden mt-6">
                <div className="absolute top-0 left-0 w-1 bg-indigo-500 bottom-0" />
                <h3 className="font-display text-xl font-bold mb-4 ml-2">Suas Aulas Agendadas</h3>
                {studies.filter(s => !s.completed).length === 0 ? (
                  <div className="p-8 text-center bg-muted/20 border border-border/40 rounded-xl my-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground">Nenhuma aula pendente agendada.</p>
                  </div>
                ) : (
                  <div className="space-y-4 ml-2">
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
