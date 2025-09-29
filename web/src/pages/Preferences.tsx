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

                  <div className="flex items-center gap-4">
                    <Label htmlFor="queue-size">Download queue size:</Label>
                    <Input
                      id="queue-size"
                      value={queueSize}
                      onChange={(e) => setQueueSize(e.target.value)}
                      className="w-20 bg-input border-border"
                      type="number"
                    />
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
                      disabled={!stopRatioEnabled}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Checkbox
                      id="stop-idle"
                      checked={stopIdleEnabled}
                      onCheckedChange={(checked) => setStopIdleEnabled(!!checked)}
                    />
                    <Label htmlFor="stop-idle">Stop seeding if idle for N mins:</Label>
                    <Input
                      value={stopIdle}
                      onChange={(e) => setStopIdle(e.target.value)}
                      className="w-24 bg-input border-border"
                      type="number"
                      disabled={!stopIdleEnabled}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4">Magnet Protocol Handler</h3>
                <Button variant="outline" className="w-full bg-muted/50 border-border">
                  Add Browser Handler
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges()}
                className="border-border text-foreground hover:bg-accent/50 disabled:opacity-50"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges()}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
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
                      checked={uploadLimitEnabled}
                      onCheckedChange={(checked) => setUploadLimitEnabled(!!checked)}
                    />
                    <Label htmlFor="upload-limit">Upload (kB/s):</Label>
                    <Input
                      value={uploadLimit}
                      onChange={(e) => setUploadLimit(e.target.value)}
                      className="w-32 bg-input border-border"
                      disabled={!uploadLimitEnabled}
                      type="number"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Checkbox
                      id="download-limit"
                      checked={downloadLimitEnabled}
                      onCheckedChange={(checked) => setDownloadLimitEnabled(!!checked)}
                    />
                    <Label htmlFor="download-limit">Download (kB/s):</Label>
                    <Input
                      value={downloadLimit}
                      onChange={(e) => setDownloadLimit(e.target.value)}
                      className="w-32 bg-input border-border"
                      disabled={!downloadLimitEnabled}
                      type="number"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3>Alternative Speed Limits</h3>
                </div>
                <p className="caption text-muted-foreground mb-4">
                  Override normal speed limits manually or at scheduled times
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label className="w-32">Upload (kB/s):</Label>
                    <Input
                      value={altUploadLimit}
                      onChange={(e) => setAltUploadLimit(e.target.value)}
                      className="w-32 bg-input border-border"
                      type="number"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Label className="w-32">Download (kB/s):</Label>
                    <Input
                      value={altDownloadLimit}
                      onChange={(e) => setAltDownloadLimit(e.target.value)}
                      className="w-32 bg-input border-border"
                      type="number"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scheduled"
                      checked={scheduledEnabled}
                      onCheckedChange={(checked) => setScheduledEnabled(!!checked)}
                    />
                    <Label htmlFor="scheduled">Scheduled times</Label>
                  </div>

                  {scheduledEnabled && (
                    <div className="ml-6 space-y-3">
                      <div className="flex items-center gap-4">
                        <Label className="w-16">From:</Label>
                        <Select value={scheduleFrom} onValueChange={setScheduleFrom}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9:00">9:00</SelectItem>
                            <SelectItem value="10:00">10:00</SelectItem>
                            <SelectItem value="11:00">11:00</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-4">
                        <Label className="w-16">To:</Label>
                        <Select value={scheduleTo} onValueChange={setScheduleTo}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="17:00">17:00</SelectItem>
                            <SelectItem value="18:00">18:00</SelectItem>
                            <SelectItem value="19:00">19:00</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-4">
                        <Label className="w-16">On days:</Label>
                        <Select value={scheduleDays} onValueChange={setScheduleDays}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="everyday">Everyday</SelectItem>
                            <SelectItem value="weekdays">Weekdays</SelectItem>
                            <SelectItem value="weekends">Weekends</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges()}
                className="border-border text-foreground hover:bg-accent/50 disabled:opacity-50"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges()}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
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
                      value={maxPeersPerTorrent}
                      onChange={(e) => setMaxPeersPerTorrent(e.target.value)}
                      className="w-24 bg-input border-border"
                      type="number"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Label className="w-48">Max peers overall:</Label>
                    <Input
                      value={maxPeersOverall}
                      onChange={(e) => setMaxPeersOverall(e.target.value)}
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
                    <Select value={encryptionMode} onValueChange={setEncryptionMode}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prefer">Prefer encryption</SelectItem>
                        <SelectItem value="require">Require encryption</SelectItem>
                        <SelectItem value="tolerate">Tolerate encryption</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-pex"
                      checked={usePEX}
                      onCheckedChange={(checked) => setUsePEX(!!checked)}
                    />
                    <Label htmlFor="use-pex">Use PEX to find more peers</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-dht"
                      checked={useDHT}
                      onCheckedChange={(checked) => setUseDHT(!!checked)}
                    />
                    <Label htmlFor="use-dht">Use DHT to find more peers</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-lpd"
                      checked={useLPD}
                      onCheckedChange={(checked) => setUseLPD(!!checked)}
                    />
                    <Label htmlFor="use-lpd">Use LPD to find more peers</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4">Blocklist</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="blocklist-enabled"
                      checked={blocklistEnabled}
                      onCheckedChange={(checked) => setBlocklistEnabled(!!checked)}
                    />
                    <Label htmlFor="blocklist-enabled">Enable blocklist:</Label>
                  </div>

                  {blocklistEnabled && (
                    <div className="ml-6 space-y-3">
                      <Input
                        value={blocklistUrl}
                        onChange={(e) => setBlocklistUrl(e.target.value)}
                        className="bg-input border-border"
                        placeholder="Blocklist URL"
                      />
                      <div className="flex items-center justify-between">
                        <span className="caption text-muted-foreground">
                          Blocklist has 0 rules
                        </span>
                        <Button variant="outline" size="sm" className="border-border">
                          Update
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges()}
                className="border-border text-foreground hover:bg-accent/50 disabled:opacity-50"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges()}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="network" className="space-y-6 mt-0">
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">Listening Port</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label className="w-32">Port:</Label>
                    <Input
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className="w-24 bg-input border-border"
                      type="number"
                    />
                    <Button variant="outline" size="sm" className="border-border">
                      Test Port
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="random-port"
                      checked={randomPort}
                      onCheckedChange={(checked) => setRandomPort(!!checked)}
                    />
                    <Label htmlFor="random-port">Use random port on start</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="port-forwarding"
                      checked={portForwardingEnabled}
                      onCheckedChange={(checked) => setPortForwardingEnabled(!!checked)}
                    />
                    <Label htmlFor="port-forwarding">Enable port forwarding (UPnP)</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4">Bandwidth</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="priority-high-enabled"
                      checked={limitBandwidthPriority}
                      onCheckedChange={(checked) => setLimitBandwidthPriority(!!checked)}
                    />
                    <Label htmlFor="priority-high-enabled">Limit bandwidth priority when seeding</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges()}
                className="border-border text-foreground hover:bg-accent/50 disabled:opacity-50"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges()}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}