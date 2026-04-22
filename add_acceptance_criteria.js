/**
 * Ko Japanese Dining — Sprint 2 Acceptance Criteria Updater
 * Adds acceptance criteria to all Sprint 2 stories in Jira
 *
 * Usage:
 *   JIRA_API_TOKEN=your_token_here node add_acceptance_criteria.js
 */

const https = require('https');

const CONFIG = {
  domain:     'cmsc447-ocr-proj.atlassian.net',
  email:      'mhaidar2@umbc.edu',
  apiToken:   process.env.JIRA_API_TOKEN,
  projectKey: 'RG3KJDA',
};

if (!CONFIG.apiToken) {
  console.error('\nMissing API token!');
  console.error('    Run with: JIRA_API_TOKEN=your_token_here node add_acceptance_criteria.js\n');
  process.exit(1);
}

const auth = Buffer.from(`${CONFIG.email}:${CONFIG.apiToken}`).toString('base64');

function jiraRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CONFIG.domain,
      path:     `/rest/api/3${path}`,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (!data.trim()) return resolve({});
          try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
        } else {
          try { reject(new Error(`[${res.statusCode}] ${JSON.stringify(JSON.parse(data))}`)); }
          catch (e) { reject(new Error(`[${res.statusCode}] ${data}`)); }
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function makeDescription(userStory, acceptanceCriteria) {
  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: userStory }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Acceptance Criteria:', marks: [{ type: 'strong' }] }],
      },
      {
        type: 'bulletList',
        content: acceptanceCriteria.map(criterion => ({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: criterion }],
          }],
        })),
      },
    ],
  };
}

