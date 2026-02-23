import { GraphQLClient, gql } from 'graphql-request';
import { mondayApiToken } from './config';

// Column IDs must match the monday.com board configuration.
// If columns are renamed in the board, update these constants.
// FIX: This is a wrong mental model; If we're installing the board WITH the app, then these are generated on demand. We can't do a new deploy per installation
const COLUMN_IDS = {
    EMAIL: 'email',
    PHONE: 'phone',
    SHIPPING_ADDRESS: 'text',
    INSCRIPTION: 'long_text_mm0qycr9',
    FRAGRANCES: 'dropdown_mm0qkhzm',
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
    shippingAddress?: string;
}): Promise<string> {
    const client = getClient();

    const columnValues: Record<string, any> = {};
    if (params.email) {
        columnValues[COLUMN_IDS.EMAIL] = { email: params.email, text: params.email };
    }
    if (params.phone) {
        columnValues[COLUMN_IDS.PHONE] = { phone: params.phone, countryShortName: 'US' };
    }
    if (params.shippingAddress) {
        columnValues[COLUMN_IDS.SHIPPING_ADDRESS] = params.shippingAddress;
    }

    const mutation = gql`
    mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
        id
      }
    }
  `;
    const data = await client.request<{ create_item: { id: string } }>(mutation, {
        boardId: params.boardId,
        itemName: params.itemName,
        columnValues: JSON.stringify(columnValues),
    });
    return data.create_item.id;
}

export async function createSubitem(params: {
    parentItemId: string;
    boxNumber: number;
    inscription: string;
    fragranceNames: string[];
}): Promise<string> {
    const client = getClient();
    const columnValues = JSON.stringify({
        [COLUMN_IDS.INSCRIPTION]: params.inscription,
        [COLUMN_IDS.FRAGRANCES]: { labels: params.fragranceNames },
    });
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
    const data = await client.request<{ create_subitem: { id: string } }>(mutation, {
        parentItemId: params.parentItemId,
        itemName: `${params.parentItemId}-${params.boxNumber}`,
        columnValues,
    });
    return data.create_subitem.id;
}

