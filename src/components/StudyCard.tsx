import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, BookOpen, Trash2, ChevronDown, Pencil, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useStudy } from '@/contexts/StudyContext';
import { Study, Review, REVIEW_TYPE_LABELS } from '@/lib/types';
import { useState, useEffect } from 'react';
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
  const [selectedNotesReview, setSelectedNotesReview] = useState<Review | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const completedReviews = study.reviews.filter(r => r.completed).length;

  const handleComplete = () => {
    markStudyAsWatched(study.id, completionDate);
    setShowCompletionDialog(false);
  };

  const handleSaveNotes = () => {
    if (selectedNotesReview) {
      updateReviewNotes(study.id, selectedNotesReview.id, notesDraft);
      setSelectedNotesReview(null);
    }
  };

  useEffect(() => {
    if (selectedNotesReview) {
      setNotesDraft(selectedNotesReview.notes || '');
    }
  }, [selectedNotesReview]);

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
                    "flex flex-col text-sm p-3 rounded-lg gap-2",
                    r.completed ? "bg-success/5" : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", r.completed ? reviewDotColors[i] : "bg-muted-foreground/30")} />
                      <span className="font-medium">{r.reviewNumber}ª Revisão</span>
                      <span className="text-muted-foreground">
                        {format(parseISO(r.scheduledDate), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
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
                  </div>
                  
                  {r.completed && (
                    <div className="flex justify-end mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-primary gap-1"
                        onClick={() => setSelectedNotesReview(r)}
                      >
                        <FileText className="w-3 h-3" />
                        {r.notes ? 'Ver Impressões' : 'Adicionar Impressão'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
      <EditStudyDialog study={study} open={editOpen} onOpenChange={setEditOpen} />
      
      {/* Existent Dialogs */}
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
      <Dialog 
        open={!!selectedNotesReview} 
        onOpenChange={(open) => {
          if (!open) {
            // Auto-save any drafts when clicking outside/closing
            if (selectedNotesReview) {
              updateReviewNotes(study.id, selectedNotesReview.id, notesDraft);
            }
            setSelectedNotesReview(null);
          }
        }}
      >
        <DialogContent className="glass-card max-w-lg" aria-labelledby="notes-dialog-title" aria-describedby="notes-dialog-description">
          <DialogHeader>
            <DialogTitle id="notes-dialog-title" className="font-display">Minhas Impressões</DialogTitle>
            <DialogDescription id="notes-dialog-description">
              {selectedNotesReview && `Anotações da ${selectedNotesReview.reviewNumber}ª revisão`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder="Escreva suas anotações, dificuldades ou pontos importantes..."
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={() => {
                if (selectedNotesReview) {
                  updateReviewNotes(study.id, selectedNotesReview.id, notesDraft);
                }
              }}
              className="min-h-[150px] resize-y"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                if (selectedNotesReview) {
                  updateReviewNotes(study.id, selectedNotesReview.id, notesDraft);
                }
                setSelectedNotesReview(null);
              }}>
                Fechar
              </Button>
              <Button onClick={handleSaveNotes} className="bg-primary text-primary-foreground">
                Salvar Impressões
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
