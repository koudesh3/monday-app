import { GraphQLClient, gql } from 'graphql-request';

// Column IDs must match the monday.com board configuration.
// If columns are renamed in the board, update these constants.
const COLUMN_IDS = {
  INSCRIPTION: 'inscription',
  FRAGRANCE_1: 'fragrance_1',
  FRAGRANCE_2: 'fragrance_2',
  FRAGRANCE_3: 'fragrance_3',
} as const;

function getClient(token: string): GraphQLClient {
  return new GraphQLClient('https://api.monday.com/v2', {
    headers: {
      Authorization: token,
      'API-Version': '2023-10',
    },
  });
}

export async function createOrderItem(params: {
  boardId: number;
  itemName: string;
  token: string;
}): Promise<string> {
  const client = getClient(params.token);
  const mutation = gql`
    mutation ($boardId: ID!, $itemName: String!) {
      create_item(board_id: $boardId, item_name: $itemName) {
        id
      }
    }
  `;
  const data = await client.request<{ create_item: { id: string } }>(mutation, {
    boardId: params.boardId,
    itemName: params.itemName,
  });
  return data.create_item.id;
}

export async function createBoxSubitem(params: {
  parentItemId: string;
  boxNumber: number;
  inscription: string;
  fragranceNames: [string, string, string];
  token: string;
}): Promise<string> {
  const client = getClient(params.token);
  const columnValues = JSON.stringify({
    [COLUMN_IDS.INSCRIPTION]: params.inscription,
    [COLUMN_IDS.FRAGRANCE_1]: params.fragranceNames[0],
    [COLUMN_IDS.FRAGRANCE_2]: params.fragranceNames[1],
    [COLUMN_IDS.FRAGRANCE_3]: params.fragranceNames[2],
  });
  const mutation = gql`
    mutation ($parentItemId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_subitem(parent_item_id: $parentItemId, item_name: $itemName, column_values: $columnValues) {
        id
      }
    }
  `;
  const data = await client.request<{ create_subitem: { id: string } }>(mutation, {
    parentItemId: params.parentItemId,
    itemName: `Box ${params.boxNumber}`,
    columnValues,
  });
  return data.create_subitem.id;
}
