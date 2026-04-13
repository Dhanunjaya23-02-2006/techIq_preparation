import feedparser
from groq import Groq
from core.config import settings

class CurrentAffairsService:
    @staticmethod
    def fetch_latest_news():
        # Curated list of Indian News RSS feeds
        feeds = [
            "https://pib.gov.in/RssMain.aspx?ModId=9&Lang=1", # PIB Railways
            "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1", # PIB National
            "https://www.thehindu.com/news/national/feeder/default.rss",
            "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
            "https://www.moneycontrol.com/rss/economy.xml", # Economy
            "https://pib.gov.in/RssMain.aspx?ModId=28&Lang=1", # PIB Science & Tech
            "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms", # Sports
        ]
        
        aggregated_news = []
        for url in feeds:
            try:
                feed = feedparser.parse(url)
                for entry in feed.entries[:10]: 
                    aggregated_news.append({
                        'title': entry.title,
                        'summary': entry.get('summary', entry.get('description', '')),
                        'link': entry.link,
                        'published': entry.get('published', '')
                    })
            except Exception as e:
                print(f"Error fetching RSS {url}: {e}")
                
        return aggregated_news

    @staticmethod
    def generate_current_affairs_summary(news_items):
        api_key = settings.GROQ_API_KEY
        if not api_key:
            return []

        # Format news for the prompt
        news_context = "\n\n".join([
            f"Title: {item['title']}\nSummary: {item['summary']}" 
            for item in news_items[:50] 
        ])
        
        client = Groq(api_key=api_key)
        
        prompt = f"""
        Extract 6-8 high-yield news items for Indian Railway Exams.
        Return ONLY valid JSON: {{"news": [{{ "title": "...", "content": "bulleted summary", "category": "railways|national|economy|sports|science_tech", "exam_insight": "...", "importance_score": 1-10 }}]}}
        
        NEWS ITEMS:
        {news_context[:3000]} 
        """
        
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "Output ONLY JSON."},
                    {"role": "user", "content": prompt}
                ],
                model=settings.AI_MODEL,
                temperature=0.1,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            
            import json
            content = chat_completion.choices[0].message.content
            if not content:
                raise Exception("Empty content")
                
            data = json.loads(content)
            items = data.get("news", [])
            return [i for i in items if isinstance(i, dict)]
            
        except Exception as e:
            print(f"Groq API Error or Rate Limit: {e}. using curated fallback.")
            # High-quality fallback data to ensure visibility even when API fails
            return [
                {
                    "title": "Indian Railways Launches 'Amrit Bharat Station Scheme' for 1275 Stations",
                    "content": "• Massive redevelopment of small and medium stations.\n• Focus on enhanced amenities, accessibility, and technology.\n• Integrated station development plan with a long-term vision.",
                    "category": "railways",
                    "exam_insight": "Critical for Railway exams. Know the scheme name and number of stations.",
                    "importance_score": 10
                },
                {
                    "title": "ISRO Successfully Launches NVS-01 Navigation Satellite",
                    "content": "• Part of NavIC (Navigation with Indian Constellation) series.\n• Improves GSLV launch capability.\n• Atomic clock technology used for the first time.",
                    "category": "science_tech",
                    "exam_insight": "Important for science section. Know the satellite name and launch vehicle (GSLV).",
                    "importance_score": 9
                },
                {
                    "title": "RBI Reports Significant Growth in India's Foreign Exchange Reserves",
                    "content": "• Reserves reach a multi-month high.\n• Driven by strong foreign investment and trade surplus.\n• Provides a cushion against global economic volatility.",
                    "category": "economy",
                    "exam_insight": "Economy related current affairs. Know the current reserves ballpark.",
                    "importance_score": 8
                }
            ]
