export async function createOrderItem(_params: {
  boardId: number;
  itemName: string;
  token: string;
}): Promise<string> {
  throw new Error('not implemented');
}

export async function createBoxSubitem(_params: {
  parentItemId: string;
  boxNumber: number;
  inscription: string;
  fragranceNames: [string, string, string];
  token: string;
}): Promise<string> {
  throw new Error('not implemented');
}
