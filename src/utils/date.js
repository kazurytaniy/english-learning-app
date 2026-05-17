export const formatDateJst = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

export const addDaysJst = (date, days) => {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + Number(days || 0));
  return formatDateJst(d);
};
