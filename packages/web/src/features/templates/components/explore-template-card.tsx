import { Template } from '@activepieces/shared';
import { t } from 'i18next';
import React from 'react';

import { LoadingSpinner } from '@/components/custom/spinner';
import { TagWithBright } from '@/components/custom/tag-with-bright';
import { Card, CardContent } from '@/components/ui/card';
import { PieceIconList } from '@/features/pieces';
import { useGradientFromPieces } from '@/features/templates';
import { cn } from '@/lib/utils';

type TemplateCardProps = {
  template: Template;
  onTemplateSelect: (template: Template) => void;
  isLoading?: boolean;
  compact?: boolean;
};

export const ExploreTemplateCard = React.memo(
  ({
    template,
    onTemplateSelect,
    isLoading = false,
    compact = false,
  }: TemplateCardProps) => {
    const displayTags = template.tags.slice(0, 2);
    const trigger = template.flows?.[0]?.trigger;
    const { gradient } = useGradientFromPieces(trigger);
    const compactPieces = compact ? template.pieces.slice(0, 4) : [];

    return (
      <Card
        aria-busy={isLoading}
        onClick={() => {
          if (!isLoading) {
            onTemplateSelect(template);
          }
        }}
        variant={'interactive'}
        className={cn(
          'relative h-[250px] w-full flex flex-col',
          isLoading && 'cursor-wait',
        )}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/65">
            <LoadingSpinner className="size-6" />
          </div>
        )}
        <CardContent className="py-5 px-4 flex flex-col gap-1 flex-1 min-h-0">
          <div className="h-12 flex flex-col justify-start flex-shrink-0">
            <h3 className="font-medium text-base leading-tight line-clamp-2">
              {template.name}
            </h3>
          </div>

          <p className="text-muted-foreground text-sm line-clamp-3 mt-1 flex-shrink-0">
            {template.summary ? (
              template.summary
            ) : (
              <span className="italic">{t('No summary')}</span>
            )}
          </p>

          <div className="h-8 flex gap-2 flex-wrap overflow-hidden mt-1 flex-shrink-0">
            {displayTags.length > 0 ? (
              displayTags
                .slice(0, 1)
                .map((tag, index) => (
                  <TagWithBright
                    key={index}
                    index={index}
                    prefix={t('Save')}
                    title={tag.title}
                    color={tag.color}
                    size="sm"
                  />
                ))
            ) : (
              <div />
            )}
          </div>
        </CardContent>

        <div
          className="h-16 flex items-center px-4 rounded-b-lg transition-all duration-300"
          style={{
            background:
              gradient ||
              (compact
                ? buildCompactTemplateGradient(template.pieces)
                : 'transparent'),
          }}
        >
          {trigger && (
            <PieceIconList
              trigger={trigger}
              maxNumberOfIconsToShow={4}
              size="md"
              className="flex gap-0.5"
              background="white"
              excludeCore={true}
            />
          )}
          {!trigger && compact && compactPieces.length > 0 && (
            <div className="flex items-center gap-1.5">
              {compactPieces.map((pieceName) => (
                <span
                  key={pieceName}
                  title={pieceName}
                  className="flex size-8 items-center justify-center rounded-lg border border-white/70 bg-white/85 text-[11px] font-semibold text-slate-700 shadow-sm"
                >
                  {getPieceInitials(pieceName)}
                </span>
              ))}
              {template.pieces.length > compactPieces.length && (
                <span className="text-xs font-semibold text-foreground/65">
                  +{template.pieces.length - compactPieces.length}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  },
);

ExploreTemplateCard.displayName = 'ExploreTemplateCard';

function buildCompactTemplateGradient(pieceNames: string[]): string {
  if (pieceNames.length === 0) {
    return 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 9%, transparent), color-mix(in srgb, var(--primary) 18%, transparent))';
  }
  const hue = pieceNames
    .join('|')
    .split('')
    .reduce((hash, character) => {
      return (hash * 31 + character.charCodeAt(0)) % 360;
    }, 0);
  return `linear-gradient(135deg, hsl(${hue} 78% 55% / 0.14), hsl(${
    (hue + 48) % 360
  } 72% 52% / 0.24))`;
}

function getPieceInitials(pieceName: string): string {
  const displayName =
    pieceName
      .split('/')
      .at(-1)
      ?.replace(/^piece-/, '') ?? '';
  return displayName
    .split('-')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}
