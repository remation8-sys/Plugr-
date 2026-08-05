import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const division = createAction({
  audience: 'human',
  name: 'division_math',
  auth: PieceAuth.None(),
  displayName: 'Division',
  description: 'Divide first number by the second number',
  aiMetadata: { description: 'Compute the quotient of two numbers, returning first_number / second_number as a floating-point value rather than integer division. Pick this for a two-operand division such as an average, ratio, or unit price; use the sibling Modulo action when you need the remainder instead, or the other Math Helper siblings for the remaining operations. Critical constraint: second_number is validated and must not be zero, or the step fails before computing; read-only and idempotent.', idempotent: true },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    first_number: Property.Number({
      displayName: 'First Number',
      description: undefined,
      required: true,
    }),
    second_number: Property.Number({
      displayName: 'Second Number',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      second_number: z.number().refine(val => val !== 0, {
        message: "Second number cannot be zero"
      }),
    });
    return (
      context.propsValue['first_number'] / context.propsValue['second_number']
    );
  },
});
