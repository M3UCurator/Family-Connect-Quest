import React, { useState, useMemo } from 'react';

interface ShareButtonProps {
  shareUrl: string;
  className?: string;
  children?: React.ReactNode;
  text?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ shareUrl, className, children, text }) => {
  const [copied, setCopied] = useState(false);
  const isShareSupported = useMemo(() => navigator.share !== undefined, []);

  const handleShare = async () => {
    const shareData = {
      title: 'Family Connect Quest',
      text: text || "Join our Family Connect Quest game!",
      url: shareUrl,
    };

    if (isShareSupported) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Silently fail if user cancels share.
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const defaultClassName = "w-full bg-brand-accent text-brand-dark text-lg font-bold py-3 rounded-lg hover:bg-opacity-90 transition transform hover:scale-105 shadow-md disabled:bg-yellow-200 disabled:cursor-not-allowed disabled:scale-100";
  
  const buttonText = isShareSupported 
    ? '🔗 Share Game Link' 
    : (copied ? '✅ Link Copied!' : '📋 Copy Game Link');

  return (
    <button onClick={handleShare} className={className ?? defaultClassName}>
      {children ?? buttonText}
    </button>
  );
};
