import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  async process(job: Job<{ scanId: string; url: string; projectId: string }>): Promise<any> {
    const { scanId, url, projectId } = job.data;
    this.logger.log(`Starting scan job for scanId: ${scanId}, url: ${url}`);

    try {
      const project = await this.projectModel.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
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

      const options = {
        logLevel: 'error' as const,
        output: 'json' as const,
        onlyCategories: categories,
        port: chrome.port,
      };

      this.logger.log(`Chrome launched on port ${chrome.port}, running Lighthouse with categories: ${categories.join(', ')}...`);
      const runnerResult = await lighthouse(url, options);
      
      this.logger.log(`Lighthouse scan completed, killing chrome...`);
      await chrome.kill();

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

      // JS / CSS sizes approximation from network requests
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
        fcp,
        lcp,
        cls,
        tbt,
        inp,
        speedIndex,
        performanceScore,
        accessibilityScore,
        bestPracticesScore,
        seoScore,
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
    } catch (error: any) {
      this.logger.error(`Failed scan job for scanId: ${scanId}`, error.stack);
      await this.scanModel.findByIdAndUpdate(scanId, {
        status: 'failed',
        errorMessage: error.message || 'Unknown error occurred during Lighthouse scan',
        completedAt: new Date(),
      });
      throw error;
    }
  }
}
