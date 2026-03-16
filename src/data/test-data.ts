import { faker } from '@faker-js/faker';
import { formatDate, formatPhone, getDateOffset } from '../helpers/utils';

export function generatePatientData() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const birthDate = faker.date.birthdate({ min: 50, max: 90, mode: 'age' });

  return {
    // Referral info
    refDate: formatDate(new Date()),
    preAdmissionDate: formatDate(new Date()),

    // Patient demographics
    firstName,
    lastName,
    middleInitial: faker.string.alpha({ length: 1, casing: 'upper' }),
    suffix: '',
    birthdate: formatDate(birthDate),
    gender: 'Male',
    maritalStatus: 'Married',
    ethnicity: 'White',
    ssn: faker.string.numeric(9),

    // Main address
    mainLine1: faker.location.streetAddress(),
    mainLine2: '',
    mainStreet: '',
    mainCity: faker.location.city(),
    mainState: 'CA- California',
    mainZipcode: '90001',
    phone: formatPhone(faker.phone.number({ style: 'national' })),
    otherPhone: formatPhone(faker.phone.number({ style: 'national' })),
    email: faker.internet.email({ firstName, lastName }),

    // Service address (same as main)
    serviceLine1: '',
    serviceCity: '',
    serviceState: '',
    serviceZipcode: '',

    // Living situation
    livingArrangement: 'lives alone',
    assistanceAvailability: 'around the clock',
    caregiverName: faker.person.fullName(),
    caregiverPhone: formatPhone(faker.phone.number({ style: 'national' })),

    // Emergency contact
    ecName: faker.person.fullName(),
    ecRelationship: faker.helpers.arrayElement(['Spouse', 'Son', 'Daughter', 'Sibling', 'Friend']),
    ecPhone: formatPhone(faker.phone.number({ style: 'national' })),
    ecOtherPhone: formatPhone(faker.phone.number({ style: 'national' })),

    // Diagnosis
    primaryDiagnosis: faker.helpers.arrayElement(['Hypertension', 'Diabetes Type 2', 'Heart Failure', 'COPD', 'Pneumonia']),
    diagnosisSurgery: faker.helpers.arrayElement(['Hip Replacement', 'Knee Replacement', 'Cardiac Surgery', 'None']),

    // M0080
    discipline: 'SN',

    // Referral
    referralContactPerson: faker.person.fullName(),
    referralPhone: formatPhone(faker.phone.number({ style: 'national' })),

    // Hospital dates
    admitDate: getDateOffset(-10),
    dischargeDate: getDateOffset(-3),

    // Insurance
    copayAmount: faker.number.int({ min: 10, max: 100 }).toString(),
    insurancePolicy: faker.string.alphanumeric(10).toUpperCase(),
    insuranceAuthorization: faker.string.alphanumeric(8).toUpperCase(),
  };
}

export function generateVisitData() {
  return {
    visitDate: getDateOffset(1),
    visitTime: '10:00',
    notes: faker.lorem.sentence(),
  };
}

export function generateCommunicationNote() {
  return {
    subject: faker.lorem.words(3),
    message: faker.lorem.paragraph(),
    dateOfContact: formatDate(new Date()),
  };
}

export function generateMDOrder() {
  return {
    orderDetails: faker.lorem.sentence(),
    orderDate: formatDate(new Date()),
    medication: faker.helpers.arrayElement(['Lisinopril 10mg', 'Metformin 500mg', 'Amlodipine 5mg']),
    instructions: faker.lorem.sentence(),
  };
}

export function generateAdverseEvent() {
  return {
    incidentDate: formatDate(new Date()),
    description: faker.lorem.paragraph(),
    actionsTitle: faker.lorem.sentence(),
  };
}

export function generateMedicationData() {
  return {
    medicationName: faker.helpers.arrayElement(['Lisinopril', 'Metformin', 'Amlodipine', 'Atorvastatin', 'Omeprazole']),
    dosage: faker.helpers.arrayElement(['5mg', '10mg', '20mg', '50mg', '100mg']),
    frequency: faker.helpers.arrayElement(['Once daily', 'Twice daily', 'Three times daily', 'As needed']),
    route: faker.helpers.arrayElement(['Oral', 'Topical', 'Injectable', 'Inhalation']),
    prescriber: faker.person.fullName(),
  };
}

export function generateWoundData() {
  return {
    woundType: faker.helpers.arrayElement(['Pressure Ulcer', 'Surgical Wound', 'Venous Ulcer', 'Diabetic Ulcer']),
    location: faker.helpers.arrayElement(['Left heel', 'Right heel', 'Sacrum', 'Left leg', 'Right leg']),
    length: faker.number.float({ min: 0.5, max: 5, fractionDigits: 1 }).toString(),
    width: faker.number.float({ min: 0.5, max: 5, fractionDigits: 1 }).toString(),
    depth: faker.number.float({ min: 0.1, max: 2, fractionDigits: 1 }).toString(),
  };
}

export function generateNursingCarePlan() {
  return {
    problem: faker.helpers.arrayElement(['Pain Management', 'Wound Care', 'Medication Compliance', 'Fall Prevention', 'Nutrition']),
    goal: faker.lorem.sentence(),
    intervention: faker.lorem.sentence(),
    targetDate: getDateOffset(30),
  };
}

export function generateMiscellaneous() {
  return {
    title: faker.lorem.words(3),
    description: faker.lorem.paragraph(),
    date: formatDate(new Date()),
  };
}
