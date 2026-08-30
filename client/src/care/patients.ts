import type { Patient } from './types'

export const DEFAULT_PATIENT_ID = 'demo-patient-01'

export const MOCK_PATIENTS: Patient[] = [
  {
    patient_id: 'demo-patient-01',
    name: 'Shashank Shekhar',
    city: 'Kolkata',
    scenario: 'Rising trend · anomaly flagged',
  },
  {
    patient_id: 'neeraj',
    name: 'Neeraj Choubisa',
    city: 'Udaipur, Rajasthan',
    scenario: 'All normal · episode closed',
  },
  {
    patient_id: 'rakesh',
    name: 'Rakesh Kumar',
    city: 'Bangalore',
    scenario: 'New patient · awaiting report',
  },
]
