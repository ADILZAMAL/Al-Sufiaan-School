import { compareRollNumbers, fullName, initials, sortByRoll } from '../lib/rollNumber';

describe('compareRollNumbers', () => {
  it('sorts numerically, not as text', () => {
    expect(['10', '2', '1', '21', '03'].sort(compareRollNumbers)).toEqual(['1', '2', '03', '10', '21']);
  });

  it('puts blank roll numbers last', () => {
    expect([null, '5', '', undefined, '1'].sort(compareRollNumbers)).toEqual(['1', '5', null, '', undefined]);
  });

  it('falls back to natural text order for mixed values', () => {
    expect(['A10', 'A2', '3'].sort(compareRollNumbers)).toEqual(['3', 'A2', 'A10']);
  });
});

describe('sortByRoll', () => {
  it('breaks ties by name and does not mutate the input', () => {
    const input = [
      { rollNumber: '2', firstName: 'Zara', lastName: 'K' },
      { rollNumber: null, firstName: 'Amir', lastName: null },
      { rollNumber: '2', firstName: 'Anil', lastName: 'S' },
    ];
    const sorted = sortByRoll(input);
    expect(sorted.map(s => s.firstName)).toEqual(['Anil', 'Zara', 'Amir']);
    expect(input[0].firstName).toBe('Zara');
  });
});

describe('names', () => {
  it('builds full names and initials without dangling spaces', () => {
    expect(fullName({ firstName: 'Md', lastName: null })).toBe('Md');
    expect(initials({ firstName: 'afsana', lastName: 'khatun' })).toBe('AK');
  });
});
