import { Download } from 'lucide-react';
import React from 'react';

import ImageWithFallback from '@/components/custom/image-with-fallback';

interface ImageMessageProps {
  content: string;
  setSelectedImage: (image: string | null) => void;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({
  content,
  setSelectedImage,
}) => {
  return (
    <div className="w-fit">
      <div className="relative group">
        <ImageWithFallback
          src={content}
          alt="Received image"
          className="w-80 h-auto rounded-md cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => setSelectedImage(content)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setSelectedImage(content);
            }
          }}
        />
        <button
          type="button"
          aria-label="Download image"
          onClick={(e) => {
            e.stopPropagation();
            const link = document.createElement('a');
            link.href = content;
            link.download = 'image';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100 max-md:opacity-100"
        >
          <Download className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
};
