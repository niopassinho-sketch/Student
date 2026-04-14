import { useState } from 'react';
import { Plus, BookOpen, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useStudy } from '@/contexts/StudyContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function AddStudyDialog() {
  const { addStudy } = useStudy();
  const [open, setOpen] = useState(false);
  const [discipline, setDiscipline] = useState('');
  const [subject, setSubject] = useState('');
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discipline.trim() || !subject.trim() || !completionDate) return;
    addStudy(discipline.trim(), subject.trim(), completionDate, description.trim() || undefined, url.trim() || undefined);
    setDiscipline('');
    setSubject('');
    setCompletionDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setUrl('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 font-display font-semibold shadow-lg hover:shadow-xl transition-shadow">
          <Plus className="w-5 h-5" />
          Nova Aula
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Registrar Nova Aula
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
            Cadastrar Aula
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
