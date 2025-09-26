import { useState } from "react";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Checkbox } from "@shared/components/ui/checkbox";
import { Label } from "@shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Separator } from "@shared/components/ui/separator";
import { FolderOpen, Save, RotateCcw } from "lucide-react";

interface PreferencesPageProps {
  isMobile: boolean;
}

export function PreferencesPage({ isMobile }: PreferencesPageProps) {
  const [activeTab, setActiveTab] = useState('torrents');

  // Initial values for comparison
  const initialValues = {
    // Torrents
    downloadPath: '/downloads/complete',
    useIncompleteDir: true,
    incompletePath: '/downloads/incomplete',
    startWhenAdded: true,
    appendPart: true,
    queueSize: '5',
    stopRatio: '2.0',
    stopIdle: '30',
    stopRatioEnabled: true,
    stopIdleEnabled: false,

    // Speed
    uploadLimitEnabled: false,
    uploadLimit: '',
    downloadLimitEnabled: false,
    downloadLimit: '',
    altUploadLimit: '50',
    altDownloadLimit: '50',
    scheduledEnabled: false,
    scheduleFrom: '9:00',
    scheduleTo: '17:00',
    scheduleDays: 'everyday',

    // Peers
    maxPeersPerTorrent: '50',
    maxPeersOverall: '200',
    encryptionMode: 'prefer',
    usePEX: true,
    useDHT: true,
    useLPD: false,
    blocklistEnabled: false,
    blocklistUrl: 'http://www.example.com/blocklist',

    // Network
    port: '51413',
    randomPort: false,
    portForwardingEnabled: true,
    limitBandwidthPriority: false,
  };

  // Torrents settings
  const [downloadPath, setDownloadPath] = useState(initialValues.downloadPath);
  const [useIncompleteDir, setUseIncompleteDir] = useState(initialValues.useIncompleteDir);
  const [incompletePath, setIncompletePath] = useState(initialValues.incompletePath);
  const [startWhenAdded, setStartWhenAdded] = useState(initialValues.startWhenAdded);
  const [appendPart, setAppendPart] = useState(initialValues.appendPart);
  const [queueSize, setQueueSize] = useState(initialValues.queueSize);
  const [stopRatio, setStopRatio] = useState(initialValues.stopRatio);
  const [stopIdle, setStopIdle] = useState(initialValues.stopIdle);
  const [stopRatioEnabled, setStopRatioEnabled] = useState(initialValues.stopRatioEnabled);
  const [stopIdleEnabled, setStopIdleEnabled] = useState(initialValues.stopIdleEnabled);

  // Speed settings
  const [uploadLimitEnabled, setUploadLimitEnabled] = useState(initialValues.uploadLimitEnabled);
  const [uploadLimit, setUploadLimit] = useState(initialValues.uploadLimit);
  const [downloadLimitEnabled, setDownloadLimitEnabled] = useState(initialValues.downloadLimitEnabled);
  const [downloadLimit, setDownloadLimit] = useState(initialValues.downloadLimit);
  const [altUploadLimit, setAltUploadLimit] = useState(initialValues.altUploadLimit);
  const [altDownloadLimit, setAltDownloadLimit] = useState(initialValues.altDownloadLimit);
  const [scheduledEnabled, setScheduledEnabled] = useState(initialValues.scheduledEnabled);
  const [scheduleFrom, setScheduleFrom] = useState(initialValues.scheduleFrom);
  const [scheduleTo, setScheduleTo] = useState(initialValues.scheduleTo);
  const [scheduleDays, setScheduleDays] = useState(initialValues.scheduleDays);

  // Peers settings
  const [maxPeersPerTorrent, setMaxPeersPerTorrent] = useState(initialValues.maxPeersPerTorrent);
  const [maxPeersOverall, setMaxPeersOverall] = useState(initialValues.maxPeersOverall);
  const [encryptionMode, setEncryptionMode] = useState(initialValues.encryptionMode);
  const [usePEX, setUsePEX] = useState(initialValues.usePEX);
  const [useDHT, setUseDHT] = useState(initialValues.useDHT);
  const [useLPD, setUseLPD] = useState(initialValues.useLPD);
  const [blocklistEnabled, setBlocklistEnabled] = useState(initialValues.blocklistEnabled);
  const [blocklistUrl, setBlocklistUrl] = useState(initialValues.blocklistUrl);

  // Network settings
  const [port, setPort] = useState(initialValues.port);
  const [randomPort, setRandomPort] = useState(initialValues.randomPort);
  const [portForwardingEnabled, setPortForwardingEnabled] = useState(initialValues.portForwardingEnabled);
  const [limitBandwidthPriority, setLimitBandwidthPriority] = useState(initialValues.limitBandwidthPriority);

  // Check if current values differ from initial values
  const getCurrentValues = () => ({
    downloadPath, useIncompleteDir, incompletePath, startWhenAdded, appendPart, queueSize,
    stopRatio, stopIdle, stopRatioEnabled, stopIdleEnabled,
    uploadLimitEnabled, uploadLimit, downloadLimitEnabled, downloadLimit,
    altUploadLimit, altDownloadLimit, scheduledEnabled, scheduleFrom, scheduleTo, scheduleDays,
    maxPeersPerTorrent, maxPeersOverall, encryptionMode, usePEX, useDHT, useLPD,
    blocklistEnabled, blocklistUrl, port, randomPort, portForwardingEnabled, limitBandwidthPriority,
  });

  const hasChanges = () => {
    const current = getCurrentValues();
    return Object.keys(initialValues).some(key => 
      (current as Record<string, any>)[key] !== (initialValues as Record<string, any>)[key]
    );
  };

  const handleSave = () => {
    console.log('Saving preferences...');
    // Here you would save the preferences
    // After saving, you could update initialValues to current values
  };

  const handleReset = () => {
    console.log('Resetting preferences...');
    // Reset all values to initial values
    setDownloadPath(initialValues.downloadPath);
    setUseIncompleteDir(initialValues.useIncompleteDir);
    setIncompletePath(initialValues.incompletePath);
    setStartWhenAdded(initialValues.startWhenAdded);
    setAppendPart(initialValues.appendPart);
    setQueueSize(initialValues.queueSize);
    setStopRatio(initialValues.stopRatio);
    setStopIdle(initialValues.stopIdle);
    setStopRatioEnabled(initialValues.stopRatioEnabled);
    setStopIdleEnabled(initialValues.stopIdleEnabled);
    setUploadLimitEnabled(initialValues.uploadLimitEnabled);
    setUploadLimit(initialValues.uploadLimit);
    setDownloadLimitEnabled(initialValues.downloadLimitEnabled);
    setDownloadLimit(initialValues.downloadLimit);
    setAltUploadLimit(initialValues.altUploadLimit);
    setAltDownloadLimit(initialValues.altDownloadLimit);
    setScheduledEnabled(initialValues.scheduledEnabled);
    setScheduleFrom(initialValues.scheduleFrom);
    setScheduleTo(initialValues.scheduleTo);
    setScheduleDays(initialValues.scheduleDays);
    setMaxPeersPerTorrent(initialValues.maxPeersPerTorrent);
    setMaxPeersOverall(initialValues.maxPeersOverall);
    setEncryptionMode(initialValues.encryptionMode);
    setUsePEX(initialValues.usePEX);
    setUseDHT(initialValues.useDHT);
    setUseLPD(initialValues.useLPD);
    setBlocklistEnabled(initialValues.blocklistEnabled);
    setBlocklistUrl(initialValues.blocklistUrl);
    setPort(initialValues.port);
    setRandomPort(initialValues.randomPort);
    setPortForwardingEnabled(initialValues.portForwardingEnabled);
    setLimitBandwidthPriority(initialValues.limitBandwidthPriority);
  };

  return (
    <div className={`flex-1 flex flex-col ${isMobile ? 'overflow-auto' : 'h-full'}`}>
      {/* Header */}
      <div className={`p-4 border-b border-border ${isMobile ? '' : 'bg-card/50 backdrop-blur-sm'}`}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            {!isMobile && <h1>Preferences</h1>}
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
      <div className={`flex-1 p-6 ${isMobile ? 'pb-6' : 'overflow-auto'}`}>
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
                        value={downloadPath}
                        onChange={(e) => setDownloadPath(e.target.value)}
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
                      checked={useIncompleteDir}
                      onCheckedChange={(checked) => setUseIncompleteDir(!!checked)}
                    />
                    <Label htmlFor="use-incomplete">Use temporary folder:</Label>
                  </div>

                  {useIncompleteDir && (
                    <div className="flex gap-2 ml-6">
                      <Input
                        value={incompletePath}
                        onChange={(e) => setIncompletePath(e.target.value)}
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
                      checked={startWhenAdded}
                      onCheckedChange={(checked) => setStartWhenAdded(!!checked)}
                    />
                    <Label htmlFor="start-when-added">Start when added</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="append-part"
                      checked={appendPart}
                      onCheckedChange={(checked) => setAppendPart(!!checked)}
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
                      checked={stopRatioEnabled}
                      onCheckedChange={(checked) => setStopRatioEnabled(!!checked)}
                    />
                    <Label htmlFor="stop-ratio">Stop seeding at ratio:</Label>
                    <Input
                      value={stopRatio}
                      onChange={(e) => setStopRatio(e.target.value)}
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
  );
}