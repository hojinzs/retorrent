import { useState, useEffect } from "react";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Checkbox } from "@shared/components/ui/checkbox";
import { Label } from "@shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Separator } from "@shared/components/ui/separator";
import { FolderOpen, Save, RotateCcw, Loader2 } from "lucide-react";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { usePreferences, useUpdatePreferences, type SessionSettings } from "@shared/api/preferences";

export default function Preferences() {
  const [activeTab, setActiveTab] = useState('torrents');
  const isMobile = useIsMobile();

  // API hooks
  const { data: preferencesData, isLoading, error, refetch } = usePreferences();
  const updatePreferencesMutation = useUpdatePreferences();

  // Local state for form values
  const [formData, setFormData] = useState<Partial<SessionSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Update form data when API data loads
  useEffect(() => {
    if (preferencesData?.data) {
      setFormData(preferencesData.data);
      setHasChanges(false);
    }
  }, [preferencesData]);

  // Helper to update form data and track changes
  const updateFormValue = (key: keyof SessionSettings, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    try {
      await updatePreferencesMutation.mutateAsync(formData);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  // Reset to original values
  const handleReset = () => {
    if (preferencesData?.data) {
      setFormData(preferencesData.data);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading preferences...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load preferences</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${isMobile ? 'overflow-auto' : 'h-full'}`}>
      {/* Header */}
      <div className={`${isMobile ? 'p-4' : 'p-8'} border-b border-border`}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1>Preferences</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className={isMobile ? 'flex-1' : 'flex-shrink-0'}>
            <TabsList className={`${isMobile ? 'grid w-full grid-cols-4 h-12' : 'flex w-auto h-10'}`}>
              <TabsTrigger value="torrents" className={isMobile ? 'py-3 px-2' : 'px-4'}>
                Torrents
              </TabsTrigger>
              <TabsTrigger value="speed" className={isMobile ? 'py-3 px-2' : 'px-4'}>
                Speed
              </TabsTrigger>
              <TabsTrigger value="peers" className={isMobile ? 'py-3 px-2' : 'px-4'}>
                Peers
              </TabsTrigger>
              <TabsTrigger value="network" className={isMobile ? 'py-3 px-2' : 'px-4'}>
                Network
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'} ${isMobile ? 'pb-6' : 'overflow-auto'}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="torrents" className="space-y-6 mt-0">
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">Downloading</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Download to:</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData['download-dir'] || ''}
                        onChange={(e) => updateFormValue('download-dir', e.target.value)}
                        className="flex-1 bg-input border-border"
                      />
                      <Button variant="outline" size="sm" className="shrink-0 border-border">
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-incomplete"
                      checked={!!formData['incomplete-dir-enabled']}
                      onCheckedChange={(checked) => updateFormValue('incomplete-dir-enabled', !!checked)}
                    />
                    <Label htmlFor="use-incomplete">Use temporary folder:</Label>
                  </div>

                  {formData['incomplete-dir-enabled'] && (
                    <div className="flex gap-2 ml-6">
                      <Input
                        value={formData['incomplete-dir'] || ''}
                        onChange={(e) => updateFormValue('incomplete-dir', e.target.value)}
                        className="flex-1 bg-input border-border"
                      />
                      <Button variant="outline" size="sm" className="shrink-0 border-border">
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="start-when-added"
                      checked={!!formData['start-added-torrents']}
                      onCheckedChange={(checked) => updateFormValue('start-added-torrents', !!checked)}
                    />
                    <Label htmlFor="start-when-added">Start when added</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="append-part"
                      checked={!!formData['rename-partial-files']}
                      onCheckedChange={(checked) => updateFormValue('rename-partial-files', !!checked)}
                    />
                    <Label htmlFor="append-part">Append ".part" to incomplete files' names</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4">Seeding</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      id="stop-ratio"
                      checked={!!formData.seedRatioLimited}
                      onCheckedChange={(checked) => updateFormValue('seedRatioLimited', !!checked)}
                    />
                    <Label htmlFor="stop-ratio">Stop seeding at ratio:</Label>
                    <Input
                      value={formData.seedRatioLimit?.toString() || ''}
                      onChange={(e) => updateFormValue('seedRatioLimit', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-input border-border"
                      type="number"
                      step="0.1"
                      disabled={!formData.seedRatioLimited}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Checkbox
                      id="stop-idle"
                      checked={!!formData['idle-seeding-limit-enabled']}
                      onCheckedChange={(checked) => updateFormValue('idle-seeding-limit-enabled', !!checked)}
                    />
                    <Label htmlFor="stop-idle">Stop seeding if idle for (minutes):</Label>
                    <Input
                      value={formData['idle-seeding-limit']?.toString() || ''}
                      onChange={(e) => updateFormValue('idle-seeding-limit', parseInt(e.target.value) || 0)}
                      className="w-24 bg-input border-border"
                      type="number"
                      disabled={!formData['idle-seeding-limit-enabled']}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
                className="border-border text-foreground hover:bg-accent/50 disabled:opacity-50"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || updatePreferencesMutation.isPending}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="speed" className="space-y-6 mt-0">
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">Speed Limits</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      id="upload-limit"
                      checked={!!formData['speed-limit-up-enabled']}
                      onCheckedChange={(checked) => updateFormValue('speed-limit-up-enabled', !!checked)}
                    />
                    <Label htmlFor="upload-limit">Upload (kB/s):</Label>
                    <Input
                      value={formData['speed-limit-up']?.toString() || ''}
                      onChange={(e) => updateFormValue('speed-limit-up', parseInt(e.target.value) || 0)}
                      className="w-32 bg-input border-border"
                      disabled={!formData['speed-limit-up-enabled']}
                      type="number"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Checkbox
                      id="download-limit"
                      checked={!!formData['speed-limit-down-enabled']}
                      onCheckedChange={(checked) => updateFormValue('speed-limit-down-enabled', !!checked)}
                    />
                    <Label htmlFor="download-limit">Download (kB/s):</Label>
                    <Input
                      value={formData['speed-limit-down']?.toString() || ''}
                      onChange={(e) => updateFormValue('speed-limit-down', parseInt(e.target.value) || 0)}
                      className="w-32 bg-input border-border"
                      disabled={!formData['speed-limit-down-enabled']}
                      type="number"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4">Alternative Speed Limits</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label>Upload (kB/s):</Label>
                    <Input
                      value={formData['alt-speed-up']?.toString() || ''}
                      onChange={(e) => updateFormValue('alt-speed-up', parseInt(e.target.value) || 0)}
                      className="w-32 bg-input border-border"
                      type="number"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Label>Download (kB/s):</Label>
                    <Input
                      value={formData['alt-speed-down']?.toString() || ''}
                      onChange={(e) => updateFormValue('alt-speed-down', parseInt(e.target.value) || 0)}
                      className="w-32 bg-input border-border"
                      type="number"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
                className="border-border text-foreground hover:bg-accent/50 disabled:opacity-50"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || updatePreferencesMutation.isPending}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="peers" className="space-y-6 mt-0">
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">Connections</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label className="w-48">Max peers per torrent:</Label>
                    <Input
                      value={formData['peer-limit-per-torrent']?.toString() || ''}
                      onChange={(e) => updateFormValue('peer-limit-per-torrent', parseInt(e.target.value) || 0)}
                      className="w-24 bg-input border-border"
                      type="number"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Label className="w-48">Max peers overall:</Label>
                    <Input
                      value={formData['peer-limit-global']?.toString() || ''}
                      onChange={(e) => updateFormValue('peer-limit-global', parseInt(e.target.value) || 0)}
                      className="w-24 bg-input border-border"
                      type="number"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4">Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label className="w-48">Encryption mode:</Label>
                    <Select 
                      value={formData.encryption || 'prefer'} 
                      onValueChange={(value) => updateFormValue('encryption', value)}
                    >
                      <SelectTrigger className="w-40 bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="required">Required</SelectItem>
                        <SelectItem value="prefer">Prefer</SelectItem>
                        <SelectItem value="tolerated">Tolerated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enable-pex"
                      checked={!!formData['pex-enabled']}
                      onCheckedChange={(checked) => updateFormValue('pex-enabled', !!checked)}
                    />
                    <Label htmlFor="enable-pex">Enable PEX</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enable-dht"
                      checked={!!formData['dht-enabled']}
                      onCheckedChange={(checked) => updateFormValue('dht-enabled', !!checked)}
                    />
                    <Label htmlFor="enable-dht">Enable DHT</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enable-lpd"
                      checked={!!formData['lpd-enabled']}
                      onCheckedChange={(checked) => updateFormValue('lpd-enabled', !!checked)}
                    />
                    <Label htmlFor="enable-lpd">Enable LPD</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
                className="border-border text-foreground hover:bg-accent/50 disabled:opacity-50"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || updatePreferencesMutation.isPending}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="network" className="space-y-6 mt-0">
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">Listening Port</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label>Port for incoming connections:</Label>
                    <Input
                      value={formData['peer-port']?.toString() || ''}
                      onChange={(e) => updateFormValue('peer-port', parseInt(e.target.value) || 0)}
                      className="w-24 bg-input border-border"
                      type="number"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="random-port"
                      checked={!!formData['peer-port-random-on-start']}
                      onCheckedChange={(checked) => updateFormValue('peer-port-random-on-start', !!checked)}
                    />
                    <Label htmlFor="random-port">Randomize port on launch</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="port-forwarding"
                      checked={!!formData['port-forwarding-enabled']}
                      onCheckedChange={(checked) => updateFormValue('port-forwarding-enabled', !!checked)}
                    />
                    <Label htmlFor="port-forwarding">Use port forwarding from my router</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
                className="border-border text-foreground hover:bg-accent/50 disabled:opacity-50"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || updatePreferencesMutation.isPending}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}