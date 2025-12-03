import { Download, X, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppUpdater } from '@/hooks/useAppUpdater';
import { detectPlatform } from '@/lib/platform';

export function UpdateNotification() {
  const platform = detectPlatform();
  const {
    updateAvailable,
    updateInfo,
    checking,
    installing,
    error,
    installUpdate,
    dismissUpdate,
  } = useAppUpdater();

  // Only show on desktop
  if (platform !== 'desktop') return null;

  // Don't show if no update available
  if (!updateAvailable && !error) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="deck-panel p-4 border border-primary/50 shadow-neon-cyan">
        {error ? (
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={dismissUpdate}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-display text-sm text-foreground">Update Available</h4>
                <p className="text-xs text-muted-foreground">
                  Version {updateInfo?.version} is ready to install
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={dismissUpdate}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {updateInfo?.body && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {updateInfo.body}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={installUpdate}
                disabled={installing}
              >
                {installing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Update Now
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={dismissUpdate}>
                Later
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
