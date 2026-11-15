const pa11y = require('pa11y');

(async () => {
  console.log('Running Pa11y accessibility audit against http://127.0.0.1:8000/samples/waas-demo.html...');
  const results = await pa11y('http://127.0.0.1:8000/samples/waas-demo.html', {
    chromeLaunchConfig: {
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--headless=new']
    },
    standard: 'WCAG2AA',
    wait: 1500
  });

  console.log('Pa11y Standard: WCAG 2.2 / 2.1 / 2.0 AA');
  console.log('Total Issues Found:', results.issues.length);
  for (const issue of results.issues) {
    console.log(`[${issue.type.toUpperCase()}] ${issue.code}: ${issue.message} (${issue.selector})`);
  }
  process.exit(results.issues.length > 0 ? 1 : 0);
})().catch(err => {
  console.error('Pa11y Error:', err);
  process.exit(1);
});
