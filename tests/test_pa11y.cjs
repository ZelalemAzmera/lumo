const pa11y = require('pa11y');

(async () => {
  console.log('Running Pa11y accessibility audit against http://127.0.0.1:8000/samples/test-harness.html...');
  const results = await pa11y('http://127.0.0.1:8000/samples/test-harness.html', {
    chromeLaunchConfig: {
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    standard: 'WCAG2AA',
    wait: 1000
  });

  console.log('Pa11y Standard:', results.standard);
  console.log('Total Issues Found:', results.issues.length);
  for (const issue of results.issues) {
    console.log(`[${issue.type.toUpperCase()}] ${issue.code}: ${issue.message} (${issue.selector})`);
  }
  process.exit(results.issues.length > 0 ? 1 : 0);
})().catch(err => {
  console.error('Pa11y Error:', err);
  process.exit(1);
});
