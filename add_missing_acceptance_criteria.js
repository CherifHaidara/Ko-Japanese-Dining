/**
 * Adds acceptance criteria to the remaining Sprint 2 stories
 * Usage: JIRA_API_TOKEN=your_token_here node add_missing_acceptance_criteria.js
 */

const https = require('https');

const CONFIG = {
  domain:   'cmsc447-ocr-proj.atlassian.net',
  email:    'mhaidar2@umbc.edu',
  apiToken: process.env.JIRA_API_TOKEN,
};

if (!CONFIG.apiToken) {
  console.error('Run with: JIRA_API_TOKEN=your_token_here node add_missing_acceptance_criteria.js');
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
          reject(new Error(`[${res.statusCode}] ${data}`));
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
          content: [{ type: 'paragraph', content: [{ type: 'text', text: criterion }] }],
        })),
      },
    ],
  };
}

const STORIES = [
  {
    key: 'RG3KJDA-53',
    summary: 'Account Management',
    userStory: 'As a customer, I want to manage my account so that I can keep my personal information and preferences up to date.',
    acceptanceCriteria: [
      'Customer can view their profile including name, email, and preferences',
      'Customer can update their first name, last name, and preferences',
      'Customer can upload a profile picture',
      'Changes are saved and reflected immediately after submission',
      'Customer can view their order history from the profile page',
      'Session expires after a period of inactivity and the customer is redirected to the login page',
      'Invalid or expired tokens result in automatic logout',
    ],
  },
  {
    key: 'RG3KJDA-64',
    summary: 'Add Items to Cart',
    userStory: 'As a customer, I want to add items to my cart so that I can collect my order before checking out.',
    acceptanceCriteria: [
      'Customer can add any menu item to the cart by clicking "Add to Cart"',
      'Cart displays the item name, quantity, and price for each added item',
      'Customer can increase or decrease the quantity of an item in the cart',
      'Customer can remove an item from the cart',
      'Cart total updates automatically when items are added, removed, or quantity is changed',
      'Cart persists during the session so items are not lost when navigating between pages',
      'Cart displays a count badge showing the total number of items',
    ],
  },
  {
    key: 'RG3KJDA-68',
    summary: 'Place a Pickup Order',
    userStory: 'As a customer, I want to place a pickup order online so that I can have my food ready when I arrive at the restaurant.',
    acceptanceCriteria: [
      'Customer can proceed to checkout from the cart',
      'Checkout page displays an order summary with all items, quantities, and prices',
      'Customer can enter their name, email, and preferred pickup time',
      'Customer can enter payment information to complete the order',
      'Order is submitted successfully and an order confirmation page is shown with the order number',
      'A confirmation email is sent to the customer after successful order placement',
      'Order is recorded in the database and visible in the admin dashboard',
    ],
  },
  {
    key: 'RG3KJDA-73',
    summary: 'View Order Status',
    userStory: 'As a customer, I want to view the status of my order so that I know when my food will be ready for pickup.',
    acceptanceCriteria: [
      'Customer can navigate to an order status page using their order number',
      'Order status page displays the current status: pending, preparing, ready, or completed',
      'Status is shown as a visual step indicator so the customer can see progress',
      'Page auto-refreshes periodically so the customer sees status updates without manual reload',
      'Customer receives an email notification when their order status changes to ready',
      'Order details including items and total are visible on the status page',
    ],
  },
  {
    key: 'RG3KJDA-81',
    summary: 'Admin Menu Management',
    userStory: 'As a restaurant admin, I want to manage the menu so that I can keep menu items, prices, and availability up to date.',
    acceptanceCriteria: [
      'Admin can view all menu items organized by section and menu type (Dinner, Lunch, Brunch)',
      'Admin can add a new menu item with name, description, price, section, and image',
      'Admin can edit an existing menu item\'s details',
      'Admin can toggle a menu item as featured or unfeatured',
      'Admin can delete a menu item',
      'Changes are reflected immediately on the public-facing menu page',
      'Admin can upload an image for a menu item',
    ],
  },
  {
    key: 'RG3KJDA-91',
    summary: 'Make a Reservation',
    userStory: 'As a customer, I want to make a reservation so that I can guarantee a table at the restaurant for my preferred date and time.',
    acceptanceCriteria: [
      'Customer can access the reservation form from the navbar or home page',
      'Reservation form collects date, time, party size, name, email, and phone number',
      'Customer receives an error message if required fields are missing',
      'Reservation is submitted successfully and a confirmation page is shown',
      'A confirmation email is sent to the customer with reservation details',
      'Reservation is saved in the database and visible in the admin dashboard',
      'Customer cannot book a reservation for a past date or time',
    ],
  },
  {
    key: 'RG3KJDA-96',
    summary: 'Special Dining Reservation',
    userStory: 'As a customer, I want to request a special dining experience so that I can celebrate a special occasion at the restaurant.',
    acceptanceCriteria: [
      'Customer can indicate a special occasion type (birthday, anniversary, etc.) during reservation',
      'Customer can add special requests or notes to their reservation',
      'Special requests are saved with the reservation and visible to admin',
      'Admin can view and manage special dining requests in the dashboard',
      'Customer receives confirmation that their special request was received',
    ],
  },
  {
    key: 'RG3KJDA-99',
    summary: 'Manage My Reservation',
    userStory: 'As a customer, I want to view and manage my reservations so that I can make changes or cancel if my plans change.',
    acceptanceCriteria: [
      'Customer can view a list of all their upcoming and past reservations',
      'Each reservation displays date, time, party size, and current status',
      'Customer can cancel an upcoming reservation',
      'Cancelled reservation status is updated immediately in the UI and database',
      'Customer receives a confirmation when a reservation is successfully cancelled',
      'Past reservations are clearly distinguished from upcoming ones',
    ],
  },
  {
    key: 'RG3KJDA-105',
    summary: 'Earn Loyalty Points',
    userStory: 'As a customer, I want to earn loyalty points when I place orders so that I am rewarded for being a returning customer.',
    acceptanceCriteria: [
      'Customer earns loyalty points automatically after a successful order is placed',
      'Points are calculated based on the order total',
      'Points are added to the customer\'s account and stored in the database',
      'Customer can see their updated points balance after placing an order',
      'Points are only awarded to logged-in customers',
    ],
  },
  {
    key: 'RG3KJDA-108',
    summary: 'Redeem Rewards',
    userStory: 'As a customer, I want to redeem my loyalty points for rewards so that I can benefit from my accumulated points.',
    acceptanceCriteria: [
      'Customer can view available rewards and the points required to redeem them',
      'Customer can redeem points for a discount on their current order at checkout',
      'Points balance is reduced by the correct amount after redemption',
      'Customer cannot redeem more points than their current balance',
      'Redeemed discount is clearly shown in the order total at checkout',
      'Redemption is recorded in the database',
    ],
  },
  {
    key: 'RG3KJDA-111',
    summary: 'View Loyalty Balance',
    userStory: 'As a customer, I want to view my loyalty points balance so that I know how many points I have available to redeem.',
    acceptanceCriteria: [
      'Customer can see their current points balance on their profile/account page',
      'Points balance is accurate and reflects all earned and redeemed points',
      'Customer can see a history of points earned and redeemed',
      'Balance updates immediately after earning or redeeming points',
      'Points balance is only visible to logged-in customers',
    ],
  },
];

async function main() {
  console.log('\nAdding acceptance criteria to remaining Sprint 2 stories...');
  console.log('=============================================================\n');

  let updated = 0;

  for (const story of STORIES) {
    process.stdout.write(`Updating ${story.key} — ${story.summary}... `);
    try {
      await jiraRequest('PUT', `/issue/${story.key}`, {
        fields: { description: makeDescription(story.userStory, story.acceptanceCriteria) },
      });
      console.log('done');
      updated++;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
    await delay(400);
  }

  console.log('\n=============================================================');
  console.log(`Updated: ${updated} / ${STORIES.length} stories`);
  console.log('=============================================================\n');
}

main().catch(err => console.error('Error:', err.message));
