/**
 * Ko Japanese Dining — Sprint 2 Jira Ticket Creator
 * CMSC 447 • Software Engineering I • SP26
 * Project Type: Team-Managed
 *
 * Usage (in VS Code terminal):
 *   JIRA_API_TOKEN=your_token_here node create_sprint2_tickets.js
 *
 * This script adds Sprint 2 tickets only.
 * It does NOT touch Sprint 1 tickets already in Jira.
 */

const https = require('https');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  domain:     'cmsc447-ocr-proj.atlassian.net',
  email:      'mhaidar2@umbc.edu',
  apiToken:   process.env.JIRA_API_TOKEN,
  projectKey: 'RG3KJDA',
  boardId:    '100',
};

if (!CONFIG.apiToken) {
  console.error('\nMissing API token!');
  console.error('    Run with: JIRA_API_TOKEN=your_token_here node create_sprint2_tickets.js\n');
  process.exit(1);
}

const auth = Buffer.from(`${CONFIG.email}:${CONFIG.apiToken}`).toString('base64');

// ─── API HELPER ───────────────────────────────────────────────────────────────
function jiraRequest(method, path, body = null, useAgile = false) {
  return new Promise((resolve, reject) => {
    const basePath = useAgile ? '/rest/agile/1.0' : '/rest/api/3';
    const options = {
      hostname: CONFIG.domain,
      path:     `${basePath}${path}`,
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
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`[${res.statusCode}] ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── GET ISSUE TYPE IDs ───────────────────────────────────────────────────────
async function getIssueTypeIds() {
  console.log('Fetching project issue types...');
  const meta = await jiraRequest(
    'GET',
    `/issue/createmeta?projectKeys=${CONFIG.projectKey}&expand=projects.issuetypes`
  );

  const project = meta.projects[0];
  if (!project) throw new Error(`Project ${CONFIG.projectKey} not found.`);

  const types = {};
  for (const t of project.issuetypes) types[t.name] = t.id;

  console.log('Issue types:', Object.keys(types).join(', '), '\n');
  return types;
}

// ─── GET SPRINT 2 ID ─────────────────────────────────────────────────────────
async function getSprint2Id() {
  console.log('Fetching Sprint 2...');
  try {
    const result = await jiraRequest(
      'GET',
      `/board/${CONFIG.boardId}/sprint`,
      null,
      true
    );

    const sprint2 = result.values?.find(s =>
      s.name.toLowerCase().includes('sprint 2') ||
      s.name.toLowerCase().includes('sprint2')
    );

    if (sprint2) {
      console.log(`Found Sprint 2: "${sprint2.name}" (ID: ${sprint2.id})\n`);
      return sprint2.id;
    }

    // Fall back to any open sprint that isn't sprint 1
    const openSprints = result.values?.filter(s => s.state !== 'closed');
    if (openSprints && openSprints.length > 0) {
      const sprint = openSprints[openSprints.length - 1];
      console.log(`Using sprint: "${sprint.name}" (ID: ${sprint.id})\n`);
      return sprint.id;
    }

    console.log('No Sprint 2 found. Tickets will be created in backlog.\n');
    return null;
  } catch (e) {
    console.log('Could not fetch sprint. Tickets will be in backlog.\n');
    return null;
  }
}

// ─── GET EXISTING EPIC KEYS ───────────────────────────────────────────────────
// Finds existing epics from Sprint 1 so Sprint 2 stories can be linked to them
async function getExistingEpics() {
  console.log('Fetching existing epics from Sprint 1...');
  const result = await jiraRequest(
    'POST',
    '/search/jql',
    {
      jql: `project=${CONFIG.projectKey} AND issuetype=Epic`,
      fields: ['summary']
    }
  );

  const epics = {};
  for (const issue of result.issues) {
    epics[issue.fields.summary] = issue.key;
  }

  console.log(`Found ${Object.keys(epics).length} existing epics.\n`);
  return epics;
}

// ─── CREATE A SINGLE ISSUE ────────────────────────────────────────────────────
async function createIssue({ summary, description, issueTypeId, parentKey, storyPoints }) {
  const fields = {
    project:     { key: CONFIG.projectKey },
    summary,
    issuetype:   { id: issueTypeId },
    description: {
      type:    'doc',
      version: 1,
      content: [{
        type:    'paragraph',
        content: [{ type: 'text', text: description || '' }],
      }],
    },
  };

  if (parentKey)   fields.parent = { key: parentKey };
  if (storyPoints) fields['customfield_10016'] = storyPoints;

  const result = await jiraRequest('POST', '/issue', { fields });
  return result.key;
}

// ─── MOVE ISSUES TO SPRINT ────────────────────────────────────────────────────
async function moveToSprint(sprintId, issueKeys) {
  if (!sprintId || issueKeys.length === 0) return;
  const batchSize = 50;
  for (let i = 0; i < issueKeys.length; i += batchSize) {
    const batch = issueKeys.slice(i, i + batchSize);
    try {
      await jiraRequest(
        'POST',
        `/sprint/${sprintId}/issue`,
        { issues: batch },
        true
      );
      await delay(300);
    } catch (e) {
      console.log('Could not move batch to sprint: ' + e.message);
    }
  }
}

// ─── SPRINT 2 BACKLOG DATA ────────────────────────────────────────────────────
// epicName must match an existing epic from Sprint 1 exactly,
// or set to null to create a new epic.
const SPRINT2_BACKLOG = [

  // ── ADMIN DASHBOARD (new stories only) ───────────────────────────────────
  {
    epicName: 'Admin Dashboard',
    newEpic:  false,
    stories: [
      {
        summary:     'Admin Order Management',
        description: 'As a restaurant admin, I want to view and manage all incoming orders so that I can process them efficiently and keep the kitchen informed.',
        points:      8,
        tasks: [
          { summary: 'Admin Order List API',       description: 'Build GET /api/admin/orders endpoint returning all orders with customer info, items, and current status. Support filtering by status and date.', points: 2 },
          { summary: 'Order Status Update API',    description: 'Build PATCH /api/orders/:id/status endpoint. Allow admin to move orders through status stages with validation on allowed transitions.', points: 2 },
          { summary: 'Real-time Order Queue (UI)', description: 'Update admin dashboard order queue to auto-refresh every 20 seconds so new orders appear without manual page reload.', points: 3 },
          { summary: 'Order Detail Modal',         description: 'Build modal showing full order details: customer name, contact, items, modifiers, special instructions, and order timeline.', points: 2 },
        ],
      },
      {
        summary:     'Admin Analytics Dashboard',
        description: 'As a restaurant admin, I want to view sales and customer analytics so that I can make informed decisions about the menu and operations.',
        points:      8,
        tasks: [
          { summary: 'Sales Summary Cards (UI)', description: 'Display total orders, total revenue, average order value, and top selling items on the admin dashboard home.', points: 3 },
          { summary: 'Analytics API',            description: 'Build GET /api/admin/analytics endpoint returning sales totals, order counts by status, and top items for a given date range.', points: 3 },
          { summary: 'Orders by Date Chart',     description: 'Add a simple bar chart to the admin dashboard showing order volume by day for the past 7 days using recharts.', points: 2 },
        ],
      },
    ],
  },

  // ── CORE UI & NAVIGATION (new stories only) ───────────────────────────────
  {
    epicName: 'Core UI & Navigation',
    newEpic:  false,
    stories: [
      {
        summary:     'Complete Site Navigation & Footer',
        description: 'As a customer, I want a complete and consistent navigation and footer across all pages so that I can move through the site easily.',
        points:      5,
        tasks: [
          { summary: 'Footer Component',         description: 'Build site footer with restaurant name, address, phone, hours, social media links, and copyright notice.', points: 2 },
          { summary: 'Create Contact Us Page',   description: 'Build contact page with restaurant address, phone number, hours of operation, and an embedded Google Map or static map image.', points: 2 },
          { summary: 'Mobile Responsive Navbar', description: 'Update global navbar to collapse into a hamburger menu on mobile screens. Ensure all links are accessible on small viewports.', points: 2 },
        ],
      },
      {
        summary:     'About & Restaurant Info Pages',
        description: 'As a customer, I want to learn about the restaurant so that I can understand the story and cuisine before visiting.',
        points:      5,
        tasks: [
          { summary: 'About Us Page (UI)',         description: 'Build about page with restaurant story, chef background, cuisine philosophy, and interior photos.', points: 2 },
          { summary: 'Hours & Location Page (UI)', description: 'Build dedicated page showing weekly hours, holiday hours, address, parking info, and map embed.', points: 2 },
        ],
      },
      {
        summary:     'Menu Search & Filter',
        description: 'As a customer, I want to search and filter the menu so that I can quickly find dishes that match my preferences or dietary needs.',
        points:      5,
        tasks: [
          { summary: 'Menu Search Bar (UI)',  description: 'Add a search bar to the menu page that filters items in real time as the customer types. Search across item name and description.', points: 2 },
          { summary: 'Dietary Filter (UI)',   description: 'Add filter buttons to the menu page for dietary tags: Vegetarian, Vegan, Gluten-Free, Spicy, Raw Fish. Allow multiple filters to be active at once.', points: 2 },
          { summary: 'Filter API Support',   description: 'Update GET /api/menu/items to accept optional query params for tag filtering and keyword search. Return filtered results.', points: 2 },
        ],
      },
      {
        summary:     'Error & Empty State Pages',
        description: 'As a customer, I want clear error messages and helpful empty states so that I am never confused when something goes wrong.',
        points:      3,
        tasks: [
          { summary: '404 Not Found Page',     description: 'Build a branded 404 page that shows when a customer navigates to a route that does not exist. Include a link back to the home page.', points: 1 },
          { summary: 'Empty State Components', description: 'Build reusable empty state components for: empty cart, no search results, no reservations, no order history. Each should have an icon and a helpful message.', points: 2 },
        ],
      },
    ],
  },

  // ── MENU BROWSING (new stories only) ─────────────────────────────────────
  {
    epicName: 'Menu Browsing',
    newEpic:  false,
    stories: [
      {
        summary:     'Enhanced Menu Experience',
        description: 'As a customer, I want a rich menu browsing experience with images and reviews so that I can make confident ordering decisions.',
        points:      8,
        tasks: [
          { summary: 'Menu Item Images',           description: 'Connect image_url field from the database to display actual food photos on menu item cards and detail views. Use a placeholder image if none is set.', points: 2 },
          { summary: 'Featured Items on Home Page',description: 'Pull is_featured items from the database and display them as a featured section on the home page with images, names, and prices.', points: 2 },
          { summary: 'Customer Reviews Display',   description: 'Show customer reviews and average rating on each menu item detail page. Fetch from reviews table.', points: 2 },
          { summary: 'Submit a Review (UI + API)', description: 'Allow logged-in customers who have ordered the item to submit a star rating and written review. Build POST /api/reviews endpoint.', points: 3 },
          { summary: 'Reviews DB Schema',          description: 'Create reviews table: id, customer_id, item_id, rating (1-5), comment, created_at. Add constraint so a customer can only review an item they have ordered.', points: 2 },
        ],
      },
    ],
  },

  // ── EMAIL NOTIFICATIONS (new epic) ───────────────────────────────────────
  {
    epicName: 'Email Notifications',
    newEpic:  true,
    stories: [
      {
        summary:     'Transactional Email Notifications',
        description: 'As a customer, I want to receive email confirmations for my orders and reservations so that I always have a record of my bookings.',
        points:      8,
        tasks: [
          { summary: 'Email Service Setup (Nodemailer)', description: 'Install and configure Nodemailer with a transactional email provider (Gmail SMTP or SendGrid). Store credentials in .env file.', points: 2 },
          { summary: 'Order Confirmation Email',         description: 'Send an automated email to the customer after a successful order submission. Include order number, items, total, and estimated pickup time.', points: 2 },
          { summary: 'Reservation Confirmation Email',   description: 'Send an automated email after a reservation is created. Include confirmation number, date, time, party size, and restaurant address.', points: 2 },
          { summary: 'Order Ready Notification Email',   description: 'Send an email notification to the customer when their order status changes to ready for pickup.', points: 2 },
          { summary: 'Email Templates',                  description: 'Create clean branded HTML email templates for all transactional emails. Use Ko brand colors and include the restaurant logo.', points: 3 },
        ],
      },
    ],
  },

  // ── SPRINT 2 DELIVERABLES (new epic) ─────────────────────────────────────
  {
    epicName: 'Sprint 2 Deliverables',
    newEpic:  true,
    stories: [
      {
        summary:     'Sprint 2 Documentation & Artifacts',
        description: 'As a team, we want to complete all required Sprint 2 documents and artifacts so that we meet the graded deliverables on time.',
        points:      null,
        tasks: [
          { summary: 'Update SRS for Sprint 2 Features',   description: 'Update the SRS document to reflect all new features being built in Sprint 2: ordering, reservations, loyalty, reviews, and email notifications.', points: null },
          { summary: 'Sprint 2 Software Testing Document', description: 'Create black-box and white-box test cases for all Sprint 2 user stories using the 8-column format.', points: null },
          { summary: 'Update UI Wireframe Document',        description: 'Add wireframes for all new Sprint 2 pages: Cart, Checkout, Order Status, Reservations, Special Dining, Loyalty, Reviews, About, 404.', points: null },
          { summary: 'Weekly Status Report — Week 1',       description: 'Submit to MS Teams before weekly meeting. Sections: Work Completed, Goals for Next Week, Outstanding Issues, Team Problems.', points: null },
          { summary: 'Weekly Status Report — Week 2',       description: 'Submit to MS Teams before weekly meeting. Sections: Work Completed, Goals for Next Week, Outstanding Issues, Team Problems.', points: null },
          { summary: 'Weekly Status Report — Week 3',       description: 'Submit to MS Teams before weekly meeting. Sections: Work Completed, Goals for Next Week, Outstanding Issues, Team Problems.', points: null },
          { summary: 'Sprint 2 Review',                     description: 'Demo Sprint 2 working software to the customer. Show ordering flow, reservations, and loyalty system. Fill out Sprint Review document.', points: null },
          { summary: 'Team Contribution Document',          description: 'Document each team member assigned tasks and completed work during Sprint 2.', points: null },
          { summary: 'Sprint 2 Retrospective',              description: 'Take Start/Stop/Continue board photo. List agreed modifications the team will carry into Sprint 3.', points: null },
          { summary: 'Peer Evaluation Forms',               description: 'Each member submits individually: evaluate the team as a whole and each teammate. Complete before the retrospective.', points: null },
        ],
      },
    ],
  },
];

// ─── MAIN// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\nKo Japanese Dining — Sprint 2 Ticket Creator');
  console.log('=================================================\n');

  const issueTypes = await getIssueTypeIds();
  await delay(500);

  const epicTypeId  = issueTypes['Epic'];
  const storyTypeId = issueTypes['Story'];
  const taskTypeId  = issueTypes['Subtask'] || issueTypes['Sub-task'] || issueTypes['Task'];

  if (!epicTypeId)  throw new Error('Could not find Epic issue type.');
  if (!storyTypeId) throw new Error('Could not find Story issue type.');
  if (!taskTypeId)  throw new Error('Could not find Task/Subtask issue type.');

  // Get Sprint 2 ID
  const sprintId = await getSprint2Id();

  // Get existing epics from Sprint 1
  const existingEpics = await getExistingEpics();
  await delay(500);

  let epicCount = 0, storyCount = 0, taskCount = 0;
  const sprint2Keys = [];

  for (const epicData of SPRINT2_BACKLOG) {
    let epicKey;

    if (!epicData.newEpic && existingEpics[epicData.epicName]) {
      // Link to existing Sprint 1 epic
      epicKey = existingEpics[epicData.epicName];
      console.log(`\nLinking to existing Epic: "${epicData.epicName}" (${epicKey})`);
    } else {
      // Create a new epic
      console.log(`\nCreating new Epic: "${epicData.epicName}"`);
      epicKey = await createIssue({
        summary:     epicData.epicName,
        description: `Epic covering all work related to: ${epicData.epicName}`,
        issueTypeId: epicTypeId,
      });
      console.log(`   ${epicKey}`);
      epicCount++;
      sprint2Keys.push(epicKey);
      await delay(400);
    }

    for (const storyData of epicData.stories) {
      console.log(`\n   STORY: "${storyData.summary}"`);

      const storyKey = await createIssue({
        summary:     storyData.summary,
        description: storyData.description,
        issueTypeId: storyTypeId,
        parentKey:   epicKey,
        storyPoints: storyData.points,
      });
      console.log(`      ${storyKey}`);
      storyCount++;
      sprint2Keys.push(storyKey);
      await delay(400);

      for (const taskData of storyData.tasks) {
        const taskKey = await createIssue({
          summary:     taskData.summary,
          description: taskData.description,
          issueTypeId: taskTypeId,
          parentKey:   storyKey,
          storyPoints: taskData.points,
        });
        console.log(`         ${taskKey}: ${taskData.summary}`);
        taskCount++;
        sprint2Keys.push(taskKey);
        await delay(300);
      }
    }
  }

  // Move all Sprint 2 tickets to Sprint 2
  if (sprintId && sprint2Keys.length > 0) {
    console.log(`\nMoving ${sprint2Keys.length} tickets to Sprint 2...`);
    await moveToSprint(sprintId, sprint2Keys);
    console.log('Sprint 2 tickets assigned!');
  }

  console.log('\n=================================================');
  console.log('Sprint 2 backlog created!');
  console.log(`   New Epics created:   ${epicCount}`);
  console.log(`   Stories created:     ${storyCount}`);
  console.log(`   Tasks created:       ${taskCount}`);
  console.log(`   Total new issues:    ${epicCount + storyCount + taskCount}`);
  console.log('\nGo check your Jira board — Sprint 2 is ready!');
  console.log('=================================================\n');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
