import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Scan, ScanDocument } from './entities/scan.entity';
import { Project, ProjectDocument } from '../projects/entities/project.entity';
import { Logger } from '@nestjs/common';

@Processor('lighthouse-scan')
export class ScanProcessor extends WorkerHost {
  private readonly logger = new Logger(ScanProcessor.name);

  constructor(
    @InjectModel(Scan.name) private scanModel: Model<ScanDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {
    super();
  }

  async process(job: Job<{ scanId: string; url: string; projectId: string; device?: 'mobile' | 'desktop' }>): Promise<any> {
    const { scanId, url, projectId, device = 'mobile' } = job.data;
    this.logger.log(`Starting scan job for scanId: ${scanId}, url: ${url}, device: ${device}`);

    try {
      const project = await this.projectModel.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // 1. Pre-launch check: Has it been cancelled already?
      const initialScan = await this.scanModel.findById(scanId);
      if (!initialScan || initialScan.status === 'failed') {
        this.logger.warn(`Scan ${scanId} was cancelled before starting processor. Aborting.`);
        return { cancelled: true };
      }

      await this.scanModel.findByIdAndUpdate(scanId, { status: 'running' });

      // Dynamically import ESM modules
      const { default: lighthouse } = await import('lighthouse');
      const chromeLauncher = await import('chrome-launcher');

      const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
      
      const categories = ['performance'];
      if (project.includeSeo) categories.push('seo');
      if (project.includeAccessibility) categories.push('accessibility');
      if (project.includeBestPractices) categories.push('best-practices');

      const flags = {
        logLevel: 'error' as const,
        output: 'json' as const,
        onlyCategories: categories,
        port: chrome.port,
      };

      let config: any;

      if (device === 'desktop') {
        const { default: desktopConfig } = await import('lighthouse/core/config/desktop-config.js');
        config = {
          extends: 'lighthouse:default',
          settings: {
            ...desktopConfig.settings,
            formFactor: 'desktop' as const,
            screenEmulation: {
              mobile: false,
              width: 1350,
              height: 940,
              deviceScaleFactor: 1,
              disabled: false,
            },
            emulatedUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            throttlingMethod: 'simulate' as const,
            throttling: {
              rttMs: 40,
              throughputKbps: 10240,
              requestLatencyMs: 0,
              downloadThroughputKbps: 0,
              uploadThroughputKbps: 0,
              cpuSlowdownMultiplier: 1,
            },
          }
        };
      } else {
        // Default Mobile Configuration
        config = {
          extends: 'lighthouse:default',
          settings: {
            formFactor: 'mobile' as const,
            // Uses standard Lighthouse mobile throttling (Simulated 4G)
          }
        };
      }

      try {
        this.logger.log(`Chrome launched on port ${chrome.port}, running Lighthouse (${device.toUpperCase()} mode)...`);
        const runnerResult = await lighthouse(url, flags, config);
        
        this.logger.log(`Lighthouse scan completed, killing chrome...`);
        await chrome.kill();

        // 2. Post-scan check: Did the user click Stop while we were scanning?
        const currentScan = await this.scanModel.findById(scanId);
        if (!currentScan || currentScan.status === 'failed') {
          this.logger.warn(`Scan ${scanId} was cancelled during execution. Results will NOT be saved.`);
          return { cancelled: true };
        }

        if (!runnerResult) {
          throw new Error('Lighthouse returned empty result');
        }

        const lhr = runnerResult.lhr;
        const fcp = lhr.audits['first-contentful-paint']?.numericValue || 0;
        const lcp = lhr.audits['largest-contentful-paint']?.numericValue || 0;
        const cls = lhr.audits['cumulative-layout-shift']?.numericValue || 0;
        const tbt = lhr.audits['total-blocking-time']?.numericValue || 0;
        const inp = lhr.audits['interactive']?.numericValue || 0;
        const speedIndex = lhr.audits['speed-index']?.numericValue || 0;
        
        const performanceScore = Math.round((lhr.categories.performance?.score || 0) * 100);
        const accessibilityScore = lhr.categories.accessibility ? Math.round((lhr.categories.accessibility.score || 0) * 100) : undefined;
        const bestPracticesScore = lhr.categories['best-practices'] ? Math.round((lhr.categories['best-practices'].score || 0) * 100) : undefined;
        const seoScore = lhr.categories.seo ? Math.round((lhr.categories.seo.score || 0) * 100) : undefined;

        // JS / CSS sizes approximation
        const networkRequests = (lhr.audits['network-requests']?.details as any)?.items || [];
        let jsSize = 0;
        let cssSize = 0;
        networkRequests.forEach((req: any) => {
          if (req.resourceType === 'Script') {
            jsSize += req.transferSize || 0;
          } else if (req.resourceType === 'Stylesheet') {
            cssSize += req.transferSize || 0;
          }
        });

        const requestCount = networkRequests.length;
        const screenshot = (lhr.audits['final-screenshot']?.details as any)?.data;

        // Update Scan
        const completedAt = new Date();
        await this.scanModel.findByIdAndUpdate(scanId, {
          status: 'success',
          fcp, lcp, cls, tbt, inp, speedIndex,
          performanceScore, accessibilityScore, bestPracticesScore, seoScore,
          jsSizeKb: Math.round(jsSize / 1024),
          cssSizeKb: Math.round(cssSize / 1024),
          requestCount,
          completedAt,
        });

        // Update Project
        await this.projectModel.findByIdAndUpdate(projectId, {
          lastScanAt: completedAt,
          lastScore: performanceScore,
          lastAccessibilityScore: accessibilityScore,
          lastBestPracticesScore: bestPracticesScore,
          lastSeoScore: seoScore,
          lastScreenshot: screenshot,
        });

        this.logger.log(`Successfully completed and saved scan for scanId: ${scanId}`);
        return { success: true, performanceScore };

      } catch (err) {
        await chrome.kill();
        throw err;
      }
    } catch (error: any) {
      // Final catch: only update to failed if we haven't already marked it as such
      const lastCheck = await this.scanModel.findById(scanId);
      if (lastCheck && lastCheck.status !== 'failed') {
        this.logger.error(`Failed scan job for scanId: ${scanId}`, error.stack);
        await this.scanModel.findByIdAndUpdate(scanId, {
          status: 'failed',
          errorMessage: error.message || 'Unknown error occurred during Lighthouse scan',
          completedAt: new Date(),
        });
      }
      throw error;
    }
  }
}
