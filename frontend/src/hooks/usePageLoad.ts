import { useEffect, useState } from 'react';

export function usePageLoad(delay: number = 100) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    // Wait for fonts and images to load
    const handleLoad = () => {
      setTimeout(() => {
        setShowOverlay(false);
        setTimeout(() => {
          setIsLoaded(true);
        }, 500);
      }, delay);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [delay]);

  return { isLoaded, showOverlay };
}
