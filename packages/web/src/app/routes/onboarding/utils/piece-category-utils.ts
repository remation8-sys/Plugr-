import { PieceCategory } from '@activepieces/shared';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';

export type OnboardingCategory =
  | 'All'
  | 'AI'
  | 'Payments'
  | 'Communication'
  | 'Productivity'
  | 'CRM'
  | 'African Tools';

export const CATEGORY_PILLS: OnboardingCategory[] = [
  'All',
  'AI',
  'Payments',
  'Communication',
  'Productivity',
  'CRM',
  'African Tools',
];

export const AFRICAN_TOOL_PIECE_NAMES: string[] = [
  '@activepieces/piece-paystack',
  '@activepieces/piece-flutterwave',
  '@activepieces/piece-termii',
];

export const POPULAR_PIECE_NAMES: string[] = [
  '@activepieces/piece-paystack',
  '@activepieces/piece-flutterwave',
  '@activepieces/piece-gmail',
  '@activepieces/piece-google-sheets',
  '@activepieces/piece-whatsapp',
  '@activepieces/piece-openai',
  '@activepieces/piece-notion',
  '@activepieces/piece-slack',
];

const CATEGORY_MAP: Record<OnboardingCategory, PieceCategory[]> = {
  All: [],
  AI: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.UNIVERSAL_AI],
  Payments: [
    PieceCategory.PAYMENT_PROCESSING,
    PieceCategory.COMMERCE,
    PieceCategory.ACCOUNTING,
  ],
  Communication: [PieceCategory.COMMUNICATION],
  Productivity: [
    PieceCategory.PRODUCTIVITY,
    PieceCategory.CONTENT_AND_FILES,
    PieceCategory.FORMS_AND_SURVEYS,
  ],
  CRM: [
    PieceCategory.SALES_AND_CRM,
    PieceCategory.CUSTOMER_SUPPORT,
    PieceCategory.MARKETING,
  ],
  'African Tools': [],
};

export function filterByCategory(
  pieces: PieceMetadataModelSummary[],
  category: OnboardingCategory,
): PieceMetadataModelSummary[] {
  if (category === 'All') return pieces;
  if (category === 'African Tools') {
    return pieces.filter((p) => AFRICAN_TOOL_PIECE_NAMES.includes(p.name));
  }
  const targetCategories = CATEGORY_MAP[category];
  return pieces.filter((p) =>
    p.categories?.some((c) => targetCategories.includes(c as PieceCategory)),
  );
}
