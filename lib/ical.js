function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDate(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const d = new Date(`${dateStr}T${timeStr}`);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export function toICal(congress) {
  const sessions = congress?.data?.sessions || [];
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CongressAI//EN"];

  sessions.forEach((s) => {
    const dtStart = formatDate(s.date, s.startTime);
    const dtEnd = formatDate(s.date, s.endTime);
    if (!dtStart) return;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${s.id}`);
    lines.push(`SUMMARY:${(s.title || "").replace(/\n/g, " ")}`);
    if (dtStart) lines.push(`DTSTART:${dtStart}`);
    if (dtEnd) lines.push(`DTEND:${dtEnd}`);
    if (s.location) lines.push(`LOCATION:${s.location.replace(/\n/g, " ")}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\n");
}
