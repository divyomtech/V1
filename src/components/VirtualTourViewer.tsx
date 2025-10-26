import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface VirtualTourViewerProps {
  tourUrl: string;
}

export const VirtualTourViewer = ({ tourUrl }: VirtualTourViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if it's a YouTube or other video embed
  const isVideoEmbed = tourUrl.includes('youtube.com') || tourUrl.includes('youtu.be') || tourUrl.includes('vimeo.com');

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(tourUrl);

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
                allowFullScreen
                title="Virtual Tour"
              />
            </div>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <h3 className="font-semibold">360° Virtual Tour</h3>
            <p className="text-sm text-muted-foreground">
              Take a virtual walk through the property
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
            allowFullScreen
            title="Virtual Tour Fullscreen"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
