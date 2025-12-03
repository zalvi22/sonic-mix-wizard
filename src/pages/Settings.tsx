import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Music, Key, Palette, Gauge, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSettings, AudioQuality, KeyNotation, ThemeAccent } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings } = useSettings();

  const handleReset = () => {
    resetSettings();
    toast({
      title: 'Settings Reset',
      description: 'All settings have been restored to defaults.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-display neon-text-cyan">Settings</h1>
          <div className="ml-auto">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset All
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Audio Settings */}
        <SettingsSection icon={Volume2} title="Audio Settings">
          <SettingRow label="Audio Quality" description="Higher quality uses more bandwidth">
            <Select
              value={settings.audioQuality}
              onValueChange={(v) => updateSettings({ audioQuality: v as AudioQuality })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (128kbps)</SelectItem>
                <SelectItem value="medium">Medium (256kbps)</SelectItem>
                <SelectItem value="high">High (320kbps)</SelectItem>
                <SelectItem value="lossless">Lossless (FLAC)</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label="Auto Gain Control" description="Normalize volume levels between tracks">
            <Switch
              checked={settings.autoGainControl}
              onCheckedChange={(v) => updateSettings({ autoGainControl: v })}
            />
          </SettingRow>

          <SettingRow label="Master Limiter" description="Prevent clipping and distortion">
            <Switch
              checked={settings.masterLimiter}
              onCheckedChange={(v) => updateSettings({ masterLimiter: v })}
            />
          </SettingRow>

          <SettingRow label="Crossfade Duration" description={`${settings.crossfadeDuration}s transition time`}>
            <div className="w-40">
              <Slider
                value={[settings.crossfadeDuration]}
                onValueChange={([v]) => updateSettings({ crossfadeDuration: v })}
                min={1}
                max={30}
                step={1}
              />
            </div>
          </SettingRow>
        </SettingsSection>

        {/* BPM Settings */}
        <SettingsSection icon={Music} title="BPM Settings">
          <SettingRow label="Default BPM" description={`${settings.defaultBpm} BPM for new sessions`}>
            <div className="w-40">
              <Slider
                value={[settings.defaultBpm]}
                onValueChange={([v]) => updateSettings({ defaultBpm: v })}
                min={60}
                max={200}
                step={1}
              />
            </div>
          </SettingRow>

          <SettingRow label="BPM Range" description={`${settings.bpmRange[0]} - ${settings.bpmRange[1]} BPM`}>
            <div className="w-40">
              <Slider
                value={settings.bpmRange}
                onValueChange={(v) => updateSettings({ bpmRange: v as [number, number] })}
                min={60}
                max={200}
                step={5}
              />
            </div>
          </SettingRow>

          <SettingRow label="Auto Sync" description="Automatically match BPM between decks">
            <Switch
              checked={settings.autoSyncEnabled}
              onCheckedChange={(v) => updateSettings({ autoSyncEnabled: v })}
            />
          </SettingRow>
        </SettingsSection>

        {/* Key Detection */}
        <SettingsSection icon={Key} title="Key Detection">
          <SettingRow label="Key Notation" description="How musical keys are displayed">
            <Select
              value={settings.keyNotation}
              onValueChange={(v) => updateSettings({ keyNotation: v as KeyNotation })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="camelot">Camelot (8A, 8B)</SelectItem>
                <SelectItem value="openkey">Open Key (1m, 1d)</SelectItem>
                <SelectItem value="standard">Standard (Am, C)</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label="Harmonic Mixing" description="Suggest compatible keys for mixing">
            <Switch
              checked={settings.harmonicMixing}
              onCheckedChange={(v) => updateSettings({ harmonicMixing: v })}
            />
          </SettingRow>

          <SettingRow label="Key Lock" description="Preserve pitch when changing tempo">
            <Switch
              checked={settings.keyLock}
              onCheckedChange={(v) => updateSettings({ keyLock: v })}
            />
          </SettingRow>
        </SettingsSection>

        {/* Theme */}
        <SettingsSection icon={Palette} title="Theme">
          <SettingRow label="Accent Color" description="Primary color for UI elements">
            <div className="flex gap-2">
              {(['cyan', 'magenta', 'purple', 'green', 'orange'] as ThemeAccent[]).map((color) => (
                <button
                  key={color}
                  onClick={() => updateSettings({ themeAccent: color })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    settings.themeAccent === color
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: `hsl(var(--neon-${color}))`,
                    boxShadow: settings.themeAccent === color
                      ? `0 0 15px hsl(var(--neon-${color}) / 0.7)`
                      : 'none',
                  }}
                />
              ))}
            </div>
          </SettingRow>

          <SettingRow label="Waveform Colors" description="Show frequency-based coloring">
            <Switch
              checked={settings.showWaveformColors}
              onCheckedChange={(v) => updateSettings({ showWaveformColors: v })}
            />
          </SettingRow>

          <SettingRow label="High Contrast" description="Increase visibility for accessibility">
            <Switch
              checked={settings.highContrastMode}
              onCheckedChange={(v) => updateSettings({ highContrastMode: v })}
            />
          </SettingRow>

          <SettingRow label="Animations" description="Enable UI animations and effects">
            <Switch
              checked={settings.animationsEnabled}
              onCheckedChange={(v) => updateSettings({ animationsEnabled: v })}
            />
          </SettingRow>
        </SettingsSection>

        {/* Performance */}
        <SettingsSection icon={Gauge} title="Performance">
          <SettingRow label="Waveform Resolution" description="Quality of waveform rendering">
            <Select
              value={settings.waveformResolution}
              onValueChange={(v) => updateSettings({ waveformResolution: v as 'low' | 'medium' | 'high' })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (faster)</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High (detailed)</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label="Preload Tracks" description="Load queued tracks in advance">
            <Switch
              checked={settings.preloadTracks}
              onCheckedChange={(v) => updateSettings({ preloadTracks: v })}
            />
          </SettingRow>
        </SettingsSection>
      </main>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="deck-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-display text-foreground">{title}</h2>
      </div>
      <Separator className="mb-4" />
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <Label className="text-foreground">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
