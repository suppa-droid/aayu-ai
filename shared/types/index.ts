export interface CitizenProfile {
  id?: string;
  name: string;
  age: number;
  gender: string;
  monthly_income: number;
  is_bpl: boolean;
  state: string;
  district: string;
  mobile_number: string;
}

export type AdminTier = 'LEVEL_1_FIELD_WORKER' | 'LEVEL_2_DISTRICT_ADMIN' | 'LEVEL_3_SYSTEM_ADMIN';
export type EligibilityStatus = 'ELIGIBLE' | 'INELIGIBLE' | 'CONDITIONALLY_ELIGIBLE';
