import { GraphQLClient, gql } from 'graphql-request';
import { Logger } from '@mondaycom/apps-sdk';
import { mondayApiToken } from './config';

const logger = new Logger('mondayClient');

// Column IDs must match the monday.com board configuration.
// If columns are renamed in the board, update these constants.
// FIX: This is a wrong mental model; If we're installing the board WITH the app, then these are generated on demand. We can't do a new deploy per installation
export const COLUMN_IDS = {
    EMAIL: 'email',
    PHONE: 'phone',
    FIRST_NAME: 'text',
    LAST_NAME: 'text6',
    SHIPPING_ADDRESS: 'text_mm0wrxwk',
    ORDER_RECEIVED_DATE: 'date_1',
    INSCRIPTION: 'long_text_mm0qycr9',
    FRAGRANCES: 'dropdown_mm0qkhzm',
    SUBITEM_STATUS: 'color_mm0qcgc2',
    PARENT_STATUS: 'status',
    ORDER_COMPLETE_DATE: 'date_13',
} as const;

function getClient(): GraphQLClient {
    return new GraphQLClient('https://api.monday.com/v2', {
        headers: {
            Authorization: mondayApiToken,
            'API-Version': '2023-10',
        },
    });
}

export async function createItem(params: {
    boardId: number;
    itemName: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    shippingAddress?: string;
    orderReceivedDate?: string;
}): Promise<string> {
    const client = getClient();

    const columnValues: Record<string, any> = {};
    if (params.email) {
        columnValues[COLUMN_IDS.EMAIL] = { email: params.email, text: params.email };
    }
    if (params.phone) {
        columnValues[COLUMN_IDS.PHONE] = { phone: params.phone, countryShortName: 'US' };
    }
    if (params.firstName) {
        columnValues[COLUMN_IDS.FIRST_NAME] = params.firstName;
    }
    if (params.lastName) {
        columnValues[COLUMN_IDS.LAST_NAME] = params.lastName;
    }
    if (params.shippingAddress) {
        columnValues[COLUMN_IDS.SHIPPING_ADDRESS] = params.shippingAddress;
    }
    if (params.orderReceivedDate) {
        columnValues[COLUMN_IDS.ORDER_RECEIVED_DATE] = { date: params.orderReceivedDate };
    }

    const mutation = gql`
    mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
        id
      }
    }
  `;

    const variables = {
        boardId: params.boardId,
        itemName: params.itemName,
        columnValues: JSON.stringify(columnValues),
    };

    try {
        const data = await client.request<{ create_item: { id: string } }>(mutation, variables);
        return data.create_item.id;
    } catch (err: any) {
        logger.error(`[mondayClient] createItem failed: ${JSON.stringify({
            boardId: params.boardId,
            itemName: params.itemName,
            error: err.message,
            response: err.response,
            stack: err.stack,
        })}`);
        throw err;
    }
}

export async function createSubitem(params: {
    parentItemId: string;
    orderLineNumber: number;
    inscription: string;
    fragranceNames: string[];
}): Promise<string> {
    const client = getClient();
    const columnValuesObj = {
        [COLUMN_IDS.INSCRIPTION]: params.inscription,
        [COLUMN_IDS.FRAGRANCES]: { labels: params.fragranceNames },
    };
    const columnValues = JSON.stringify(columnValuesObj);
    const itemName = `${params.parentItemId}-${params.orderLineNumber}`;

    const mutation = gql`
    mutation ($parentItemId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_subitem(
        parent_item_id: $parentItemId
        item_name: $itemName
        column_values: $columnValues
        create_labels_if_missing: true
      ) {
        id
      }
    }
  `;

    const variables = {
        parentItemId: params.parentItemId,
        itemName,
        columnValues,
    };

    try {
        const data = await client.request<{ create_subitem: { id: string } }>(mutation, variables);
        return data.create_subitem.id;
    } catch (err: any) {
        logger.error(`[mondayClient] createSubitem failed: ${JSON.stringify({
            parentItemId: params.parentItemId,
            orderLineNumber: params.orderLineNumber,
            itemName,
            error: err.message,
            response: err.response,
            stack: err.stack,
        })}`);
        throw err;
    }
}

export async function getSubitemsWithStatus(params: {
    parentItemId: string;
    statusColumnId: string;
}): Promise<Array<{ id: string; statusLabel: string | null }>> {
    const client = getClient();
    const query = gql`
    query ($itemId: [ID!]!) {
      items(ids: $itemId) {
        subitems {
          id
          column_values {
            id
            text
          }
        }
      }
    }
  `;
    const data = await client.request<{
        items: Array<{
            subitems: Array<{
                id: string;
                column_values: Array<{ id: string; text: string | null }>;
            }>;
        }>;
    }>(query, {
        itemId: [params.parentItemId],
    });

    const subitems = data.items[0]?.subitems || [];
    return subitems.map((subitem) => {
        const statusColumn = subitem.column_values.find((col) => col.id === params.statusColumnId);
        return {
            id: subitem.id,
            statusLabel: statusColumn?.text || null,
        };
    });
}

export async function getItemStatus(params: {
    itemId: string;
    statusColumnId: string;
}): Promise<string | null> {
    const client = getClient();
    const query = gql`
    query ($itemId: [ID!]!) {
      items(ids: $itemId) {
        column_values {
          id
          text
        }
      }
    }
  `;
    const data = await client.request<{
        items: Array<{
            column_values: Array<{ id: string; text: string | null }>;
        }>;
    }>(query, {
        itemId: [params.itemId],
    });

    const statusColumn = data.items[0]?.column_values.find((col) => col.id === params.statusColumnId);
    return statusColumn?.text || null;
}

export async function updateItemStatus(params: {
    boardId: string;
    itemId: string;
    statusColumnId: string;
    statusLabel: string;
}): Promise<void> {
    const client = getClient();
    const mutation = gql`
    mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
        id
      }
    }
  `;
    await client.request(mutation, {
        boardId: params.boardId,
        itemId: params.itemId,
        columnId: params.statusColumnId,
        value: JSON.stringify({ label: params.statusLabel }),
    });
}

export async function updateItemDate(params: {
    boardId: string;
    itemId: string;
    dateColumnId: string;
    date: string;
}): Promise<void> {
    const client = getClient();
    const mutation = gql`
    mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
        id
      }
    }
  `;

    const variables = {
        boardId: params.boardId,
        itemId: params.itemId,
        columnId: params.dateColumnId,
        value: JSON.stringify({ date: params.date }),
    };

    try {
        await client.request(mutation, variables);
    } catch (err: any) {
        logger.error(`[mondayClient] updateItemDate failed: ${JSON.stringify({
            boardId: params.boardId,
            itemId: params.itemId,
            dateColumnId: params.dateColumnId,
            date: params.date,
            error: err.message,
            response: err.response,
            stack: err.stack,
        })}`);
        throw err;
    }
}

