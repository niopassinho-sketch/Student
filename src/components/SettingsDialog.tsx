import { useState } from 'react';
import { Settings, Moon, Sun, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function SettingsDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (!user) return;
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${user.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName);

      const publicUrl = data.publicUrl;
      
      if (type === 'logo') setLogoUrl(publicUrl);
      else setFaviconUrl(publicUrl);

      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} enviado!`);
    } catch (error) {
      toast.error('Erro ao fazer upload');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ 
          user_id: user.id, 
          logo_url: logoUrl, 
          favicon_url: faviconUrl,
          theme 
        });

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
      setOpen(false);
      // window.location.reload(); // Removed to prevent potential white screen issues
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const SUPERUSER_EMAIL = 'niopassinho@gmail.com';
  const isSuperUser = user?.email === SUPERUSER_EMAIL;

  if (!isSuperUser) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Configurações">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card" aria-describedby="settings-description">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Configurações</DialogTitle>
        </DialogHeader>
        <div id="settings-description" className="sr-only">
          <p>Configure o tema do sistema e personalize a logo e o favicon.</p>
        </div>
        <div className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tema</span>
            <Button variant="outline" size="sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {theme === 'light' ? 'Claro' : 'Escuro'}
            </Button>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Logo do Sistema</label>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'logo')} disabled={loading} />
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Favicon</label>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'favicon')} disabled={loading} />
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSettings} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar Configurações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
