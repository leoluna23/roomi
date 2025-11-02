import type { Assignment, Chore, Member } from "./types";

function nextDateForDay(base: Date, day: number) {
  const d = new Date(base);
  const diff = (day - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}
function combineDateTime(d: Date, hhmm?: string) {
  const out = new Date(d); const [h=18,m=0] = (hhmm||"18:00").split(":").map(Number);
  out.setHours(h, m, 0, 0); return out;
}

export function roundRobinAssign(chores: Chore[], members: Member[], weekStartISO?: string): Assignment[] {
  if (!members.length || !chores.length) return [];
  const weekStart = weekStartISO ? new Date(weekStartISO) : new Date();
  const roster = [...members]; let idx = 0; const out: Assignment[] = [];

  for (const chore of chores) {
    const time = chore.preferred_time ?? "18:00";
    
    // Determine start date: use task's start_date if provided, otherwise use today/weekStart
    const startDate = chore.start_date ? new Date(chore.start_date) : (chore.freq === "daily" ? new Date() : weekStart);
    const endDate = chore.end_date ? new Date(chore.end_date) : null;
    
    // For daily tasks, generate assignments starting from start_date
    // For other frequencies, use preferred_day or default to Saturday (6)
    let when: Date;
    if (chore.freq === "daily") {
      when = combineDateTime(startDate, time);
    } else {
      const day = chore.preferred_day ?? 6;
      when = combineDateTime(nextDateForDay(startDate, day), time);
    }

    // Handle different frequencies, respecting start_date and end_date
    if (chore.freq === "daily") {
      // Generate daily assignments from start_date until end_date (or 60 days if no end_date)
      const maxDays = endDate 
        ? Math.ceil((endDate.getTime() - when.getTime()) / (1000 * 60 * 60 * 24))
        : 60;
      for (let i = 0; i < maxDays; i++) {
        const assignmentDate = new Date(when);
        assignmentDate.setDate(assignmentDate.getDate() + i);
        // Skip if assignment date is after end_date
        if (endDate && assignmentDate > endDate) break;
        const m = roster[idx % roster.length];
        out.push({ chore_id: chore.id, member_id: m.id, when_ts: assignmentDate.toISOString() });
        idx = (idx + 1) % roster.length;
      }
    } else if (chore.freq === "every_other_day") {
      // Generate every-other-day assignments from start_date until end_date (or 60 days)
      const maxDays = endDate 
        ? Math.ceil((endDate.getTime() - when.getTime()) / (1000 * 60 * 60 * 24))
        : 60;
      for (let i = 0; i < maxDays; i += 2) {
        const assignmentDate = new Date(when);
        assignmentDate.setDate(assignmentDate.getDate() + i);
        // Skip if assignment date is after end_date
        if (endDate && assignmentDate > endDate) break;
        const m = roster[idx % roster.length];
        out.push({ chore_id: chore.id, member_id: m.id, when_ts: assignmentDate.toISOString() });
        idx = (idx + 1) % roster.length;
      }
    } else {
      // For weekly/biweekly/monthly, use preferred_day and availability matching
      const day = chore.preferred_day ?? 6;
      let pos: number | null = null;
      for (let k = 0; k < roster.length; k++) {
        const m = roster[(idx + k) % roster.length];
        const ok = (m.availability || []).some(a => {
          if (a.day !== day) return false;
          const t = Number(time.slice(0,2)) * 60 + Number(time.slice(3));
          const s = Number(a.start.slice(0,2))*60 + Number(a.start.slice(3));
          const e = Number(a.end.slice(0,2))*60 + Number(a.end.slice(3));
          return t >= s && t <= e;
        });
        if (ok) { pos = (idx + k) % roster.length; break; }
      }
      if (pos === null) pos = idx;

      const m = roster[pos];
      
      if (chore.freq === "weekly") {
        // Generate weekly assignments from start_date until end_date (or 8 weeks)
        let i = 0;
        while (true) {
          const weeklyDate = new Date(when);
          weeklyDate.setDate(weeklyDate.getDate() + (i * 7));
          // Stop if end_date is set and we've passed it, or if we've generated 8 weeks
          if (endDate && weeklyDate > endDate) break;
          if (!endDate && i >= 8) break;
          const currentMember = roster[idx % roster.length];
          out.push({ chore_id: chore.id, member_id: currentMember.id, when_ts: weeklyDate.toISOString() });
          idx = (idx + 1) % roster.length;
          i++;
          if (!endDate && i >= 8) break; // Double check for non-end_date case
        }
      } else if (chore.freq === "biweekly") {
        // Generate biweekly assignments from start_date until end_date (or 8 occurrences)
        let i = 0;
        while (true) {
          const biweeklyDate = new Date(when);
          biweeklyDate.setDate(biweeklyDate.getDate() + (i * 14));
          // Stop if end_date is set and we've passed it, or if we've generated 8 occurrences
          if (endDate && biweeklyDate > endDate) break;
          if (!endDate && i >= 8) break;
          const currentMember = roster[idx % roster.length];
          out.push({ chore_id: chore.id, member_id: currentMember.id, when_ts: biweeklyDate.toISOString() });
          idx = (idx + 1) % roster.length;
          i++;
          if (!endDate && i >= 8) break; // Double check for non-end_date case
        }
      } else if (chore.freq === "monthly") {
        // Generate monthly assignments from start_date until end_date (or 12 months)
        let i = 0;
        while (true) {
          const monthlyDate = new Date(when);
          monthlyDate.setMonth(monthlyDate.getMonth() + i);
          // Stop if end_date is set and we've passed it, or if we've generated 12 months
          if (endDate && monthlyDate > endDate) break;
          if (!endDate && i >= 12) break;
          const currentMember = roster[idx % roster.length];
          out.push({ chore_id: chore.id, member_id: currentMember.id, when_ts: monthlyDate.toISOString() });
          idx = (idx + 1) % roster.length;
          i++;
          if (!endDate && i >= 12) break; // Double check for non-end_date case
        }
      } else {
        // For other frequencies (fallback), generate one assignment if within date range
        if (!endDate || when <= endDate) {
          out.push({ chore_id: chore.id, member_id: m.id, when_ts: when.toISOString() });
          idx = (pos + 1) % roster.length;
        }
      }
    }
  }
  return out;
}
