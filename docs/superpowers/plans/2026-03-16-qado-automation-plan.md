# QADO Automation Suite Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete E2E automation suite for QADO Medisource covering patient dashboard lifecycle and patient processes.

**Architecture:** Playwright + TypeScript with Page Object Model. Sequential test execution with shared auth state. Faker-based test data. Patient ID persisted between tests via JSON file.

**Tech Stack:** @playwright/test, @faker-js/faker, dotenv, TypeScript

---

## Chunk 1: Project Foundation

### Task 1: Project Configuration

**Files:**
- Create: `playwright.config.ts`
- Create: `tsconfig.json`
- Create: `.env`
- Create: `.env.example`
- Create: `.gitignore`
- Modify: `package.json`

- [ ] **Step 1: Create .gitignore**
- [ ] **Step 2: Create .env and .env.example**
- [ ] **Step 3: Create tsconfig.json**
- [ ] **Step 4: Create playwright.config.ts**
- [ ] **Step 5: Update package.json scripts**
- [ ] **Step 6: Commit**

### Task 2: Utility Helpers and Test Data

**Files:**
- Create: `src/helpers/utils.ts`
- Create: `src/data/test-data.ts`
- Create: `src/data/state.ts`

- [ ] **Step 1: Create utils.ts** (wait helpers, date formatters, select helpers for AngularJS dropdowns)
- [ ] **Step 2: Create test-data.ts** (faker-based generators for patient demographics, addresses, clinical data)
- [ ] **Step 3: Create state.ts** (shared state persistence for patient/episode IDs between tests)
- [ ] **Step 4: Commit**

### Task 3: Login Page Object and Auth Setup

**Files:**
- Create: `src/pages/LoginPage.ts`
- Create: `src/fixtures/auth.setup.ts`
- Create: `src/fixtures/test-fixtures.ts`

