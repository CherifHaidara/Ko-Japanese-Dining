/**
 * Lists all Sprint 2 stories and tasks from Jira so we can match them correctly.
 * Usage: JIRA_API_TOKEN=your_token_here node list_jira_stories.js
 */

const https = require('https');

const CONFIG = {
  domain:     'cmsc447-ocr-proj.atlassian.net',
  email:      'mhaidar2@umbc.edu',
  apiToken:   process.env.JIRA_API_TOKEN,
  projectKey: 'RG3KJDA',
};

if (!CONFIG.apiToken) {
  console.error('Run with: JIRA_API_TOKEN=your_token_here node list_jira_stories.js');
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
        if (!data.trim()) return resolve({});
        try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const result = await jiraRequest('POST', '/search/jql', {
    jql: `project=${CONFIG.projectKey} AND sprint in openSprints() ORDER BY issuetype ASC`,
    fields: ['summary', 'issuetype', 'parent'],
    maxResults: 200,
  });

  const issues = result.issues || [];
  console.log(`\nFound ${issues.length} issues in current sprint:\n`);

  for (const issue of issues) {
    const type = issue.fields.issuetype.name.padEnd(10);
    console.log(`${issue.key.padEnd(16)} [${type}] ${issue.fields.summary}`);
  }
}

main().catch(err => console.error('Error:', err.message));
