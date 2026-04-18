import { format, parseISO, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { AlertCircle, Calendar, CheckCircle2, Video, FileText, HelpCircle, CalendarClock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useStudy } from '@/contexts/StudyContext';
import { Review, ReviewType, REVIEW_TYPE_LABELS } from '@/lib/types';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const reviewColors: Record<number, string> = {
  1: 'review-badge-1',
  2: 'review-badge-2',
  3: 'review-badge-3',
  4: 'review-badge-4',
};

const reviewIcons: Record<string, React.ReactNode> = {
  video: <Video className="w-4 h-4" />,
  pdf: <FileText className="w-4 h-4" />,
  questions: <HelpCircle className="w-4 h-4" />,
};

interface ReviewCardProps {
  review: Review & { subjectName: string; studyUrl?: string };
  showSubject?: boolean;
  showNotes?: boolean;
}

export function ReviewCard({ review, showSubject = true, showNotes = false }: ReviewCardProps) {
  const { markReviewComplete, rescheduleReview, checkDateConflict, updateReviewNotes } = useStudy();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ReviewType>('video');
  const [notes, setNotes] = useState(review.notes || '');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [conflictWarning, setConflictWarning] = useState(false);

  const isOverdue = isPast(parseISO(review.scheduledDate)) && !isToday(parseISO(review.scheduledDate));

  const handleComplete = () => {
    markReviewComplete(review.studyId, review.id, selectedType);
    updateReviewNotes(review.studyId, review.id, notes);
    setCompleteOpen(false);
  };

  const handleReschedule = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    rescheduleReview(review.studyId, review.id, dateStr);
    setRescheduleOpen(false);
    setSelectedDate(undefined);
    setConflictWarning(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      setConflictWarning(checkDateConflict(dateStr, review.id));
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all relative overflow-hidden",
          review.completed 
            ? "bg-muted/20 border border-border/40 opacity-75" 
            : "bg-card border border-indigo-500/15 shadow-sm hover:shadow-md hover:border-indigo-500/30",
          isOverdue && "border-rose-500/50 bg-rose-500/5"
        )}
      >
        {(!review.completed && !isOverdue) && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl" />}
        {isOverdue && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-l-xl" />}
        <div className="flex-1 min-w-0 pl-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", reviewColors[review.reviewNumber])}>
              {review.reviewNumber}ª Revisão
            </span>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertCircle className="w-3 h-3" /> Atrasada
              </Badge>
            )}
            {review.rescheduledFrom && (
              <Badge variant="outline" className="text-xs gap-1">
                <CalendarClock className="w-3 h-3" /> Remarcada
              </Badge>
            )}
          </div>
          {showSubject && (
            <p className="font-semibold text-foreground truncate">{review.subjectName}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {format(parseISO(review.scheduledDate), "dd 'de' MMMM", { locale: ptBR })}
          </p>
          {review.studyUrl && (
            <a
              href={review.studyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
            >
              <ExternalLink className="w-3 h-3" />
              Acessar aula
            </a>
          )}
          {showNotes && (
            <div className="mt-3">
              <Textarea
                placeholder="Minhas impressões..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => updateReviewNotes(review.studyId, review.id, notes)}
                rows={2}
                className="text-sm"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(true)}>
            <Calendar className="w-4 h-4 mr-1" /> Remarcar
          </Button>
          <Button size="sm" onClick={() => setCompleteOpen(true)} className="bg-success hover:bg-success/90 text-success-foreground">
            <CheckCircle2 className="w-4 h-4 mr-1" /> Concluir
          </Button>
          {review.completed && review.notes && (
            <Button variant="ghost" size="sm" onClick={() => setNotesOpen(true)}>
              <FileText className="w-4 h-4 mr-1" /> Ver Impressões
            </Button>
          )}
        </div>
      </motion.div>

      {/* Notes Dialog */}
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="glass-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Minhas Impressões</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder="Minhas impressões..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[150px] resize-y"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNotesOpen(false)}>Fechar</Button>
              <Button onClick={() => { updateReviewNotes(review.studyId, review.id, notes); setNotesOpen(false); }} className="bg-primary text-primary-foreground">
                Salvar Impressões
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="font-display">Concluir Revisão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Como você revisou <strong>{review.subjectName}</strong>?
            </p>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ReviewType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REVIEW_TYPE_LABELS) as ReviewType[]).map(type => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      {reviewIcons[type]} {REVIEW_TYPE_LABELS[type]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleComplete} className="w-full bg-success hover:bg-success/90 text-success-foreground font-semibold">
              Finalizar Revisão
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="font-display">Remarcar Revisão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione a nova data para a <strong>{review.reviewNumber}ª revisão</strong> de{' '}
              <strong>{review.subjectName}</strong>
            </p>
            {conflictWarning && (
              <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-secondary/10 text-secondary border border-secondary/30">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Já existe uma revisão agendada para esta data.
              </div>
            )}
            <div className="flex justify-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                className="pointer-events-auto"
                locale={ptBR}
              />
            </div>
            <Button
              onClick={handleReschedule}
              className="w-full font-semibold"
              disabled={!selectedDate}
            >
              Confirmar Remarcação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
