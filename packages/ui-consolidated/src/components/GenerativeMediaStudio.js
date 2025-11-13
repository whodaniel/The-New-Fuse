/**
 * Generative Media Studio Component
 *
 * Unified interface for image, video, and audio generation
 *
 * @module GenerativeMediaStudio
 * @since 2025-10-06
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Badge } from './Badge';
import { Slider } from './Slider';
import { Switch } from './Switch';
import { Label } from './Label';
import { ImageIcon, VideoIcon, MusicIcon, MicIcon, DownloadIcon, SettingsIcon, SparklesIcon, ClockIcon, DollarSignIcon } from 'lucide-react';
export const GenerativeMediaStudio = () => {
    const [providers, setProviders] = useState([]);
    const [selectedMediaType, setSelectedMediaType] = useState('image');
    const [selectedProvider, setSelectedProvider] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    // Advanced parameters
    const [parameters, setParameters] = useState({
        width: 1024,
        height: 1024,
        duration: 5,
        style: '',
        voice: '',
        genre: '',
        seed: Math.floor(Math.random() * 1000000),
        guidance: 7.5,
        steps: 20
    });
    const mediaTypeIcons = {
        image: ImageIcon,
        video: VideoIcon,
        music: MusicIcon,
        voice: MicIcon,
        audio: MusicIcon
    };
    const mediaTypes = [
        { id: 'image', name: 'Image', description: 'Generate images and artwork' },
        { id: 'video', name: 'Video', description: 'Create videos and animations' },
        { id: 'music', name: 'Music', description: 'Compose music and songs' },
        { id: 'voice', name: 'Voice', description: 'Synthesize speech and voices' },
        { id: 'audio', name: 'Audio', description: 'Generate sound effects' }
    ];
    useEffect(() => {
        fetchProviders();
    }, [selectedMediaType]);
    const fetchProviders = async () => {
        try {
            const response = await fetch(`/api/media/providers?mediaType=${selectedMediaType});
      const data = await response.json();
      if (data.success) {
        setProviders(data.providers);
        // Auto-select first available provider
        const availableProvider = data.providers.find((p: MediaProvider) => p.status === 'available');
        if (availableProvider) {
          setSelectedProvider(availableProvider.id);
          if (availableProvider.models.length > 0) {
            setSelectedModel(availableProvider.models[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const requestBody = {
        prompt,
        mediaType: selectedMediaType,
        providerId: selectedProvider || undefined,
        model: selectedModel || undefined,
        parameters: {
          ...parameters,
          ...(selectedMediaType === 'image' && {
            width: parameters.width,
            height: parameters.height
          }),
          ...(selectedMediaType === 'video' && {
            duration: parameters.duration
          }),
          ...(selectedMediaType === 'voice' && {
            voice: parameters.voice
          }),
          ...(selectedMediaType === 'music' && {
            genre: parameters.genre
          })
        },
        options: {
          timeout: 120000,
          retryOnFailure: true
        }
      };

      const endpoint = selectedProvider `
                ? `/api/media/generate/${selectedProvider}`
                : '/api/media/generate');
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            const result = await response.json();
            setResults(prev => [result, ...prev]);
        }
        catch (error) {
            console.error('Generation failed:', error);
        }
        finally {
            setIsGenerating(false);
        }
    };
    const getProvidersByMediaType = () => {
        return providers.filter(p => p.mediaTypes.includes(selectedMediaType));
    };
    const getSelectedProviderModels = () => {
        const provider = providers.find(p => p.id === selectedProvider);
        return provider?.models.filter(m => m.mediaType === selectedMediaType) || [];
    };
    const renderMediaOutput = (output, mediaType) => {
        switch (mediaType) {
            case 'image':
                return (<div className="relative group">
            <img src={output.url} alt="Generated image" className="w-full h-auto rounded-lg shadow-lg"/>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
              <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => window.open(output.url, '_blank')}>
                <DownloadIcon className="w-4 h-4 mr-2"/>
                Download
              </Button>
            </div>
          </div>);
            case 'video':
                return (<div className="relative">
            <video src={output.url} controls className="w-full h-auto rounded-lg shadow-lg" poster={output.thumbnail}/>
            <Badge className="absolute top-2 right-2">
              {output.duration}s
            </Badge>
          </div>);
            case 'music':
            case 'voice':
            case 'audio':
                return (<div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MusicIcon className="w-6 h-6 mr-2"/>
                <span className="font-medium">Generated Audio</span>
              </div>
              <Badge variant="secondary">
                {output.duration}s
              </Badge>
            </div>
            <audio src={output.url} controls className="w-full"/>
          </div>);
            default:
                return (<div className="p-4 border rounded-lg">
            <a href={output.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              Download {output.format.toUpperCase()}
            </a>
          </div>);
        }
    };
    return (<div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Generative Media Studio
        </h1>
        <p className="text-gray-600 text-lg">
          Create images, videos, music, and voice with AI - All in one place
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2"/>
                Create New Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Media Type Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Media Type</Label>
                <div className="grid grid-cols-5 gap-2">
                  {mediaTypes.map((type) => {
            const Icon = mediaTypeIcons[type.id];
            return (<Button key={type.id} variant={selectedMediaType === type.id ? "default" : "outline"} className="flex flex-col items-center p-3 h-auto" onClick={() => setSelectedMediaType(type.id)}>
                        <Icon className="w-5 h-5 mb-1"/>
                        <span className="text-xs">{type.name}</span>
                      </Button>);
        })}
                </div>
              </div>

              {/* Prompt Input */}
              <div>
                <Label htmlFor="prompt" className="text-sm font-medium mb-2 block">
                  Prompt
                </Label>
                <Textarea id="prompt" placeholder= Describe the $ {...selectedMediaType} you want to create/>...}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Provider and Model Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-select best"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Auto-select best</SelectItem>
                      {getProvidersByMediaType().map((provider) => (<SelectItem key={provider.id} value={provider.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{provider.displayName}</span>
                            <Badge variant={provider.status === 'available' ? 'default' : 'secondary'} className="ml-2">
                              {provider.status}
                            </Badge>
                          </div>
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Default model"/>
                    </SelectTrigger>
                    <SelectContent>
                      {getSelectedProviderModels().map((model) => (<SelectItem key={model.id} value={model.id}>
                          <div className="flex flex-col">
                            <span>{model.name}</span>
                            <span className="text-xs text-gray-500">`
                              ${model.pricing.cost}` per {model.pricing.unit}
                            </span>
                          </div>
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Parameters */}
              <div className="flex items-center space-x-2">
                <Switch id="advanced" checked={showAdvanced} onCheckedChange={setShowAdvanced}/>
                <Label htmlFor="advanced" className="text-sm">
                  Show advanced parameters
                </Label>
              </div>

              {showAdvanced && (<Card className="p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedMediaType === 'image' && (<>
                        <div>
                          <Label className="text-sm">Width: {parameters.width}px</Label>
                          <Slider value={[parameters.width]} onValueChange={([value]) => setParameters(prev => ({ ...prev, width: value }))} min={256} max={2048} step={64}/>
                        </div>
                        <div>
                          <Label className="text-sm">Height: {parameters.height}px</Label>
                          <Slider value={[parameters.height]} onValueChange={([value]) => setParameters(prev => ({ ...prev, height: value }))} min={256} max={2048} step={64}/>
                        </div>
                      </>)}

                    {selectedMediaType === 'video' && (<div>
                        <Label className="text-sm">Duration: {parameters.duration}s</Label>
                        <Slider value={[parameters.duration]} onValueChange={([value]) => setParameters(prev => ({ ...prev, duration: value }))} min={1} max={60} step={1}/>
                      </div>)}

                    <div>
                      <Label className="text-sm">Seed</Label>
                      <Input type="number" value={parameters.seed} onChange={(e) => setParameters(prev => ({ ...prev, seed: parseInt(e.target.value) || 0 }))}/>
                    </div>
                  </div>
                </Card>)}

              {/* Generate Button */}
              <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating} className="w-full" size="lg">
                {isGenerating ? (<>
                    <ClockIcon className="w-4 h-4 mr-2 animate-spin"/>
                    Generating...
                  </>) : (<>
                    <SparklesIcon className="w-4 h-4 mr-2"/>
                    Generate {selectedMediaType}
                  </>)}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Provider Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="w-5 h-5 mr-2"/>
                Available Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getProvidersByMediaType().map((provider) => (<div key={provider.id} className={p - 3} border rounded-lg cursor-pointer transition-colors $ {...selectedProvider === provider.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}/>))}
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{provider.name}</span>
                      <Badge variant={provider.status === 'available' ? 'default' : 'secondary'}>
                        {provider.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{provider.metadata.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.metadata.tags.map((tag) => (<Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>) /* Results Section */;
    { /* Results Section */ }
    {
        results.length > 0 && (<Card>
          <CardHeader>
            <CardTitle>Generated Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result, index) => (<div key={index} className="space-y-3">
                  {result.success ? (<>
                      {result.outputs.map((output, outputIndex) => (<div key={outputIndex}>
                          {renderMediaOutput(output, result.mediaType)}
                        </div>))}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{result.providerId} • {result.model}</span>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-3 h-3"/>
                          <span>{(result.metadata.generationTime / 1000).toFixed(1)}s</span>
                          {result.metadata.cost && (`
                            <>`
                        < DollarSignIcon)} className="w-3 h-3" />
                              <span>${result.metadata.cost.toFixed(3)}`</span>
                            </>
                          )}
                        </div>
                      </>) : }div>
                    </>))} : (
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <p className="text-red-600 text-sm">
                        Generation failed: {result.metadata.error}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>);
    }
};
Card >
;
div >
;
;
;
export default GenerativeMediaStudio;
//# sourceMappingURL=GenerativeMediaStudio.js.map