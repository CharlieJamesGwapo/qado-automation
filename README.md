# QADO Medisource Automation Suite

End-to-end automation tests for the QADO Medisource home health application using Playwright + TypeScript.

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
# Edit .env with your credentials
```

## Running Tests

```bash
# Run all tests
npm test

# Run Stage 1 only (Patient Dashboard)
npm run test:stage1

# Run Stage 2 only (Patient Processes)
npm run test:stage2

# Run in headed mode (see the browser)
npm run test:headed

# Run with debug mode
npm run test:debug

# View HTML report
npm run report
```

## Project Structure

```
src/
  pages/          # Page Object Models
  helpers/        # Utility functions
  data/           # Test data generators and state management
  fixtures/       # Test fixtures and auth setup
tests/
  stage1/         # Patient Dashboard tests (01-12)
  stage2/         # Patient Process tests (01-05)
```

## Test Coverage

### Stage 1: Patient Dashboard
1. Add Patient (Pre-admission Form)
2. Search Patient
3. Schedule Visit
4. Complete Visit Task
5. Complete OASIS SOC (10 sections)
6. MD Orders
7. Communication Note
8. Adverse Events
9. Medication Profile
10. Wound Management
11. Miscellaneous
12. Nursing Care Plan

### Stage 2: Patient Processes
1. Transfer Patient
2. Resumption of Care
3. Recertify Patient
4. Discharge Patient
5. Follow-up Patient
