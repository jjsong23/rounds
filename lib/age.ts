export const MINIMUM_AGE = 21;

export function computeAge(dateOfBirth: Date, at: Date = new Date()): number {
  let age = at.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = at.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

export function isOfAge(dateOfBirth: Date, at: Date = new Date()): boolean {
  return computeAge(dateOfBirth, at) >= MINIMUM_AGE;
}
