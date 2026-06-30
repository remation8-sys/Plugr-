import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { gmailAuth, createGoogleClient } from '../auth';

export const gmailMoveToSpamAction = createAction({
  auth: gmailAuth,
  name: 'move_to_spam',
  displayName: 'Move Email to Spam',
  description: 'Moves an email to the spam folder by adding the SPAM label and removing it from the inbox.',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message to move to spam.',
      required: true,
    }),
  },
  async run(context) {
    const { messageId } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: ['SPAM'],
        removeLabelIds: ['INBOX'],
      },
    });

    return response.data;
  },
});