// All Sprint 2 stories with their acceptance criteria
const STORIES = [
  // ── ADMIN DASHBOARD ──────────────────────────────────────────────────────
  {
    summary: 'Admin Order Management',
    userStory: 'As a restaurant admin, I want to view and manage all incoming orders so that I can process them efficiently and keep the kitchen informed.',
    acceptanceCriteria: [
      'Admin can view a list of all orders with customer name, items, total, and current status',
      'Admin can filter orders by status (pending, preparing, ready, completed)',
      'Admin can update the status of any order through allowed transition stages',
      'Order list auto-refreshes every 20 seconds without a manual page reload',
      'Clicking an order opens a detail modal showing full order information including modifiers and special instructions',
      'Status changes are reflected immediately in the UI after update',
    ],
  },
  {
    summary: 'Admin Analytics Dashboard',
    userStory: 'As a restaurant admin, I want to view sales and customer analytics so that I can make informed decisions about the menu and operations.',
    acceptanceCriteria: [
      'Admin dashboard displays total orders, total revenue, average order value, and top selling items',
      'A bar chart shows order volume by day for the past 7 days',
      'Analytics data is fetched from the GET /api/admin/analytics endpoint',
      'Analytics update when the page is refreshed',
      'All figures are accurate and match the orders in the database',
    ],
  },

  // ── CORE UI & NAVIGATION ─────────────────────────────────────────────────
  {
    summary: 'Complete Site Navigation & Footer',
    userStory: 'As a customer, I want a complete and consistent navigation and footer across all pages so that I can move through the site easily.',
    acceptanceCriteria: [
      'Footer displays restaurant name, address, phone number, hours, and copyright notice',
      'Contact page includes address, phone number, hours of operation, and an embedded map',
      'Navbar collapses into a hamburger menu on screens 768px wide or smaller',
      'Hamburger menu opens a drawer showing all navigation links when tapped',
      'All navigation links are accessible and functional on mobile viewports',
      'Closing the mobile menu after tapping a link navigates to the correct page',
    ],
  },
  {
    summary: 'About & Restaurant Info Pages',
    userStory: 'As a customer, I want to learn about the restaurant so that I can understand the story and cuisine before visiting.',
    acceptanceCriteria: [
      'About page includes restaurant story, cuisine philosophy, and interior photos',
      'Hours & Location page shows weekly hours, address, parking info, and a map embed',
      'Pages are accessible from the main navigation',
      'Pages are fully responsive on mobile screens',
    ],
  },
  {
    summary: 'Menu Search & Filter',
    userStory: 'As a customer, I want to search and filter the menu so that I can quickly find dishes that match my preferences or dietary needs.',
    acceptanceCriteria: [
      'Search bar filters menu items in real time as the customer types',
      'Search matches against both item name and description',
      'Dietary filter buttons are available for: Vegetarian, Vegan, Gluten-Free, Spicy, Raw Fish',
      'Multiple dietary filters can be active at the same time',
      'GET /api/menu/items accepts optional query params for tag filtering and keyword search',
      'Clearing all filters restores the full menu',
    ],
  },
  {
    summary: 'Error & Empty State Pages',
    userStory: 'As a customer, I want clear error messages and helpful empty states so that I am never confused when something goes wrong.',
    acceptanceCriteria: [
      'Navigating to any unknown URL displays the branded 404 page',
      '404 page includes a link back to the home page',
      'Empty cart state shows an icon and helpful message prompting the user to browse the menu',
      'No search results state shows a helpful message',
      'No reservations state shows a helpful message on the reservations page',
      'Empty states are consistent in style across all pages',
    ],
  },

  // ── MENU BROWSING ─────────────────────────────────────────────────────────
  {
    summary: 'Enhanced Menu Experience',
    userStory: 'As a customer, I want a rich menu browsing experience with images and reviews so that I can make confident ordering decisions.',
    acceptanceCriteria: [
      'Menu item cards display the actual food photo from the image_url field in the database',
      'A placeholder image is shown if no image_url is set for an item',
      'Featured items (is_featured = true) are displayed in a highlighted section on the home page with image, name, and price',
      'Customer reviews and average rating are shown on each menu item detail view',
      'Customers can submit a star rating (1–5) and written comment for a menu item',
      'Submitted reviews appear immediately under the menu item without a page reload',
      'Reviews are stored in the database with item_id, rating, comment, and created_at',
    ],
  },

  // ── EMAIL NOTIFICATIONS ───────────────────────────────────────────────────
  {
    summary: 'Transactional Email Notifications',
    userStory: 'As a customer, I want to receive email confirmations for my orders and reservations so that I always have a record of my bookings.',
    acceptanceCriteria: [
      'Nodemailer is configured with SMTP credentials stored securely in .env',
      'An order confirmation email is sent to the customer after a successful order submission',
      'Order confirmation email includes order number, items ordered, total, and estimated pickup time',
      'A reservation confirmation email is sent after a reservation is created',
      'Reservation email includes confirmation number, date, time, party size, and restaurant address',
      'A "order ready" notification email is sent when an order status changes to ready for pickup',
      'All emails use branded HTML templates with Ko colors and logo',
      'Email failures do not block the order or reservation from completing',
    ],
  },

  // ── SPRINT 2 DELIVERABLES ─────────────────────────────────────────────────
  {
    summary: 'Sprint 2 Documentation & Artifacts',
    userStory: 'As a team, we want to complete all required Sprint 2 documents and artifacts so that we meet the graded deliverables on time.',
    acceptanceCriteria: [
      'SRS document is updated to reflect all Sprint 2 features including ordering, reservations, reviews, and email notifications',
      'Software testing document contains test cases for all Sprint 2 user stories in the required 8-column format',
      'UI wireframe document includes wireframes for all new Sprint 2 pages',
      'Weekly status reports are submitted to MS Teams before each weekly meeting',
      'Sprint Review document is completed and demo is delivered to the customer',
      'Team Contribution document lists each member\'s assigned and completed tasks',
      'Sprint Retrospective is completed with Start/Stop/Continue board photo',
      'Peer evaluation forms are submitted individually before the retrospective',
    ],
  },
];

async function getSprintStories() {
  console.log('Fetching Sprint 2 stories from Jira...');
  const result = await jiraRequest(
    'POST',
    '/search/jql',
    {
      jql: `project=${CONFIG.projectKey} AND issuetype=Story AND sprint in openSprints()`,
      fields: ['summary', 'description'],
      maxResults: 100,
    }
  );
  return result.issues || [];
}

async function updateIssue(issueKey, description) {
  await jiraRequest('PUT', `/issue/${issueKey}`, {
    fields: { description },
  });
}

async function main() {
  console.log('\nKo Japanese Dining — Acceptance Criteria Updater');
  console.log('=================================================\n');

  const issues = await getSprintStories();
  console.log(`Found ${issues.length} stories in current sprint.\n`);

  let updated = 0;
  let skipped = 0;

  for (const story of STORIES) {
    const match = issues.find(i =>
      i.fields.summary.toLowerCase().trim() === story.summary.toLowerCase().trim()
    );

    if (!match) {
      console.log(`⚠  Not found in Jira: "${story.summary}"`);
      skipped++;
      continue;
    }

    console.log(`Updating: ${match.key} — ${story.summary}`);
    const description = makeDescription(story.userStory, story.acceptanceCriteria);
    await updateIssue(match.key, description);
    updated++;
    await delay(400);
  }

  console.log('\n=================================================');
  console.log(`Updated:  ${updated} stories`);
  console.log(`Skipped:  ${skipped} stories (not found in sprint)`);
  console.log('=================================================\n');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
