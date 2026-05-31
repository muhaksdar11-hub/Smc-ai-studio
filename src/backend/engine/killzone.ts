import { toZonedTime } from "date-fns-tz";

export function isKillzoneActive(): boolean {
  const timeZone = process.env.APP_TIMEZONE || "Asia/Makassar";
  const now = new Date();
  const zonedTime = toZonedTime(now, timeZone);
  
  const hours = zonedTime.getHours();
  const minutes = zonedTime.getMinutes();
  const timeNum = hours + (minutes / 60); 

  // Killzone rules:
  // 15:00 - 18:00 WITA
  // 21:30 - 00:00 WITA (21.5 to 24.0)
  
  const isAfternoon = timeNum >= 15.0 && timeNum <= 18.0;
  const isNight = timeNum >= 21.5 && timeNum <= 24.0;
  
  return isAfternoon || isNight;
}
