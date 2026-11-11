import { diffAudit } from './audit-diff';

describe('diffAudit', () => {
  it('lists only changed fields', () => {
    expect(diffAudit({ name: 'A', city: 'X' }, { name: 'B', city: 'X' })).toEqual([
      { field: 'name', before: 'A', after: 'B' },
    ]);
  });

  it('handles creation and deletion', () => {
    expect(diffAudit(null, { name: 'A' })).toEqual([{ field: 'name', before: '—', after: 'A' }]);
    expect(diffAudit({ name: 'A' }, null)).toEqual([{ field: 'name', before: 'A', after: '—' }]);
  });
});
