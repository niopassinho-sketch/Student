import { useState } from 'react';
import { Pencil, BookOpen, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useStudy } from '@/contexts/StudyContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Study } from '@/lib/types';

export function EditStudyDialog({ study, open, onOpenChange }: { study: Study, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { updateStudy } = useStudy();
  const [discipline, setDiscipline] = useState(study.discipline || '');
  const [subject, setSubject] = useState(study.subject || '');
  const [completionDate, setCompletionDate] = useState(study.completionDate || study.studyDate || '');
  const [description, setDescription] = useState(study.description || '');
  const [url, setUrl] = useState(study.url || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discipline.trim() || !subject.trim() || !completionDate) return;
    updateStudy(study.id, discipline.trim(), subject.trim(), completionDate, description.trim() || undefined, url.trim() || undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Aula
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Matéria/Disciplina *</label>
            <Input
              value={discipline}
              onChange={e => setDiscipline(e.target.value)}
              placeholder="Ex: Direito Constitucional"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Assunto *</label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ex: Art. 5º - Direitos e Garantias Fundamentais"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Data de Conclusão *</label>
            <Input
              type="date"
              value={completionDate}
              onChange={e => setCompletionDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">URL da Aula (opcional)</label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
                className="pl-9"
                type="url"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Descrição (opcional)</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Notas adicionais sobre o estudo..."
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full font-semibold" disabled={!discipline.trim() || !subject.trim() || !completionDate}>
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
