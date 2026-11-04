// A project tombstone hides its contents without changing child records.
export function isInTrash(record, records) {
  if (!record) return false;
  return Boolean(record.deleted_at || (record.project_id && records.some(p => p.id === record.project_id && p.deleted_at)));
}
export function visibleRecords(records, kind) {
  return records.filter(r => r.kind === kind && !isInTrash(r, records));
}
export function trashEntries(records) {
  return records.filter(r => r.deleted_at && ['project', 'task'].includes(r.kind)
    && !records.some(p => p.id === r.project_id && p.deleted_at))
    .sort((a,b) => String(b.deleted_at).localeCompare(String(a.deleted_at)));
}
export function canManageRecord(record, records, membership, userId) {
  if (!record || !['project','task'].includes(record.kind) || membership?.status !== 'active' || !userId) return false;
  const project = record.kind === 'project' ? record : records.find(p => p.id === record.project_id && p.kind === 'project');
  return Boolean(project && (membership.is_owner || project.details?.lead === userId));
}
