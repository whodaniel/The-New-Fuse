import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Newspaper, RefreshCw, Link, Tag, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  date: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  keywords?: string[];
}

interface AINewsAgentDetailsProps {
  data: {
    id: string;
    name: string;
    sources: string[];
    keywords: string[];
    updateFrequency: number;
    lastUpdated: string | null;
    status: 'idle' | 'busy' | 'error';
    newsItems: NewsItem[];
    maxItems: number;
  };
  onRefresh?: () => void;
}

export const AINewsAgentDetailsView: React.FC<AINewsAgentDetailsProps> = ({ 
  data,
  onRefresh
}) => {
  const formatSentiment = (sentiment?: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Positive</Badge>;
      case 'negative':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Negative</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Neutral</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-blue-500" />
            {data.name}
          </CardTitle>
          <CardDescription>
            AI News Agent - Last updated {data.lastUpdated ? formatDistanceToNow(new Date(data.lastUpdated), { addSuffix: true }) : 'never'}
          </CardDescription>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onRefresh} 
          disabled={data.status === 'busy'}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${data.status === 'busy' ? 'animate-spin text-blue-500' : ''}`} />
          {data.status === 'busy' ? 'Updating...' : 'Refresh'}
        </Button>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="news">
          <TabsList className="mb-4">
            <TabsTrigger value="news">Latest News</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="news" className="space-y-4">
            {data.newsItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Newspaper className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No news items collected yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={onRefresh}
                  disabled={data.status === 'busy'}
                >
                  {data.status === 'busy' ? 'Updating...' : 'Collect News Now'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.newsItems.map(item => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{item.title}</h3>
                        {formatSentiment(item.sentiment)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <span>{item.source}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{item.summary}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {item.keywords?.map(keyword => (
                          <Badge key={keyword} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex justify-end">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Link className="h-3 w-3" />
                          Read More
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="config">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Link className="h-4 w-4 text-blue-500" />
                  News Sources
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.sources.map(source => (
                    <Badge key={source} variant="secondary">
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-500" />
                  Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.keywords.map(keyword => (
                    <Badge key={keyword} variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Update Frequency
                </h3>
                <p className="text-sm">Every {data.updateFrequency} hours</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Maximum Items</h3>
                <p className="text-sm">Storing up to {data.maxItems} news items</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};