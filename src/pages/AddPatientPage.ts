import { Page, expect } from '@playwright/test';
import { waitForPageLoad, selectOption, fillDate, selectRadio, safeFill, dismissDialogs, waitForAngular } from '../helpers/utils';

export class AddPatientPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/patient');
    await waitForPageLoad(this.page);
  }

  async skipEligibilityCheck(): Promise<void> {
    const skipBtn = this.page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async fillPreAdmissionForm(data: any): Promise<void> {
    // --- Referral / Admission Dates ---
    await fillDate(this.page, '#refDate', data.refDate);
    await fillDate(this.page, '#pre_admission_date', data.preAdmissionDate);

    // --- Auto-assign MRN ---
    const autoAssignCheckbox = this.page.locator('#medRecNumberAssign');
    if (!(await autoAssignCheckbox.isChecked())) {
      await autoAssignCheckbox.click();
    }

    // --- Primary Insurance ---
    await selectOption(this.page, '#primary_insurance', 0);
    await safeFill(this.page, '#primary_insurance_policy', data.insurancePolicy);
    await safeFill(this.page, '#primary_insurance_authorization', data.insuranceAuthorization);
    await safeFill(this.page, '#copay_amount', data.copayAmount);

    // --- Secondary Insurance ---
    await selectOption(this.page, '#secondary_insurance', 0);
    await safeFill(this.page, '#secondary_insurance_policy', data.insurancePolicy);
    await safeFill(this.page, '#secondary_insurance_authorization', data.insuranceAuthorization);

    // --- Patient Info ---
    await this.page.locator('#last_name').fill(data.lastName);
    await this.page.locator('#first_name').fill(data.firstName);
    await safeFill(this.page, '#mi', data.middleInitial);
    await fillDate(this.page, '#birthdate', data.birthdate);

    // Gender
    await selectRadio(this.page, '728', data.gender);

    // Marital Status
    await selectOption(this.page, '#marital_status', 1);

    // Ethnicity
    await selectOption(this.page, '#ethnicities', 0);

    // SSN
    await safeFill(this.page, '#ssNumber', data.ssn);

    // --- Main Address ---
    await this.page.locator('#main_line1').fill(data.mainLine1);
    await safeFill(this.page, '#main_city', data.mainCity);
    await this.page.locator('#main_state').selectOption({ label: data.mainState });
    await this.page.locator('#main_zipcode').fill(data.mainZipcode);
    await safeFill(this.page, 'input[name="phone"]', data.phone);
    await safeFill(this.page, 'input[name="other_phone"]', data.otherPhone);
    await safeFill(this.page, '#main_email', data.email);

    // --- Service Address (same as patient) ---
    const sameAsBtn = this.page.locator('button:has-text("Same as Patient Address")');
    if (await sameAsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sameAsBtn.click();
      await this.page.waitForTimeout(500);
    }

    // --- Living Situation ---
    await selectRadio(this.page, '739', data.livingArrangement);
    await selectRadio(this.page, '745', data.assistanceAvailability);
    await safeFill(this.page, '#ls_caregiver', data.caregiverName);
    await safeFill(this.page, '#ls_caregiver_phone', data.caregiverPhone);

    // --- Emergency Contact ---
    await safeFill(this.page, '#ec_name', data.ecName);
    await safeFill(this.page, '#ec_relationship', data.ecRelationship);
    await safeFill(this.page, '#ec_phone', data.ecPhone);
    await safeFill(this.page, '#ec_other_phone', data.ecOtherPhone);

    // --- Physician Information ---
    await selectOption(this.page, '#physician_attending', 0);
    // Same as attending for primary
    const sameAsPhysicianBtn = this.page.locator('button:has-text("Same as Attending Physician")');
    if (await sameAsPhysicianBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sameAsPhysicianBtn.click();
      await this.page.waitForTimeout(500);
    }

    // --- Admission Information ---
    await selectOption(this.page, '#admissiontype', 2); // Elective
    await selectOption(this.page, '#point_of_origin', 1); // Clinic/Physician's Office

    // --- Referral Information ---
    await selectOption(this.page, '#referral_type', 0);
    await selectOption(this.page, '#referral_source_id', 0);
    await safeFill(this.page, '#referral_contact_person', data.referralContactPerson);
    await safeFill(this.page, '#referral_phone', data.referralPhone);

    // --- Hospitalization ---
    await selectOption(this.page, '#hospital_id', 0);
    await fillDate(this.page, '#admit_date', data.admitDate);
    await fillDate(this.page, '#discharge_date', data.dischargeDate);

    // --- Diagnosis ---
    await safeFill(this.page, '#primary_diagnosis', data.primaryDiagnosis);
    await safeFill(this.page, '#diagnosis_surgery', data.diagnosisSurgery);

    // --- M0080 Discipline ---
    await selectRadio(this.page, 'M0080', data.discipline);

    // --- Clinical Staff ---
    await selectOption(this.page, '#cs_rn', 0);
    await selectOption(this.page, '#cs_pt', 0);
    await selectOption(this.page, '#cs_st', 0);
    await selectOption(this.page, '#cs_ot', 0);
    await selectOption(this.page, '#cs_cm', 0);
  }

  async save(): Promise<void> {
    const saveBtn = this.page.locator('button:has-text("Save")');
    await saveBtn.click();
    await this.page.waitForTimeout(3000);
    await dismissDialogs(this.page);
    await waitForPageLoad(this.page);
  }

  async getPatientInfoFromUrl(): Promise<{ patientId: string; episodeId: string }> {
    const url = this.page.url();
    const match = url.match(/patientcare\/([^/]+)\/([^/]+)/);
    if (match) {
      return { patientId: match[1], episodeId: match[2] };
    }
    return { patientId: '', episodeId: '' };
  }
}
