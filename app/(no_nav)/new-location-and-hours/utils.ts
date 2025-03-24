export function getStreet(street?: string): string {
  if (!street) {
    return "No Address Set";
  }
  return street;
}
