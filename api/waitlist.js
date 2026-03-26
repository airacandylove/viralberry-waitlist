// Vercel Serverless Function — POST /api/waitlist
// Writes email signups to your Notion "Waitlist Signups" database.
//
// SETUP:
// 1. Create a Notion integration at https://www.notion.so/my-integrations
// 2. Copy the "Internal Integration Secret"
// 3. Share the "Waitlist Signups" database with your integration
// 4. In Vercel, add these environment variables:
//    - NOTION_API_KEY = your integration secret
//    - NOTION_DATABASE_ID = f3692648a44341d1b76c61128cf99f86
//      (this is the database ID created for your waitlist)

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Basic validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    console.error('Missing NOTION_API_KEY or NOTION_DATABASE_ID env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          Email: {
            title: [{ text: { content: email } }]
          },
          Source: {
            select: { name: 'Landing Page' }
          }
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Notion API error:', err);
      return res.status(500).json({ error: 'Failed to save signup' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Waitlist signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
