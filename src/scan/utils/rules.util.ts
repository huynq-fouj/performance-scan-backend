import { ScanIssue, ScanRecommendation } from '../entities/scan.entity';

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
