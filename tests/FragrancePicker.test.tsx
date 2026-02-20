import { describe, it, expect } from 'vitest';
import { toggleFragranceSelection } from '../src/client/components/FragrancePicker';

describe('toggleFragranceSelection', () => {
  it('adds an unselected fragrance when fewer than 3 are selected', () => {
    const result = toggleFragranceSelection([], '1');
    expect(result).toEqual(['1']);
  });

  it('adds a second fragrance', () => {
    const result = toggleFragranceSelection(['1'], '2');
    expect(result).toEqual(['1', '2']);
  });

  it('adds a third fragrance', () => {
    const result = toggleFragranceSelection(['1', '2'], '3');
    expect(result).toEqual(['1', '2', '3']);
  });

  it('removes a selected fragrance', () => {
    const result = toggleFragranceSelection(['1', '2'], '1');
    expect(result).toEqual(['2']);
  });

  it('removes a fragrance from a full selection of 3', () => {
    const result = toggleFragranceSelection(['1', '2', '3'], '2');
    expect(result).toEqual(['1', '3']);
  });

  it('does not add a 4th fragrance when 3 are already selected', () => {
    const result = toggleFragranceSelection(['1', '2', '3'], '4');
    expect(result).toEqual(['1', '2', '3']);
  });

  it('returns unchanged array when trying to select beyond limit', () => {
    const selected = ['1', '2', '3'];
    const result = toggleFragranceSelection(selected, '4');
    expect(result).toBe(selected);
  });
});