- [ ] **Step 1: Create LoginPage.ts** (locators: #loginemail, #loginpassword, button[type=submit])
- [ ] **Step 2: Create auth.setup.ts** (global setup that logs in and saves storageState)
- [ ] **Step 3: Create test-fixtures.ts** (custom test fixture with authenticated page)
- [ ] **Step 4: Commit**

## Chunk 2: Add Patient and Search Patient

### Task 4: Add Patient Page Object

**Files:**
- Create: `src/pages/AddPatientPage.ts`

Key form fields discovered from inspection:
- Referral date: `#refDate`, Pre-admission date: `#pre_admission_date`
- MRN: `#takenmrn` (with auto-assign checkbox `#medRecNumberAssign`)
- Insurance: `#primary_insurance`, `#secondary_insurance` (select dropdowns)
- Patient info: `#last_name`, `#first_name`, `#mi`, `#suffix`, `#birthdate`
- Gender: radio name=728 (Male/Female)
- Marital status: `#marital_status`, Ethnicity: `#ethnicities`
- SSN: `#ssNumber`
- Main address: `#main_line1`, `#main_line2`, `#main_street`, `#main_city`, `#main_state`, `#main_zipcode`
- Phone: `input[name=phone]`, Other phone: `input[name=other_phone]`, Email: `#main_email`
- Service address: `#service_line1`, etc. (same pattern with service_ prefix)
- Living situation: radios name=739,741,743 + assistance radios name=745-753
- Caregiver: `#ls_caregiver`, `#ls_caregiver_phone`
- Emergency contact: `#ec_name`, `#ec_relationship`, `#ec_phone`, `#ec_other_phone`
- Physicians: `#physician_attending`, `#physician_primary` (select with searchable filter)
- Admission: `#admissiontype`, `#point_of_origin`
- Referral: `#referral_type`, `#referral_source_id`, `#referral_contact_person`, `#referral_phone`
- Hospital: `#hospital_id`, `#admit_date`, `#discharge_date`
- Diagnosis: `#primary_diagnosis`, `#diagnosis_surgery`, NKA checkbox `#diagnosis_nka`
- M0080: radio name=M0080 (SN/PT/ST/OT)
- Clinical staff: `#cs_rn`, `#cs_lvn`, `#cs_pt`, `#cs_st`, `#cs_ot`, `#cs_chha`, `#cs_cm`, `#cs_qam`
- Save button: `button:has-text("Save")` with ng-click

- [ ] **Step 1: Create AddPatientPage.ts with all locators and fill methods**
- [ ] **Step 2: Commit**

### Task 5: Add Patient Test

**Files:**
- Create: `tests/stage1/01-add-patient.spec.ts`

- [ ] **Step 1: Write test that navigates to /patient, fills all fields, saves**
- [ ] **Step 2: Run test against live app to verify**
- [ ] **Step 3: Commit**

### Task 6: Patient Manager Page Object and Search Test

**Files:**
- Create: `src/pages/PatientManagerPage.ts`
- Create: `tests/stage1/02-search-patient.spec.ts`

Patient list at `/patients/admitted` with search input `ng-model=manage.keyword`

- [ ] **Step 1: Create PatientManagerPage.ts**
- [ ] **Step 2: Write search test**
- [ ] **Step 3: Commit**

## Chunk 3: Dashboard Navigation, Schedule Visit, Complete Visit

### Task 7: Patient Dashboard Page Object

**Files:**
- Create: `src/pages/PatientDashboardPage.ts`

Dashboard URL pattern: `/patientcare/{patientId}/{episodeId}/overview`
Tabs: Chart, Tasks, Authorization, Reconcile Authorization, Claims, MD Orders, Communication, Adverse Events, Medication, Miscellaneous, VS Monitor, Nursing Care Plan
Task list table with columns: Task, Status, Assigned, Planned Date, Visit Date, Sign Date
Blue "+" FAB button for adding tasks

- [ ] **Step 1: Create PatientDashboardPage.ts with tab navigation and task interaction methods**
- [ ] **Step 2: Commit**

### Task 8: Schedule Visit Page Object and Test

**Files:**
- Create: `src/pages/ScheduleVisitPage.ts`
- Create: `tests/stage1/03-schedule-visit.spec.ts`

- [ ] **Step 1: Create ScheduleVisitPage.ts** (add RN Visit Task dialog)
- [ ] **Step 2: Write schedule visit test**
- [ ] **Step 3: Run and verify**
- [ ] **Step 4: Commit**

### Task 9: Complete Visit Task Page Object and Test

**Files:**
- Create: `src/pages/VisitTaskPage.ts`
- Create: `tests/stage1/04-complete-visit-task.spec.ts`

- [ ] **Step 1: Create VisitTaskPage.ts**
- [ ] **Step 2: Write complete visit task test**
- [ ] **Step 3: Run and verify**
- [ ] **Step 4: Commit**

## Chunk 4: OASIS SOC

### Task 10: OASIS SOC Page Object and Test

**Files:**
- Create: `src/pages/OasisSOCPage.ts`
- Create: `tests/stage1/05-complete-oasis-soc.spec.ts`

10 sections: Administrative, Diagnosis/Health Conditions, Vital Signs/Sensory, Cognitive/Mood/Behavior/Neuro, Integumentary, Pulmonary/Cardiovascular, Nutrition/Elimination, Musculoskeletal/Functional Status, Medications/Treatment, Care Management/Goals

- [ ] **Step 1: Create OasisSOCPage.ts with methods for each section**
- [ ] **Step 2: Write OASIS test covering all 10 sections**
- [ ] **Step 3: Run and verify**
- [ ] **Step 4: Commit**

## Chunk 5: MD Orders, Communication, Adverse Events

### Task 11: MD Orders

**Files:**
- Create: `src/pages/MDOrdersPage.ts`
- Create: `tests/stage1/06-md-orders.spec.ts`

Tab URL: `/patientcare/{pid}/{eid}/orders`

- [ ] **Step 1: Create page object and test**
- [ ] **Step 2: Run and verify**
- [ ] **Step 3: Commit**

### Task 12: Communication Note

**Files:**
- Create: `src/pages/CommunicationPage.ts`
- Create: `tests/stage1/07-communication-note.spec.ts`

Tab URL: `/patientcare/{pid}/{eid}/comm-coord`

- [ ] **Step 1: Create page object and test**
- [ ] **Step 2: Run and verify**
- [ ] **Step 3: Commit**

### Task 13: Adverse Events

**Files:**
- Create: `src/pages/AdverseEventsPage.ts`
- Create: `tests/stage1/08-adverse-events.spec.ts`

Tab URL: `/patientcare/{pid}/{eid}/events`

- [ ] **Step 1: Create page object and test**
- [ ] **Step 2: Run and verify**
- [ ] **Step 3: Commit**

## Chunk 6: Medication, Wound Management, Miscellaneous, Nursing Care Plan

### Task 14: Medication Profile

**Files:**
- Create: `src/pages/MedicationPage.ts`
- Create: `tests/stage1/09-medication-profile.spec.ts`

Tab URL: `/patientcare/{pid}/{eid}/medication/profile/list`

- [ ] **Step 1: Create page object and test**
- [ ] **Step 2: Run and verify**
- [ ] **Step 3: Commit**

### Task 15: Wound Management

**Files:**
- Create: `src/pages/WoundManagementPage.ts`
- Create: `tests/stage1/10-wound-management.spec.ts`

- [ ] **Step 1: Inspect wound management UI to discover selectors**
- [ ] **Step 2: Create page object and test**
- [ ] **Step 3: Run and verify**
- [ ] **Step 4: Commit**

### Task 16: Miscellaneous

**Files:**
- Create: `src/pages/MiscellaneousPage.ts`
- Create: `tests/stage1/11-miscellaneous.spec.ts`

Tab URL: `/patientcare/{pid}/{eid}/misc`

- [ ] **Step 1: Create page object and test**
- [ ] **Step 2: Run and verify**
- [ ] **Step 3: Commit**

### Task 17: Nursing Care Plan

**Files:**
- Create: `src/pages/NursingCarePlanPage.ts`
- Create: `tests/stage1/12-nursing-care-plan.spec.ts`

Tab URL: `/patientcare/{pid}/{eid}/ncp`

- [ ] **Step 1: Create page object and test**
- [ ] **Step 2: Run and verify**
- [ ] **Step 3: Commit**

## Chunk 7: Stage 2 — Patient Processes

### Task 18: Transfer Patient

**Files:**
- Create: `tests/stage2/01-transfer-patient.spec.ts`

- [ ] **Step 1: Inspect transfer UI**
- [ ] **Step 2: Create test**
- [ ] **Step 3: Commit**

### Task 19: Resumption of Care

**Files:**
- Create: `tests/stage2/02-resumption-of-care.spec.ts`

- [ ] **Step 1: Inspect resumption UI**
- [ ] **Step 2: Create test**
- [ ] **Step 3: Commit**

### Task 20: Recertify Patient

**Files:**
- Create: `tests/stage2/03-recertify-patient.spec.ts`

- [ ] **Step 1: Inspect recertification UI**
- [ ] **Step 2: Create test**
- [ ] **Step 3: Commit**

### Task 21: Discharge Patient

**Files:**
- Create: `tests/stage2/04-discharge-patient.spec.ts`

- [ ] **Step 1: Inspect discharge UI**
- [ ] **Step 2: Create test**
- [ ] **Step 3: Commit**

### Task 22: Follow-up Patient

**Files:**
- Create: `tests/stage2/05-follow-up-patient.spec.ts`

- [ ] **Step 1: Inspect follow-up UI**
- [ ] **Step 2: Create test**
- [ ] **Step 3: Commit**
