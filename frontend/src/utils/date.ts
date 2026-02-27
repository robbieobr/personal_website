export function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
}
