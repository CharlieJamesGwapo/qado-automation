# QADO Medisource Automation Suite — Design Spec

## Overview

End-to-end automation scripts for the QADO Medisource home health application (`qado.medisource.com`). Covers the complete Patient Dashboard lifecycle (Stage 1) and patient processes (Stage 2).

**Framework:** Playwright + TypeScript
**Pattern:** Page Object Model (POM)
**Target URL:** https://qado.medisource.com
**Test Account:** ojt3@geeksnest

## Goals

1. Automate all Stage 1 Patient Dashboard tasks (add patient through nursing care plan)
2. Automate all Stage 2 Patient Processes (transfer, resumption, recertify, discharge, follow-up)
3. All form fields must be filled with realistic data
4. Output committed to GitHub repository: `CharlieJamesGwapo/qado-automation`

## Architecture

### Project Structure

```
qado-automation/
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── .env                        # Credentials (gitignored)
├── .env.example
├── src/
│   ├── pages/                  # Page Object Models
│   │   ├── LoginPage.ts
│   │   ├── AddPatientPage.ts
│   │   ├── PatientManagerPage.ts
│   │   ├── PatientDashboardPage.ts
│   │   ├── ScheduleVisitPage.ts
│   │   ├── VisitTaskPage.ts
│   │   ├── OasisSOCPage.ts
│   │   ├── MDOrdersPage.ts
│   │   ├── CommunicationPage.ts
│   │   ├── AdverseEventsPage.ts
│   │   ├── MedicationPage.ts
│   │   ├── WoundManagementPage.ts
│   │   ├── MiscellaneousPage.ts
│   │   └── NursingCarePlanPage.ts
│   ├── fixtures/
│   │   └── test-fixtures.ts
│   ├── data/
│   │   └── test-data.ts
│   └── helpers/
│       └── utils.ts
├── tests/
│   ├── stage1/
│   │   ├── 01-add-patient.spec.ts
│   │   ├── 02-search-patient.spec.ts
│   │   ├── 03-schedule-visit.spec.ts
│   │   ├── 04-complete-visit-task.spec.ts
│   │   ├── 05-complete-oasis-soc.spec.ts
│   │   ├── 06-md-orders.spec.ts
│   │   ├── 07-communication-note.spec.ts
│   │   ├── 08-adverse-events.spec.ts
│   │   ├── 09-medication-profile.spec.ts
│   │   ├── 10-wound-management.spec.ts
│   │   ├── 11-miscellaneous.spec.ts
│   │   └── 12-nursing-care-plan.spec.ts
│   └── stage2/
│       ├── 01-transfer-patient.spec.ts
│       ├── 02-resumption-of-care.spec.ts
│       ├── 03-recertify-patient.spec.ts
│       ├── 04-discharge-patient.spec.ts
│       └── 05-follow-up-patient.spec.ts
```

### Design Decisions

#### 1. Page Object Model (POM)
Each page/form in the application gets its own TypeScript class encapsulating:
- Locators for all interactive elements
- Methods for actions (fill form, click buttons, navigate)
- Assertions for verifying state

This ensures that when the UI changes, only one file needs updating.

#### 2. Sequential Test Execution
Tests must run in strict order because later tests depend on state created by earlier tests:
- Patient must exist before searching
- Patient must be found before scheduling visits
- Visit must exist before completing it
- etc.

Enforced via `fullyParallel: false` in Playwright config and numbered file prefixes.

#### 3. Shared Authentication State
- Login is performed once in a global setup
- Session/cookies saved to `auth/session.json`
- All subsequent tests reuse this state via Playwright's `storageState`
- Avoids repeated login overhead

#### 4. Test Data Generation
Using `@faker-js/faker` to generate realistic data for all form fields:
- Patient demographics (name, DOB, SSN, address, phone)
- Medical data (diagnoses, medications, vitals)
- Clinical notes and descriptions
- Dates within valid ranges

A shared `test-data.ts` module provides consistent data generators that can be reused across tests. Patient data created in test 01 is persisted to a JSON file so subsequent tests can reference the same patient.

#### 5. Environment Configuration
```
BASE_URL=https://qado.medisource.com
USERNAME=ojt3@geeksnest
PASSWORD=<stored in .env, gitignored>
HEADLESS=false
```

#### 6. Error Handling & Debugging
- Screenshots captured automatically on test failure
- Video recording available (configurable)
- Trace files generated for failed tests (Playwright Trace Viewer)
- Explicit waits with meaningful timeout messages

## Test Specifications

### Stage 1: Completing Patient Dashboard

#### Test 01 — Add Patient
1. Login to application
2. Navigate to Add Patient
3. Complete Pre-admission Form with all fields:
   - Patient demographics (name, DOB, gender, SSN)
   - Address and contact information
   - Insurance information
   - Emergency contacts
   - Referral source
   - All other required/optional fields
