const { test: base, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { AddPatientPage } = require('../pages/AddPatientPage');
const { PatientManagerPage } = require('../pages/PatientManagerPage');
const { PatientDashboardPage } = require('../pages/PatientDashboardPage');

const test = base.extend({
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

module.exports = { test, expect };
