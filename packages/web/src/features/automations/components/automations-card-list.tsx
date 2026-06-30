import {
  FolderDto,
  PopulatedFlow,
  Table,
  ProjectMemberWithUser,
} from '@activepieces/shared';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { t } from 'i18next';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Folder,
  MoreHorizontal,
  Pencil,
  Table2,
  Trash2,
  Workflow,
  ArrowDown,
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

function CardItemIcon({ item }: { item: TreeItem }) {
  switch (item.type) {
    case 'folder':
      return <Folder className="h-4 w-4 text-gray-400 fill-gray-400 shrink-0" />;
    case 'flow':
      return <Workflow className="h-4 w-4 text-primary shrink-0" />;
    default:
      return <Table2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  }
}

function SkeletonCard() {
  return (
    <div className="flex items-center px-4 py-3 border-b gap-3">
      <Skeleton className="h-4 w-4 rounded" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-10 rounded-full" />
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
            className="h-9 w-9 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onRename}>
            <Pencil className="h-4 w-4 mr-2" />
            {t('Rename')}
          </DropdownMenuItem>

          {isFlowItem(item) && (
            <DropdownMenuItem
              onClick={() => onDuplicate(item.data)}
              disabled={isDuplicating}
            >
              {isDuplicating ? (
                <LoadingSpinner className="mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {isDuplicating ? t('Duplicating...') : t('Duplicate')}
            </DropdownMenuItem>
          )}

          {(item.type === 'flow' || item.type === 'table') && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setIsMoveOpen(true);
              }}
            >
              <Folder className="h-4 w-4 mr-2" />
              {t('Move to')}
            </DropdownMenuItem>
          )}

          {isFlowItem(item) && (
            <DropdownMenuItem onClick={() => onExportFlow(item.data)}>
              <Download className="h-4 w-4 mr-2" />
              {t('Export')}
            </DropdownMenuItem>
          )}

          {isTableItem(item) && (
            <DropdownMenuItem onClick={() => onExportTable(item.data)}>
              <Download className="h-4 w-4 mr-2" />
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
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
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

function AutomationCard({
  item,
  folders,
  isMoving,
  isDuplicating,
  indent = false,
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
  indent?: boolean;
  onRowClick: (item: TreeItem) => void;
  onRenameItem: (item: TreeItem) => void;
  onDeleteItem: (item: TreeItem) => void;
  onDuplicateFlow: (flow: PopulatedFlow) => void;
  onMoveItem: (item: TreeItem, folderId: string) => void;
  onExportFlow: (flow: PopulatedFlow) => void;
  onExportTable: (table: Table) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 min-h-[56px] border-b cursor-pointer',
        'touch-manipulation active:bg-muted/60 transition-colors',
        indent && 'pl-8',
      )}
      onClick={() => onRowClick(item)}
    >
      <CardItemIcon item={item} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {isFlowItem(item) && (
            <PieceIconList
              trigger={item.data.version.trigger}
              maxNumberOfIconsToShow={3}
              size="xs"
            />
          )}
          {item.data && (item.type === 'flow' || item.type === 'table') && (
            <span className="text-xs text-muted-foreground">
              <FormattedDate date={new Date((item.data as any).updated)} />
            </span>
          )}
          {item.type === 'folder' && (
            <span className="text-xs text-muted-foreground">
              {item.childCount} {item.childCount === 1 ? t('file') : t('files')}
            </span>
          )}
        </div>
      </div>

      {isFlowItem(item) && (
        <div onClick={(e) => e.stopPropagation()}>
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
      <div>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <AccordionPrimitive.Root
        type="multiple"
        value={Array.from(expandedFolders)}
      >
        {groups.map((group) => {
          const isFolder = group.item.type === 'folder';

          if (isFolder) {
            return (
              <AccordionPrimitive.Item
                key={`folder-${group.item.id}`}
                value={group.item.id}
                className="border-b"
              >
                <div
                  className="flex items-center gap-3 px-4 min-h-[56px] cursor-pointer touch-manipulation active:bg-muted/60 transition-colors"
                  onClick={() => onRowClick(group.item)}
                >
                  {expandedFolders.has(group.item.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <Folder className="h-4 w-4 text-gray-400 fill-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{group.item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.item.childCount}{' '}
                      {group.item.childCount === 1 ? t('file') : t('files')}
                    </p>
                  </div>
                  <CardActionMenu
                    item={group.item}
                    folders={folders}
                    isMoving={isMoving}
                    isDuplicating={isDuplicating}
                    onRename={() => onRenameItem(group.item)}
                    onDelete={() => onDeleteItem(group.item)}
                    onDuplicate={onDuplicateFlow}
                    onMoveTo={onMoveItem}
                    onExportFlow={onExportFlow}
                    onExportTable={onExportTable}
                  />
                </div>

                <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  {group.children.map((child) => {
                    if (child.type === 'load-more-folder') {
                      return (
                        <div
                          key={`load-more-${child.id}`}
                          className="flex items-center justify-center gap-2 py-3 text-sm text-primary font-medium cursor-pointer touch-manipulation pl-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLoadMoreInFolder(child.folderId!);
                          }}
                        >
                          <ArrowDown className="h-4 w-4" />
                          {t('Load {count} more items...', {
                            count: child.loadMoreCount,
                          })}
                        </div>
                      );
                    }
                    return (
                      <AutomationCard
                        key={`${child.type}-${child.id}`}
                        item={child}
                        folders={folders}
                        isMoving={isMoving}
                        isDuplicating={isDuplicating}
                        indent
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
