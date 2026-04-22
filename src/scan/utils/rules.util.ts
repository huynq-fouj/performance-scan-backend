import { ScanIssue, ScanRecommendation, AngularInsights } from '../entities/scan.entity';

export function buildInsights(metrics: any): { issues: ScanIssue[], recommendations: ScanRecommendation[] } {
  const issues: ScanIssue[] = [];
  const recommendations: ScanRecommendation[] = [];

  // Prevent failing if metrics are missing
  const { lcp = 0, cls = 0, jsSizeKb = 0, requestCount = 0, tbt = 0 } = metrics || {};

  // Rule LCP
  if (lcp > 2500) {
    issues.push({
      title: 'Largest content load slow',
      description: 'LCP marks the time at which the largest text or image is painted. A fast LCP helps reassure the user that the page is useful.',
      severity: lcp > 4000 ? 'critical' : 'high',
      metric: 'LCP',
      impact: `Current: ${(lcp / 1000).toFixed(1)}s (Target: < 2.5s)`
    });
    recommendations.push({
      title: 'Optimize LCP resource (e.g., preload largest image, defer JS)',
      expectedGain: 'Better perceived load time',
      priority: 'High'
    });
  }

  // Rule CLS
  if (cls > 0.1) {
    issues.push({
      title: 'Layout unstable',
      description: 'Cumulative Layout Shift measures the movement of visible elements within the viewport. Unstable layouts lead to poor user experience.',
      severity: cls > 0.25 ? 'high' : 'medium',
      metric: 'CLS',
      impact: `Current: ${cls.toFixed(2)} (Target: < 0.1)`
    });
    recommendations.push({
      title: 'Set explicit dimensions for images, ads, and iframes',
      expectedGain: 'Stable layout',
      priority: 'High'
    });
  }

  // Rule JS size
  if (jsSizeKb > 500) {
    issues.push({
      title: 'Bundle too large',
      description: 'Large JavaScript bundles delay interactivity and increase main thread blocking time.',
      severity: jsSizeKb > 1000 ? 'high' : 'medium',
      metric: 'JS Size',
      impact: `Current: ${jsSizeKb} KB`
    });
    recommendations.push({
      title: 'Lazy load non-critical modules, split chunks',
      expectedGain: `Reduce JS payload by ~${Math.round(jsSizeKb * 0.3)} KB`,
      priority: 'High'
    });
  }

  // Rule Request count
  if (requestCount > 60) {
    issues.push({
      title: 'Too many requests',
      description: 'A high number of network requests slows down page loading, especially on mobile networks.',
      severity: requestCount > 100 ? 'high' : 'medium',
      metric: 'Requests',
      impact: `Current: ${requestCount} requests`
    });
    recommendations.push({
      title: 'Combine files, use HTTP/2, or inline small critical assets',
      expectedGain: 'Faster page load and less overhead',
      priority: 'Medium'
    });
  }

  // Rule TBT
  if (tbt > 200) {
    issues.push({
      title: 'Main thread blocked',
      description: 'Total Blocking Time measures the total amount of time that a page is blocked from responding to user input.',
      severity: tbt > 600 ? 'critical' : 'high',
      metric: 'TBT',
      impact: `Current: ${tbt}ms (Target: < 200ms)`
    });
    recommendations.push({
      title: 'Reduce JavaScript execution time and break up long tasks',
      expectedGain: 'Better interactivity and responsiveness',
      priority: 'High'
    });
  }

  // Default recommendation if perfect
  if (issues.length === 0) {
    recommendations.push({
      title: 'Keep up the good work!',
      expectedGain: 'Maintain high performance',
      priority: 'Low'
    });
  }

  // Sort issues by severity (critical -> high -> medium -> low)
  const severityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return { issues, recommendations };
}

export function buildAngularInsights(lhr: any, networkRequests: any[]): AngularInsights {
  const insights: AngularInsights = {
    isAngular: false,
  };

  if (!lhr) return insights;

  // 1. Detect Angular Runtime & Version
  const jsLibraries = lhr.audits?.['js-libraries']?.details?.items || [];
  const angularObj = jsLibraries.find((lib: any) => lib.name === 'Angular');
  
  if (angularObj) {
    insights.isAngular = true;
    insights.version = angularObj.version || 'Unknown';
  } else {
    // Fallback: check scripts for polyfills/main
    const hasPolyfills = networkRequests.some(r => r.url.includes('polyfills'));
    const hasMain = networkRequests.some(r => r.url.includes('main'));
    if (hasPolyfills && hasMain) {
      // Possible Angular CSR, but we shouldn't assume it 100%. Let's look for zone.js in polyfills or just rely on lighthouse.
      // Lighthouse wappalyzer is usually very accurate.
    }
  }

  if (!insights.isAngular) return insights;

  // Gather stats
  const scriptRequests = networkRequests.filter(r => r.resourceType === 'Script' || r.url.endsWith('.js'));
  const totalJsSize = scriptRequests.reduce((acc, r) => acc + (r.transferSize || 0), 0);
  
  // 2. Zone.js Present
  // Wappalyzer might list Zone.js separately
  const zoneObj = jsLibraries.find((lib: any) => lib.name.toLowerCase().includes('zone.js'));
  if (zoneObj) {
    insights.zoneJsPresent = true;
  } else {
    // Check if version is < 18, it likely has zone.js. If it has no version, maybe true.
    if (insights.version && insights.version.match(/^(1[0-7]|[0-9])\./)) {
      insights.zoneJsPresent = true;
    } else {
      // Angular >= 18 might be zoneless, default to false or check strictly. We'll default to true unless we know.
      insights.zoneJsPresent = true; 
    }
  }

  // 3. SSR Enabled
  // If main document transferSize < 15KB and JS size is massive, likely no SSR.
  const docRequest = networkRequests.find(r => r.resourceType === 'Document');
  if (docRequest && docRequest.transferSize < 15000 && totalJsSize > 250000) {
    insights.ssrEnabled = false;
  } else if (docRequest && docRequest.transferSize > 30000) {
    insights.ssrEnabled = true; // Substantial HTML implies SSR
  }

  // 4. Heavy Vendor
  const heaviestScript = Math.max(...scriptRequests.map(r => r.transferSize || 0));
  if (heaviestScript > 500000) { // > 500KB
    insights.heavyVendor = true;
  } else {
    insights.heavyVendor = false;
  }

  // 5. Lazy Routes Suspicion
  // If there are very few scripts but the bundle is large, they aren't using lazy loaded chunks.
  if (scriptRequests.length <= 4 && totalJsSize > 500000) {
    insights.hasLazyRoutes = false;
  } else if (scriptRequests.length > 5) {
    // If they have chunk-*.js or multiple hashes.
    insights.hasLazyRoutes = true;
  }

  return insights;
}
