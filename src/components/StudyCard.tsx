import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, BookOpen, Trash2, ChevronDown, Pencil, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStudy } from '@/contexts/StudyContext';
import { Study, REVIEW_TYPE_LABELS } from '@/lib/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { EditStudyDialog } from './EditStudyDialog';

const reviewDotColors = [
  'bg-review-1', 'bg-review-2', 'bg-review-3', 'bg-review-4',
];

export function StudyCard({ study }: { study: Study }) {
  const { markStudyAsWatched, deleteStudy, updateReviewNotes } = useStudy();
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);

  const completedReviews = study.reviews.filter(r => r.completed).length;

  const handleComplete = () => {
    markStudyAsWatched(study.id, completionDate);
    setShowCompletionDialog(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <h3 className="font-display font-semibold truncate">
                  {study.discipline ? `${study.discipline} - ${study.subject}` : study.subject}
                </h3>
                {study.url && (
                  <a href={study.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              {study.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{study.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{format(parseISO(study.studyDate), "dd/MM/yyyy")}</span>
                <span className="flex items-center gap-1">
                  {completedReviews}/4 revisões
                </span>
                {study.completed && (
                  <Badge variant="outline" className="text-xs text-success border-success/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Estudo concluído
                  </Badge>
                )}
              </div>
              {/* Progress dots */}
              <div className="flex gap-1.5 mt-2">
                {study.reviews.map((r, i) => (
                  <div
                    key={r.id}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all",
                      r.completed ? reviewDotColors[i] : "bg-muted"
                    )}
                    title={`${r.reviewNumber}ª Revisão - ${r.completed ? 'Concluída' : 'Pendente'}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              {!study.completed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompletionDialog(true)}
                  className="text-success hover:text-success gap-1"
                  title="Marcar aula como assistida"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Assistida
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditOpen(true)}
                className="text-muted-foreground hover:text-primary"
                title="Editar estudo"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpanded(!expanded)}
                className="text-muted-foreground"
              >
                <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteStudy(study.id)}
                className="text-muted-foreground hover:text-destructive"
                title="Excluir estudo"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cronograma de Revisões</h4>
              {study.reviews.map((r, i) => (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-center justify-between text-sm p-2 rounded-lg",
                    r.completed ? "bg-success/5" : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", r.completed ? reviewDotColors[i] : "bg-muted-foreground/30")} />
                    <span className="font-medium">{r.reviewNumber}ª Revisão</span>
                    <span className="text-muted-foreground">
                      {format(parseISO(r.scheduledDate), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 justify-end">
                      {r.completed && r.type && (
                        <Badge variant="outline" className="text-xs">
                          {REVIEW_TYPE_LABELS[r.type]}
                        </Badge>
                      )}
                      {r.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Pendente</span>
                      )}
                    </div>
                    {r.completed && (
                      <Input
                        placeholder="Minhas impressões..."
                        defaultValue={r.notes}
                        onBlur={(e) => updateReviewNotes(study.id, r.id, e.target.value)}
                        className="text-xs h-8"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
      <EditStudyDialog study={study} open={editOpen} onOpenChange={setEditOpen} />
      {showCompletionDialog && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="glass-card rounded-xl p-6 w-full max-w-xs space-y-4 bg-white">
            <h3 className="font-display font-semibold">Data de Conclusão</h3>
            <Input
              type="date"
              value={completionDate}
              onChange={e => setCompletionDate(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCompletionDialog(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleComplete} className="flex-1">Confirmar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
