import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { Button } from '@/components/ui/button';

import { flowCanvasConsts } from '../utils/consts';

const showChevronNextToSelection = (targetDiv: HTMLElement) => {
  const container = document.createElement('div');
  targetDiv.appendChild(container);
  const root = createRoot(container);
  root.render(
    <Button
      variant="outline"
      size="icon"
      aria-label={t('Selection actions')}
      className="absolute -left-10 top-2.5 z-50 size-9 rounded-md bg-background/95 shadow-lg backdrop-blur transition-all duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/25 motion-reduce:transition-none"
      {...{
        [`data-${flowCanvasConsts.SELECTION_RECT_CHEVRON_ATTRIBUTE}`]: true,
      }}
      onClick={(e) => {
        const rightClickEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          clientX: e.clientX,
          clientY: e.clientY,
        });
        e.target.dispatchEvent(rightClickEvent);
      }}
    >
      <ChevronDown className="size-4" />
    </Button>,
  );
  return root;
};

export const useShowChevronNextToSelection = () => {
  useEffect(() => {
    let root: ReturnType<typeof createRoot> | null = null;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (
            node instanceof HTMLElement &&
            node.children.length > 0 &&
            node.children[0].classList.contains(
              flowCanvasConsts.NODE_SELECTION_RECT_CLASS_NAME,
            )
          ) {
            root = showChevronNextToSelection(node.children[0] as HTMLElement);
          }
        });
        mutation.removedNodes.forEach((node) => {
          if (
            node instanceof HTMLElement &&
            node.children.length > 0 &&
            node.children[0].classList.contains(
              flowCanvasConsts.NODE_SELECTION_RECT_CLASS_NAME,
            )
          ) {
            if (root) {
              root.unmount();
              root = null;
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (root) {
        root.unmount();
      }
    };
  }, []);
};
