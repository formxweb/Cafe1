const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Minutes since midnight in the café's time zone. */
function localMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(date)
    .reduce((acc, p) => ({ ...acc, [p.type]: Number(p.value) }), {});
  return parts.hour * 60 + parts.minute;
}

/** Whether La Joie is open right now, with a short label for the UI. */
export function openStatus({ hours, timeZone }, now = new Date()) {
  const t = localMinutes(now, timeZone);
  const isOpen = t >= toMinutes(hours.open) && t < toMinutes(hours.close);
  return {
    isOpen,
    label: isOpen ? `Şu an açık · Kapanış ${hours.close}` : `Şu an kapalı · Açılış ${hours.open}`,
  };
}
