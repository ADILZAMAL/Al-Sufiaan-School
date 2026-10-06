import { byRollThenName, compareRollNumbers } from '../rollNumber';

describe('roll number ordering', () => {
  it('sorts numerically with blanks last', () => {
    expect(['10', '2', null, '01', ''].sort(compareRollNumbers)).toEqual(['01', '2', '10', null, '']);
  });

  it('breaks ties by name', () => {
    const rows = [{ roll: '1', name: 'Zoya' }, { roll: '1', name: 'Arif' }, { roll: null, name: 'Bilal' }];
    expect(rows.sort(byRollThenName(r => r.roll, r => r.name)).map(r => r.name)).toEqual(['Arif', 'Zoya', 'Bilal']);
  });
});
