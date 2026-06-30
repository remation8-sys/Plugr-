import {
  FolderDto,
  PopulatedFlow,
  Table,
  ProjectMemberWithUser,
} from '@activepieces/shared';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { t } from 'i18next';
import {
  ChevronRight,
  Copy,
  Download,
  Folder,
  MoreHorizontal,
  Pencil,
  Table2,
  Trash2,
  Workflow,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { FormattedDate } from '@/components/custom/formatted-date';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { MoveToFolderDialog } from '@/features/automations/components/move-to-folder-dialog';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { cn } from '@/lib/utils';

import { SelectedItemsMap, TreeItem } from '../lib/types';
import { groupTreeItemsByFolder } from '../lib/utils';

import { CreateInFolderKind } from './create-new-menu';

type AutomationsCardListProps = {
  items: TreeItem[];
  isLoading: boolean;
  selectedItems: SelectedItemsMap;
  expandedFolders: Set<string>;
  projectMembers: ProjectMemberWithUser[] | undefined;
  folders: FolderDto[];
  selectableCount: number;
  isPinned: (itemId: string) => boolean;
  onTogglePin: (itemId: string) => void;
  onToggleAllSelection: () => void;
  onToggleItemSelection: (item: TreeItem) => void;
  onRowClick: (item: TreeItem, ctrlKey?: boolean) => void;
  onRenameItem: (item: TreeItem) => void;
  onDeleteItem: (item: TreeItem) => void;
  onDuplicateFlow: (flow: PopulatedFlow) => void;
  onMoveItem: (item: TreeItem, folderId: string) => void;
  onExportFlow: (flow: PopulatedFlow) => void;
  onExportTable: (table: Table) => void;
  onCreateInFolder?: (folderId: string, kind: CreateInFolderKind) => void;
  userHasPermissionToWriteFlow?: boolean;
  userHasPermissionToWriteTable?: boolean;
  isCreatingFlow?: boolean;
  isCreatingTable?: boolean;
  isMoving: boolean;
  isDuplicating: boolean;
  onLoadMoreInFolder: (folderId: string) => void;
  isItemSelected: (item: TreeItem) => boolean;
};

function isFlowItem(
  item: TreeItem,
): item is Omit<TreeItem, 'data'> & { data: PopulatedFlow } {
  return item.type === 'flow';
}

function isTableItem(
  item: TreeItem,
): item is Omit<TreeItem, 'data'> & { data: Table } {
  return item.type === 'table';
}

function CardIcon({ item }: { item: TreeItem }) {
  const base =
    'w-11 h-11 rounded-xl flex items-center justify-center shrink-0';
  switch (item.type) {
    case 'folder':
      return (
        <div className={cn(base, 'bg-amber-400/15')}>
          <Folder className="h-5 w-5 text-amber-400 fill-amber-400/30" />
        </div>
      );
    case 'flow':
      return (
        <div className={cn(base, 'bg-primary/15')}>
          <Workflow className="h-5 w-5 text-primary" />
        </div>
      );
    default:
      return (
        <div className={cn(base, 'bg-emerald-400/15')}>
          <Table2 className="h-5 w-5 text-emerald-400" />
        </div>
      );
  }
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3">
      <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-[15px] w-36" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-6 w-11 rounded-full shrink-0" />
    </div>
  );
}

type CardActionMenuProps = {
  item: TreeItem;
  folders: FolderDto[];
  isMoving: boolean;
  isDuplicating: boolean;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate: (flow: PopulatedFlow) => void;
  onMoveTo: (item: TreeItem, folderId: string) => void;
  onExportFlow: (flow: PopulatedFlow) => void;
  onExportTable: (table: Table) => void;
};

