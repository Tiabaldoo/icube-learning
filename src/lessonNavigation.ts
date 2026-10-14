export function needsImageReminder(count: number, viewed: readonly number[]) {
  return count > 1 && Array.from({ length: count }, (_, i) => i).some(i => !viewed.includes(i));
}
