import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AddPatientPage } from '../pages/AddPatientPage';
import { PatientManagerPage } from '../pages/PatientManagerPage';
import { PatientDashboardPage } from '../pages/PatientDashboardPage';

type TestFixtures = {
  loginPage: LoginPage;
  addPatientPage: AddPatientPage;
  patientManagerPage: PatientManagerPage;
  patientDashboardPage: PatientDashboardPage;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  addPatientPage: async ({ page }, use) => {
    await use(new AddPatientPage(page));
  },
  patientManagerPage: async ({ page }, use) => {
    await use(new PatientManagerPage(page));
  },
  patientDashboardPage: async ({ page }, use) => {
    await use(new PatientDashboardPage(page));
  },
});

export { expect } from '@playwright/test';
