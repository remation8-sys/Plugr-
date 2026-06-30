import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { gmailAuth, createGoogleClient } from '../auth';

export const gmailModifyEmailLabelsAction = createAction({
  auth: gmailAuth,
  name: 'modify_email_labels',
  displayName: 'Modify Email Labels',
  description: 'Add or remove labels on an email (e.g. mark as read, move to spam, archive, star).',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message to modify.',
      required: true,
    }),
    addLabels: Property.Array({
      displayName: 'Add Labels',
      description: 'Labels to add. Use standard labels like SPAM, STARRED, IMPORTANT, UNREAD, or custom label IDs.',
      required: false,
    }),
    removeLabels: Property.Array({
      displayName: 'Remove Labels',
      description: 'Labels to remove. Use standard labels like INBOX, UNREAD, STARRED, or custom label IDs.',
      required: false,
    }),
  },
  async run(context) {
    const { messageId, addLabels, removeLabels } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: (addLabels as string[]) ?? [],
        removeLabelIds: (removeLabels as string[]) ?? [],
      },
    });

    return response.data;
  },
});