function CardActionMenu({
  item,
  folders,
  isMoving,
  isDuplicating,
  onRename,
  onDelete,
  onDuplicate,
  onMoveTo,
  onExportFlow,
  onExportTable,
}: CardActionMenuProps) {
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [moveFolderId, setMoveFolderId] = useState('');

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem className="gap-3 py-2.5" onClick={onRename}>
            <Pencil className="h-4 w-4" />
            {t('Rename')}
          </DropdownMenuItem>

          {isFlowItem(item) && (
            <DropdownMenuItem
              className="gap-3 py-2.5"
              onClick={() => onDuplicate(item.data)}
              disabled={isDuplicating}
            >
              {isDuplicating ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {isDuplicating ? t('Duplicating...') : t('Duplicate')}
            </DropdownMenuItem>
          )}

          {(item.type === 'flow' || item.type === 'table') && (
            <DropdownMenuItem
              className="gap-3 py-2.5"
              onClick={(e) => {
                e.stopPropagation();
                setIsMoveOpen(true);
              }}
            >
              <Folder className="h-4 w-4" />
              {t('Move to folder')}
            </DropdownMenuItem>
          )}

          {isFlowItem(item) && (
            <DropdownMenuItem
              className="gap-3 py-2.5"
              onClick={() => onExportFlow(item.data)}
            >
              <Download className="h-4 w-4" />
              {t('Export')}
            </DropdownMenuItem>
          )}

          {isTableItem(item) && (
            <DropdownMenuItem
              className="gap-3 py-2.5"
              onClick={() => onExportTable(item.data)}
            >
              <Download className="h-4 w-4" />
              {t('Export')}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <ConfirmationDeleteDialog
            title={t('Delete {name}', { name: item.name })}
            message={t('Are you sure you want to delete this {type}?', {
              type: item.type,
            })}
            entityName={item.type}
            mutationFn={async () => onDelete()}
            buttonText={t('Delete')}
          >
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="gap-3 py-2.5 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {t('Delete')}
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <MoveToFolderDialog
        open={isMoveOpen}
        onOpenChange={setIsMoveOpen}
        folders={folders}
        selectedFolderId={moveFolderId}
        onFolderChange={setMoveFolderId}
        onConfirm={() => {
          onMoveTo(item, moveFolderId);
          setIsMoveOpen(false);
        }}
        isMoving={isMoving}
      />
    </>
  );
}

const cardClass =
  'group flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 ' +
  'touch-manipulation active:scale-[0.98] transition-transform duration-100 cursor-pointer';

function AutomationCard({
  item,
  folders,
  isMoving,
  isDuplicating,
  onRowClick,
  onRenameItem,
  onDeleteItem,
  onDuplicateFlow,
  onMoveItem,
  onExportFlow,
  onExportTable,
}: {
  item: TreeItem;
  folders: FolderDto[];
  isMoving: boolean;
  isDuplicating: boolean;
  onRowClick: (item: TreeItem) => void;
  onRenameItem: (item: TreeItem) => void;
  onDeleteItem: (item: TreeItem) => void;
  onDuplicateFlow: (flow: PopulatedFlow) => void;
  onMoveItem: (item: TreeItem, folderId: string) => void;
  onExportFlow: (flow: PopulatedFlow) => void;
  onExportTable: (table: Table) => void;
}) {
  return (
    <div className={cardClass} onClick={() => onRowClick(item)}>
      <CardIcon item={item} />

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground truncate leading-snug">
          {item.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {isFlowItem(item) && (
            <PieceIconList
              trigger={item.data.version.trigger}
              maxNumberOfIconsToShow={3}
              size="xs"
            />
          )}
          {item.data && (item.type === 'flow' || item.type === 'table') && (
            <span className="text-[12px] text-muted-foreground">
              <FormattedDate date={new Date((item.data as any).updated)} />
            </span>
          )}
        </div>
      </div>

      {isFlowItem(item) && (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <FlowStatusToggle flow={item.data} />
        </div>
      )}

      <CardActionMenu
        item={item}
        folders={folders}
        isMoving={isMoving}
        isDuplicating={isDuplicating}
        onRename={() => onRenameItem(item)}
        onDelete={() => onDeleteItem(item)}
        onDuplicate={onDuplicateFlow}
        onMoveTo={onMoveItem}
        onExportFlow={onExportFlow}
        onExportTable={onExportTable}
      />
    </div>
  );
}

function FolderCard({
  item,
  isExpanded,
  folders,
  isMoving,
  isDuplicating,
  onRowClick,
  onRenameItem,
  onDeleteItem,
  onDuplicateFlow,
  onMoveItem,
  onExportFlow,
  onExportTable,
}: {
  item: TreeItem;
  isExpanded: boolean;
  folders: FolderDto[];
  isMoving: boolean;
  isDuplicating: boolean;
  onRowClick: (item: TreeItem) => void;
  onRenameItem: (item: TreeItem) => void;
  onDeleteItem: (item: TreeItem) => void;
  onDuplicateFlow: (flow: PopulatedFlow) => void;
  onMoveItem: (item: TreeItem, folderId: string) => void;
  onExportFlow: (flow: PopulatedFlow) => void;
  onExportTable: (table: Table) => void;
}) {
  return (
    <div className={cardClass} onClick={() => onRowClick(item)}>
      <CardIcon item={item} />

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground truncate leading-snug">
          {item.name}
        </p>
        <p className="text-[12px] text-muted-foreground mt-1">
          {item.childCount === 1
            ? t('1 automation')
            : t('{count} automations', { count: item.childCount })}
        </p>
      </div>

      <ChevronRight
        className={cn(
          'h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200',
          isExpanded && 'rotate-90',
        )}
      />

      <CardActionMenu
        item={item}
        folders={folders}
        isMoving={isMoving}
        isDuplicating={isDuplicating}
        onRename={() => onRenameItem(item)}
        onDelete={() => onDeleteItem(item)}
        onDuplicate={onDuplicateFlow}
        onMoveTo={onMoveItem}
        onExportFlow={onExportFlow}
        onExportTable={onExportTable}
      />
    </div>
  );
}

export function AutomationsCardList({
  items,
  isLoading,
  expandedFolders,
  folders,
  isMoving,
  isDuplicating,
  onRowClick,
  onRenameItem,
  onDeleteItem,
  onDuplicateFlow,
  onMoveItem,
  onExportFlow,
  onExportTable,
  onLoadMoreInFolder,
}: AutomationsCardListProps) {
  const groups = groupTreeItemsByFolder(items);

  if (isLoading) {
    return (
      <div className="px-4 py-3 space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <AccordionPrimitive.Root
        type="multiple"
        value={Array.from(expandedFolders)}
        className="space-y-2.5"
      >
        {groups.map((group) => {
          const isFolder = group.item.type === 'folder';

          if (isFolder) {
            return (
              <AccordionPrimitive.Item
                key={`folder-${group.item.id}`}
                value={group.item.id}
              >
                <FolderCard
                  item={group.item}
                  isExpanded={expandedFolders.has(group.item.id)}
                  folders={folders}
                  isMoving={isMoving}
                  isDuplicating={isDuplicating}
                  onRowClick={onRowClick}
                  onRenameItem={onRenameItem}
                  onDeleteItem={onDeleteItem}
                  onDuplicateFlow={onDuplicateFlow}
                  onMoveItem={onMoveItem}
                  onExportFlow={onExportFlow}
                  onExportTable={onExportTable}
                />

                <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div className="ml-5 mt-2.5 space-y-2.5 border-l border-border pl-3">
                    {group.children.map((child) => {
                      if (child.type === 'load-more-folder') {
                        return (
                          <button
                            key={`load-more-${child.id}`}
                            className="w-full flex items-center justify-center gap-2 py-3 text-[13px] text-primary font-semibold touch-manipulation active:opacity-70 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadMoreInFolder(child.folderId!);
                            }}
                          >
                            <ChevronDown className="h-4 w-4" />
                            {t('Load {count} more', {
                              count: child.loadMoreCount,
                            })}
                          </button>
                        );
                      }
                      return (
                        <AutomationCard
                          key={`${child.type}-${child.id}`}
                          item={child}
                          folders={folders}
                          isMoving={isMoving}
                          isDuplicating={isDuplicating}
                          onRowClick={onRowClick}
                          onRenameItem={onRenameItem}
                          onDeleteItem={onDeleteItem}
                          onDuplicateFlow={onDuplicateFlow}
                          onMoveItem={onMoveItem}
                          onExportFlow={onExportFlow}
                          onExportTable={onExportTable}
                        />
                      );
                    })}
                  </div>
                </AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            );
          }

          return (
            <AutomationCard
              key={`${group.item.type}-${group.item.id}`}
              item={group.item}
              folders={folders}
              isMoving={isMoving}
              isDuplicating={isDuplicating}
              onRowClick={onRowClick}
              onRenameItem={onRenameItem}
              onDeleteItem={onDeleteItem}
              onDuplicateFlow={onDuplicateFlow}
              onMoveItem={onMoveItem}
              onExportFlow={onExportFlow}
              onExportTable={onExportTable}
            />
          );
        })}
      </AccordionPrimitive.Root>
    </div>
  );
}
