import axios from "axios";
import { format, subMinutes, addMinutes, isWithinInterval } from "date-fns";

interface NewsEvent {
  title: string;
  timestamp: Date;
}

let cachedNews: NewsEvent[] = [];
let lastFetch: Date | null = null;

export async function fetchNews() {
  const gnewsKey = process.env.GNEWS_API_KEY;
  if (!gnewsKey) return;

  try {
     // Limit fetches to once per hour to save API calls
     if (lastFetch && new Date().getTime() - lastFetch.getTime() < 3600000) {
       return;
     }

     const query = 'USD OR "Federal Reserve" OR "Interest Rate" OR FOMC OR CPI OR PPI OR NFP OR Gold';
     const res = await axios.get(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&token=${gnewsKey}`, { timeout: 10000 });
     
     if (res.data && res.data.articles) {
       cachedNews = res.data.articles.map((a: any) => ({
          title: a.title,
          timestamp: new Date(a.publishedAt)
       }));
       lastFetch = new Date();
     }
  } catch (err: any) {
    console.error("News API failed:", err.message);
  }
}

export async function isNewsBlockActive(): Promise<boolean> {
  await fetchNews();
  
  const now = new Date();
  
  for (const event of cachedNews) {
    // block 15 mins before and after
    const blockStart = subMinutes(event.timestamp, 15);
    const blockEnd = addMinutes(event.timestamp, 15);
    
    if (isWithinInterval(now, { start: blockStart, end: blockEnd })) {
       return true;
    }
  }
  return false;
}
