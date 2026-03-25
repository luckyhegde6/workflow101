import { test as base } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';
import { ConfigPage } from './pages/ConfigPage';
import { CronPage } from './pages/CronPage';
import { DocsPage } from './pages/DocsPage';

export interface Pages {
  dashboard: DashboardPage;
  config: ConfigPage;
  cron: CronPage;
  docs: DocsPage;
}

export const test = base.extend<Pages>({
  dashboard: async ({ page }, use) => {
    const dashboard = new DashboardPage(page);
    await use(dashboard);
  },
  config: async ({ page }, use) => {
    const config = new ConfigPage(page);
    await use(config);
  },
  cron: async ({ page }, use) => {
    const cron = new CronPage(page);
    await use(cron);
  },
  docs: async ({ page }, use) => {
    const docs = new DocsPage(page);
    await use(docs);
  },
});

export { expect } from '@playwright/test';
