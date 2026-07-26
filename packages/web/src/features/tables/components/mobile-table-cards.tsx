import { ApFlagId, FieldType } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { KeyboardEvent, ReactNode, useRef, useState } from 'react';

import {
  ClientField,
  ClientRecordData,
} from '../stores/store/ap-tables-client-state';

import { useTableState } from './ap-table-state-provider';
import { CellProvider } from './cell-context';
import { DateEditor } from './date-editor';
import { DropdownEditor } from './dropdown-editor';
import { NewFieldPopup } from './new-field-popup';
import { NumberEditor } from './number-editor';
import { TextEditor } from './text-editor';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { flagsHooks } from '@/hooks/flags-hooks';

type MobileTableCardsProps = {
  canEdit: boolean;
  canCreateRecord: boolean;
  onCreateRecord: () => void;
};

type MobileEditableFieldProps = {
  disabled: boolean;
  field: ClientField;
  fieldIndex: number;
  record: ClientRecordData;
  recordIndex: number;
};

function MobileTableCards({
  canEdit,
  canCreateRecord,
  onCreateRecord,
}: MobileTableCardsProps) {
  const [fields, records, selectedRecords, setSelectedRecords] = useTableState(
    (state) => [
      state.fields,
      state.records,
      state.selectedRecords,
      state.setSelectedRecords,
    ],
  );
  const { data: maxFields } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_FIELDS_PER_TABLE,
  );
  const canCreateField =
    canEdit && Boolean(maxFields && fields.length < maxFields);

  const toggleRecord = (recordId: string) => {
    const nextSelection = new Set(selectedRecords);
    if (nextSelection.has(recordId)) {
      nextSelection.delete(recordId);
    } else {
      nextSelection.add(recordId);
    }
    setSelectedRecords(nextSelection);
  };

  return (
    <div className="space-y-4 p-4 md:hidden">
      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t('No records yet')}
        </div>
      ) : (
        records.map((record, recordIndex) => (
          <section key={record.uuid} className="rounded-lg border p-4">
            <div className="mb-4 flex min-h-11 items-center justify-between gap-3 border-b pb-3">
              <div className="flex min-w-0 items-center gap-3">
                <Checkbox
                  aria-label={t('Select record {number}', {
                    number: recordIndex + 1,
                  })}
                  checked={selectedRecords.has(record.uuid)}
                  onCheckedChange={() => toggleRecord(record.uuid)}
                />
                <h2 className="truncate text-sm font-semibold">
                  {t('Record {number}', { number: recordIndex + 1 })}
                </h2>
              </div>
              {record.agentRunId !== null && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t('Locked')}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {fields.map((field, fieldIndex) => (
                <MobileEditableField
                  key={field.uuid}
                  disabled={!canEdit || record.agentRunId !== null}
                  field={field}
                  fieldIndex={fieldIndex}
                  record={record}
                  recordIndex={recordIndex}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <div className="flex flex-col gap-3">
        {canCreateRecord && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full gap-2"
            onClick={onCreateRecord}
          >
            <Plus className="size-4" />
            {t('Add record')}
          </Button>
        )}
        {canCreateField && (
          <NewFieldPopup>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full gap-2"
            >
              <Plus className="size-4" />
              {t('Add field')}
            </Button>
          </NewFieldPopup>
        )}
      </div>
    </div>
  );
}

function MobileEditableField({
  disabled,
  field,
  fieldIndex,
  record,
  recordIndex,
}: MobileEditableFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const storedValue = record.values.find(
    (entry) => entry.fieldIndex === fieldIndex,
  )?.value;
  const value = storedValue == null ? '' : String(storedValue);

  const startEditing = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      startEditing();
    }
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{field.name}</p>
      <div
        ref={containerRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className="min-h-11 w-full overflow-hidden rounded-md border bg-background p-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        onClick={startEditing}
        onKeyDown={handleKeyDown}
      >
        <CellProvider
          rowIdx={recordIndex}
          columnIdx={fieldIndex}
          fieldType={field.type}
          value={value}
          containerRef={containerRef}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          disabled={disabled}
          handleCellChange={() => {}}
        >
          {getEditor(field.type)}
        </CellProvider>
      </div>
    </div>
  );
}

function getEditor(fieldType: FieldType): ReactNode {
  switch (fieldType) {
    case FieldType.DATE:
      return <DateEditor />;
    case FieldType.NUMBER:
      return <NumberEditor />;
    case FieldType.STATIC_DROPDOWN:
      return <DropdownEditor />;
    default:
      return <TextEditor />;
  }
}

export { MobileTableCards };