4. Save the form
5. Verify patient was created successfully

#### Test 02 — Search Patient
1. Navigate to Patient Manager
2. Search for the patient created in Test 01
3. Verify patient appears in search results
4. Open Patient Dashboard
5. Verify dashboard loads with correct patient info

#### Test 03 — Schedule Visit
1. From Patient Dashboard, navigate to scheduling
2. Add RN Visit Task
3. Fill in visit details (date, time, clinician, visit type)
4. Create the visit
5. Verify visit appears in schedule

#### Test 04 — Complete Patient Visit Task
1. Open the created RN Visit task
2. Complete all form fields:
   - Visit details
   - Clinical assessments
   - Vital signs
   - Notes/observations
3. Save the completed form
4. Verify task status changes to complete

#### Test 05 — Complete Patient OASIS SOC
Complete all 10 OASIS sections sequentially:
1. Administrative
2. Diagnosis/Health Conditions
3. Vital Signs/Sensory
4. Cognitive/Mood/Behavior/Neuro
5. Integumentary
6. Pulmonary/Cardiovascular
7. Nutrition/Elimination
8. Musculoskeletal, Functional Status & Abilities
9. Medications/Treatment
10. Care Management/Goals

Each section: fill all fields, save, verify, proceed to next.

#### Test 06 — Create and Complete MD Order
1. Navigate to MD Orders Tab
2. Create Physician Order
3. Complete all form fields (physician, order details, medications, instructions)
4. Save
5. Verify order created

#### Test 07 — Create and Complete Communication Note
1. Navigate to Communication Tab
2. Create Communication Note
3. Complete all fields (type, subject, recipients, message body)
4. Save
5. Verify note created

#### Test 08 — Create and Complete Adverse Events
1. Navigate to Adverse Events Tab
2. Create Patient Incident Report
3. Complete all fields (incident type, date, description, severity, actions taken)
4. Save
5. Verify report created

#### Test 09 — Create and Complete Medication Profile
1. Navigate to Medication Tab
2. Edit Medication Profile
3. Complete all fields (medications, dosages, frequency, prescriber, pharmacy)
4. Save
5. Verify profile updated

#### Test 10 — Create and Complete Wound Management
1. Navigate to Wound Management Tab
2. Pin wound location on body diagram
3. Complete wound assessment form (type, size, stage, treatment, dressing)
4. Save
5. Verify wound record created

#### Test 11 — Create and Complete Miscellaneous
1. Navigate to Miscellaneous Tab
2. Create New entry
3. Complete all form fields
4. Save
5. Verify entry created

#### Test 12 — Create and Complete Nursing Care Plan
1. Navigate to Nursing Care Plan Tab
2. Create New care plan
3. Complete all fields (problems, goals, interventions, target dates)
4. Save
5. Verify care plan created

### Stage 2: Patient Processes

#### Test 13 — Transfer a Patient
1. Initiate patient transfer process
2. Complete transfer form (reason, destination, transfer date)
3. Submit
4. Verify patient status reflects transfer

#### Test 14 — Resumption of Care
1. Initiate resumption of care for transferred patient
2. Complete resumption form
3. Submit
4. Verify patient status is active again

#### Test 15 — Recertify a Patient
1. Initiate recertification process
2. Complete recertification form (new certification period, physician approval)
3. Submit
4. Verify new certification period

#### Test 16 — Discharge a Patient
1. Initiate discharge process
2. Complete discharge form (reason, date, discharge summary)
3. Submit
4. Verify patient status is discharged

#### Test 17 — Follow-up Patient
1. Initiate follow-up for discharged patient
2. Complete follow-up form
3. Submit
4. Verify follow-up recorded

## Dependencies

- `@playwright/test` — test framework and browser automation
- `@faker-js/faker` — realistic test data generation
- `dotenv` — environment variable management
- `typescript` — type safety

## Running Tests

```bash
# Run all tests
npx playwright test

# Run Stage 1 only
npx playwright test tests/stage1/

# Run Stage 2 only
npx playwright test tests/stage2/

# Run specific test
npx playwright test tests/stage1/01-add-patient.spec.ts

# Run in headed mode (watch)
npx playwright test --headed

# Run with debug
npx playwright test --debug
```

## Notes

- Selectors will be determined by inspecting the live application during implementation. The app may use Angular, React, or a custom framework — selectors will be adapted accordingly.
- OASIS SOC is the most complex test (10 sections with many clinical fields). This test will be the longest and may need sub-sectioned page objects.
- Stage 2 tests depend on Stage 1 completing successfully (patient must have full dashboard data).
