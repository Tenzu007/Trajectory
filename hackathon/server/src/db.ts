import fs from 'fs';
import path from 'path';

export interface MachineEnergy {
  id: string;
  name: string;
  department: string;
  ratedPowerKw: number;
  normalHoursPerDay: number;
  actualHours: number;
  actualKwh: number;
  historicalAvgKwh: number;
  isAnomaly: boolean;
  anomalyPercent: number;
  anomalyReason?: string;
  recommendation?: string;
  potentialSavingsKwh?: number;
  potentialSavingsInr?: number;
}

export interface DepartmentEnergy {
  department: string;
  totalKwh: number;
  totalCostInr: number;
  machineCount: number;
  highestConsumer: string;
}

export interface RenewableSummary {
  solarKwh: number;
  windKwh: number;
  totalRenewableKwh: number;
  gridKwh: number;
  totalDemandKwh: number;
  renewableContributionPercent: number;
  gridDependencyPercent: number;
  co2SavedKg: number;
}

export interface DailyLedgerEntry {
  id: string;
  date: string;
  shift: string;
  milkReceivedLiters: number;
  fatPercentReceived: number;
  snfPercentReceived: number;
  milkAllocatedProduction: number;
  pouchMilkLitersEq: number;
  curdLitersEq: number;
  gheeLitersEq: number;
  paneerLitersEq: number;
  totalProductOutputLitersEq: number;
  rinseMilkRecoveredLiters: number;
  milkSentToDrainLiters: number;
  recordedSpillsLiters: number;
  rejectedLiters: number;
  totalRecordedLossesLiters: number;
  unexplainedLossLiters: number;
  lossPercent: number;
  thresholdPercent: number;
  isThresholdExceeded: boolean;
  fatLossKg: number;
  snfLossKg: number;
  financialLossInr: number;
  investigationStatus: 'Normal' | 'Alert' | 'Investigating' | 'Resolved';
}

export interface ChangeoverRecord {
  id: string;
  line: string;
  machine: string;
  previousProduct: string;
  nextProduct: string;
  timestamp: string;
  quantityDrainedLiters: number;
  historicalBaselineLiters: number;
  excessWastedLiters: number;
  estimatedLossInr: number;
  shift: string;
  isAbnormal: boolean;
  recommendation: string;
}

export interface RinseRecoveryRecord {
  id: string;
  line: string;
  product: string;
  date: string;
  shift: string;
  recoverableEstimateLiters: number;
  actualRecoveredLiters: number;
  unrecoveredLiters: number;
  recoveryPercent: number;
  financialValueUnrecoveredInr: number;
  qcApprovalStatus: 'Approved for Reuse' | 'Requires Verification' | 'Rejected for Production';
}

export interface PackagingYieldRecord {
  id: string;
  machine: string;
  shift: string;
  date: string;
  pouchType: string;
  filmIssuedKg: number;
  filmReturnedKg: number;
  filmUsedKg: number;
  filmScrapKg: number;
  reconciliationDiffKg: number;
  pouchesProduced: number;
  leakingOrRejectedPouches: number;
  actualYieldPouchesPerKg: number;
  expectedYieldPouchesPerKg: number;
  efficiencyPercent: number;
  isAbnormal: boolean;
}

export interface ResourceConsumption {
  id: string;
  date: string;
  shift: string;
  milkProcessedLiters: number;
  waterConsumedLiters: number;
  waterPerLiterMilk: number;
  normalWaterBaseline: number;
  lyeConsumedKg: number; // NaOH
  nitricAcidConsumedKg: number; // HNO3
  chemicalsPerLiterMilk: number;
  normalChemicalBaseline: number;
  waterAnomaly: boolean;
  chemicalAnomaly: boolean;
}

export interface LeakSpillReport {
  id: string;
  location: string;
  tankOrMachine: string;
  type: 'Spill' | 'Valve Leak' | 'Pipe Flange' | 'Gasket Failure' | 'Pump Seal';
  estimatedQuantityLostLiters: number;
  timestamp: string;
  shift: string;
  reportedBy: string;
  assignedMaintenancePerson: string;
  status: 'Reported' | 'Assigned' | 'In Progress' | 'Repaired' | 'Verified';
  repeatIncidentCount: number;
  isRecurring: boolean;
  alertNote?: string;
  financialImpactInr: number;
}

export interface WasteBatch {
  id: string;
  industryName: string;
  department: string;
  productionStage: string;
  materialName: string;
  wasteType: 'Dairy Organic' | 'Packaging Film' | 'CIP Sludge' | 'Rinse Effluent' | 'Corrugated Boxes';
  quantity: number;
  unit: string;
  timestamp: string;
  reason: string;
  contaminationStatus: 'None - Food Grade' | 'Low - Industrial' | 'High - Contaminated';
  shelfLifeHours: number;
  storageCondition: 'Chilled (4°C)' | 'Ambient Tank' | 'Dry Baled' | 'Sealed Drum';
  aiSuggestedCategory: 'Reusable' | 'Treatable' | 'Disposal';
  aiConfidencePercent: number;
  aiExplanation: string;
  qcVerifiedCategory: 'Reusable' | 'Treatable' | 'Disposal';
  qcVerifiedBy: string;
  qcStatus: 'Pending Verification' | 'Verified' | 'Rejected';
  estimatedUnitValueInr: number;
  grossValueInr: number;
  netRecoveryValueInr: number;
  matchedIndustry?: string;
  passportId?: string;
}

export interface IndustrialExchangeMatch {
  id: string;
  sourceMaterial: string;
  availableQuantity: number;
  unit: string;
  dairyPlant: string;
  partnerIndustry: string;
  partnerIndustryType: 'Bakery & Confectionery' | 'Biogas Energy' | 'Animal Feed' | 'Fertilizer & Agro' | 'Plastic Recycler';
  compatibilityScorePercent: number;
  suggestedMaterialUse: string;
  estimatedNetValueInr: number;
  exchangeStatus: 'Match Discovered' | 'Request Sent' | 'Accepted' | 'Dispatched' | 'Completed';
  distanceKm: number;
}

export interface DigitalPassport {
  passportId: string;
  batchId: string;
  materialName: string;
  category: 'Reusable' | 'Treatable' | 'Disposal';
  quantity: string;
  originFacility: string;
  destinationFacility: string;
  generationDate: string;
  qcCertificateNumber: string;
  storageConditions: string;
  transportVehicleNumber: string;
  driverName: string;
  chainOfCustodyStatus: 'Batch Registered' | 'QC Certified' | 'In Transit' | 'Received at Destination' | 'Processing Complete';
  qrCodeDataUrl?: string;
}

export interface EmployeeProfile {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  status: 'Active' | 'Inactive';
  registeredFace: boolean;
  requiredPPE: string[];
  complianceScorePercent: number;
  recentEntryStatus: 'Approved' | 'Denied';
}

export interface PreEntryVerification {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  timestamp: string;
  facialRecognitionScorePercent: number;
  isFaceRecognized: boolean;
  ppeChecks: {
    hairnet: boolean;
    faceMask: boolean;
    gloves: boolean;
    apron: boolean;
    safetyFootwear: boolean;
  };
  missingPPE: string[];
  entryStatus: 'APPROVED' | 'DENIED';
  cameraLocation: string;
}

export interface CCTVViolation {
  id: string;
  violationId: string;
  cameraId: string;
  cameraName: string;
  location: string;
  timestamp: string;
  category: 'Missing Hairnet' | 'Missing Face Mask' | 'Missing Gloves' | 'Improper Apron' | 'Face Touching' | 'Unauthorized Area Access' | 'Equipment Dirt Accumulation';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  confidenceScorePercent: number;
  evidenceFrameUrl: string;
  status: 'New' | 'Under Review' | 'Confirmed' | 'Rejected' | 'Corrective Action Pending' | 'Resolved';
  assignedSupervisor: string;
  correctiveActionTaken?: string;
}

export interface EquipmentRecord {
  id: string;
  equipmentId: string;
  name: string;
  category: 'Milk Storage' | 'Thermal Processing' | 'Homogenization' | 'Packaging Line' | 'Conveyance' | 'CIP System';
  department: string;
  location: string;
  cleaningFrequency: 'Every 8 Hours (Shift)' | 'Daily (24h)' | 'Weekly' | 'Bi-weekly';
  lastCleanedTimestamp: string;
  nextScheduledCleaning: string;
  currentStatus: 'Clean' | 'Dirty' | 'Cleaning in Progress' | 'Overdue' | 'Awaiting Verification';
  assignedCleaningTeam: string;
  recentVerificationPhotoUrl?: string;
  supervisorRemarks?: string;
  violationCount: number;
}

export interface SystemAlert {
  id: string;
  alertId: string;
  pillar: 'Energy' | 'Waste & Loss' | 'Hygiene & Cleanliness';
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  timestamp: string;
  isResolved: boolean;
  actionUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial Seed Data matching ALL PRD scenarios!
// ─────────────────────────────────────────────────────────────────────────────

const initialMachines: MachineEnergy[] = [
  {
    id: 'M-01',
    name: 'Bulk Milk Chilling Unit 1',
    department: 'Cold Chain',
    ratedPowerKw: 45,
    normalHoursPerDay: 18,
    actualHours: 20,
    actualKwh: 900,
    historicalAvgKwh: 810,
    isAnomaly: true,
    anomalyPercent: 11.1,
    anomalyReason: 'Running during thermal compressor idling; refrigeration schedule drift',
    recommendation: 'Recalibrate chilled water set-point to 3.8°C and shut down during off-peak buffer intake',
    potentialSavingsKwh: 120,
    potentialSavingsInr: 984,
  },
  {
    id: 'M-02',
    name: 'HTST Pasteurizer Alpha',
    department: 'Pasteurization',
    ratedPowerKw: 75,
    normalHoursPerDay: 14,
    actualHours: 14,
    actualKwh: 1050,
    historicalAvgKwh: 1050,
    isAnomaly: false,
    anomalyPercent: 0,
    recommendation: 'Plate heat exchanger operating at optimal heat regeneration coefficient',
    potentialSavingsKwh: 0,
    potentialSavingsInr: 0,
  },
  {
    id: 'M-03',
    name: 'High-Pressure Homogenizer 2',
    department: 'Processing',
    ratedPowerKw: 60,
    normalHoursPerDay: 10,
    actualHours: 12,
    actualKwh: 720,
    historicalAvgKwh: 580,
    isAnomaly: true,
    anomalyPercent: 24.1,
    anomalyReason: 'Cavitation valve wear causing 24% excessive power draw to maintain 200 bar target',
    recommendation: 'Perform immediate mechanical seal & valve seating overhaul during scheduled CIP',
    potentialSavingsKwh: 140,
    potentialSavingsInr: 1148,
  },
  {
    id: 'M-04',
    name: 'Rotary Pouch Packing Machine 4',
    department: 'Packaging',
    ratedPowerKw: 18,
    normalHoursPerDay: 16,
    actualHours: 16,
    actualKwh: 288,
    historicalAvgKwh: 290,
    isAnomaly: false,
    anomalyPercent: -0.7,
    recommendation: 'Operating within standard mechanical power band',
    potentialSavingsKwh: 0,
    potentialSavingsInr: 0,
  },
  {
    id: 'M-05',
    name: 'Steam Boiler Feed Water Pump',
    department: 'Utilities',
    ratedPowerKw: 30,
    normalHoursPerDay: 22,
    actualHours: 23,
    actualKwh: 690,
    historicalAvgKwh: 610,
    isAnomaly: true,
    anomalyPercent: 13.1,
    anomalyReason: 'Impeller throttling instead of VFD modulation causing redundant electrical draw',
    recommendation: 'Engage VFD auto-throttling loop based on steam drum pressure',
    potentialSavingsKwh: 95,
    potentialSavingsInr: 779,
  },
  {
    id: 'M-06',
    name: 'CIP Centralized Rinse Pump 1',
    department: 'Sanitation',
    ratedPowerKw: 22,
    normalHoursPerDay: 8,
    actualHours: 8,
    actualKwh: 176,
    historicalAvgKwh: 175,
    isAnomaly: false,
    anomalyPercent: 0.5,
    recommendation: 'Optimal wash cycle duration maintained',
    potentialSavingsKwh: 0,
    potentialSavingsInr: 0,
  },
];

const initialDailyLedgers: DailyLedgerEntry[] = [
  {
    id: 'LEDGER-2026-11-01',
    date: '2026-11-01',
    shift: 'Shift A (Morning)',
    milkReceivedLiters: 50000,
    fatPercentReceived: 4.5,
    snfPercentReceived: 8.5,
    milkAllocatedProduction: 48000,
    pouchMilkLitersEq: 32000,
    curdLitersEq: 8400, // 8,000 kg curd * 1.05
    gheeLitersEq: 4500, // 200 kg ghee * 22.5
    paneerLitersEq: 2400, // 300 kg paneer * 8.0
    totalProductOutputLitersEq: 47300,
    rinseMilkRecoveredLiters: 320,
    milkSentToDrainLiters: 110,
    recordedSpillsLiters: 30,
    rejectedLiters: 0,
    totalRecordedLossesLiters: 140,
    unexplainedLossLiters: 240, // 48000 - 47300 - 320 - 140 = 240
    lossPercent: 0.5,
    thresholdPercent: 1.5,
    isThresholdExceeded: false,
    fatLossKg: 10.8,
    snfLossKg: 20.4,
    financialLossInr: 10800,
    investigationStatus: 'Normal',
  },
  {
    // SCENARIO 1: Unexplained Milk Loss exceeding normal threshold!
    id: 'LEDGER-2026-11-05',
    date: '2026-11-05',
    shift: 'Shift B (Evening)',
    milkReceivedLiters: 50000,
    fatPercentReceived: 4.4,
    snfPercentReceived: 8.5,
    milkAllocatedProduction: 48500,
    pouchMilkLitersEq: 30500,
    curdLitersEq: 8400,
    gheeLitersEq: 4500,
    paneerLitersEq: 3200,
    totalProductOutputLitersEq: 46600,
    rinseMilkRecoveredLiters: 280,
    milkSentToDrainLiters: 350,
    recordedSpillsLiters: 120,
    rejectedLiters: 150,
    totalRecordedLossesLiters: 620,
    unexplainedLossLiters: 1000, // 48500 - 46600 - 280 - 620 = 1,000 Litres!!
    lossPercent: 2.06,
    thresholdPercent: 1.5,
    isThresholdExceeded: true,
    fatLossKg: 44.0,
    snfLossKg: 85.0,
    financialLossInr: 45000,
    investigationStatus: 'Alert',
  },
];

const initialChangeovers: ChangeoverRecord[] = [
  {
    id: 'CHG-01',
    line: 'Packaging Line 1',
    machine: 'Pouch Filler Alpha',
    previousProduct: 'Toned Milk (3% Fat)',
    nextProduct: 'Full Cream Milk (6% Fat)',
    timestamp: '2026-11-04 14:15',
    quantityDrainedLiters: 48,
    historicalBaselineLiters: 45,
    excessWastedLiters: 3,
    estimatedLossInr: 135,
    shift: 'Shift B',
    isAbnormal: false,
    recommendation: 'Sequence conforms to standard production guideline',
  },
  {
    // SCENARIO 2: Excessive Changeover Loss!
    id: 'CHG-02',
    line: 'Packaging Line 2',
    machine: 'Aseptic Line Beta',
    previousProduct: 'Chocolate Flavoured Milk',
    nextProduct: 'Standardized Plain Milk',
    timestamp: '2026-11-05 09:30',
    quantityDrainedLiters: 180,
    historicalBaselineLiters: 50,
    excessWastedLiters: 130,
    estimatedLossInr: 5850,
    shift: 'Shift A',
    isAbnormal: true,
    recommendation: 'Reverse production order: Always schedule Plain Milk BEFORE Flavoured Milk to avoid 130L intermediate water-flush drainage',
  },
];

const initialRinseRecovery: RinseRecoveryRecord[] = [
  {
    id: 'RNS-01',
    line: 'Processing Circuit 1',
    product: 'Pasteurized Whole Milk',
    date: '2026-11-05',
    shift: 'Shift A',
    recoverableEstimateLiters: 500,
    actualRecoveredLiters: 350,
    unrecoveredLiters: 150,
    recoveryPercent: 70.0,
    financialValueUnrecoveredInr: 6750,
    qcApprovalStatus: 'Approved for Reuse',
  },
  {
    id: 'RNS-02',
    line: 'Curd Coagulation Line',
    product: 'Fermented Milk Matrix',
    date: '2026-11-05',
    shift: 'Shift B',
    recoverableEstimateLiters: 400,
    actualRecoveredLiters: 220,
    unrecoveredLiters: 180,
    recoveryPercent: 55.0,
    financialValueUnrecoveredInr: 8100,
    qcApprovalStatus: 'Requires Verification',
  },
];

const initialPackaging: PackagingYieldRecord[] = [
  {
    // SCENARIO 4: Low Packaging Yield & Leaks on Machine 4
    id: 'PKG-01',
    machine: 'Pouch Machine 4',
    shift: 'Shift A',
    date: '2026-11-05',
    pouchType: '500ml LDPE Pouch',
    filmIssuedKg: 100,
    filmReturnedKg: 10,
    filmUsedKg: 85,
    filmScrapKg: 5,
    reconciliationDiffKg: 0,
    pouchesProduced: 95200,
    leakingOrRejectedPouches: 450,
    actualYieldPouchesPerKg: 1120,
    expectedYieldPouchesPerKg: 1250,
    efficiencyPercent: 89.6,
    isAbnormal: true,
  },
  {
    id: 'PKG-02',
    machine: 'Pouch Machine 1',
    shift: 'Shift A',
    date: '2026-11-05',
    pouchType: '1000ml LDPE Pouch',
    filmIssuedKg: 120,
    filmReturnedKg: 20,
    filmUsedKg: 98,
    filmScrapKg: 2,
    reconciliationDiffKg: 0,
    pouchesProduced: 61250,
    leakingOrRejectedPouches: 85,
    actualYieldPouchesPerKg: 625,
    expectedYieldPouchesPerKg: 630,
    efficiencyPercent: 99.2,
    isAbnormal: false,
  },
];

const initialResources: ResourceConsumption[] = [
  {
    id: 'RES-01',
    date: '2026-11-05',
    shift: 'Shift A',
    milkProcessedLiters: 48500,
    waterConsumedLiters: 82450,
    waterPerLiterMilk: 1.7, // Target is 1.4 - 1.5 L/L
    normalWaterBaseline: 1.45,
    lyeConsumedKg: 125,
    nitricAcidConsumedKg: 45,
    chemicalsPerLiterMilk: 0.0035,
    normalChemicalBaseline: 0.0031,
    waterAnomaly: true,
    chemicalAnomaly: true,
  },
];

const initialLeaks: LeakSpillReport[] = [
  {
    // SCENARIO 3: Recurring leak on Tank 3 valve!
    id: 'LEAK-101',
    location: 'Raw Milk Storage Bay',
    tankOrMachine: 'Tank 3 (Raw Silo 30KL)',
    type: 'Valve Leak',
    estimatedQuantityLostLiters: 80,
    timestamp: '2026-11-05 11:20',
    shift: 'Shift A',
    reportedBy: 'Kavita Nair (Shift Tech)',
    assignedMaintenancePerson: 'Ramesh Verma (Senior Fitter)',
    status: 'In Progress',
    repeatIncidentCount: 5,
    isRecurring: true,
    alertNote: 'CRITICAL REPEAT ISSUE: Valve near Tank 3 has leaked 5 times this month. Maintenance inspection & stem seal replacement strongly recommended!',
    financialImpactInr: 18400,
  },
  {
    id: 'LEAK-102',
    location: 'Pasteurizer Discharge',
    tankOrMachine: 'Transfer Pump 2',
    type: 'Gasket Failure',
    estimatedQuantityLostLiters: 25,
    timestamp: '2026-11-04 16:45',
    shift: 'Shift B',
    reportedBy: 'Suresh Patil',
    assignedMaintenancePerson: 'Anil Kumar',
    status: 'Repaired',
    repeatIncidentCount: 1,
    isRecurring: false,
    financialImpactInr: 1125,
  },
];

const initialWasteBatches: WasteBatch[] = [
  {
    // SCENARIO 5: High-grade sweet whey suitable for Industrial Exchange
    id: 'WB-2026-091',
    industryName: 'Apex Dairy Cooperative',
    department: 'Paneer & Cheese Plant',
    productionStage: 'Whey Draining & Separation',
    materialName: 'Sweet Food-Grade Whey',
    wasteType: 'Dairy Organic',
    quantity: 3500,
    unit: 'Liters',
    timestamp: '2026-11-05 10:00',
    reason: 'Excess daily paneer whey production exceeding internal concentration dryer capacity',
    contaminationStatus: 'None - Food Grade',
    shelfLifeHours: 24,
    storageCondition: 'Chilled (4°C)',
    aiSuggestedCategory: 'Reusable',
    aiConfidencePercent: 96.5,
    aiExplanation: 'Total solids 6.2%, protein 0.85%, acidity <0.12%. Ideal for bakery dough fortification or malted nutritional beverage blends.',
    qcVerifiedCategory: 'Reusable',
    qcVerifiedBy: 'Dr. Sunita Mehta (QC Lead)',
    qcStatus: 'Verified',
    estimatedUnitValueInr: 6.5,
    grossValueInr: 22750,
    netRecoveryValueInr: 18250,
    matchedIndustry: 'BakeCraft Agro Ingredients Ltd',
    passportId: 'PASSPORT-IN-WHEY-091',
  },
  {
    id: 'WB-2026-092',
    industryName: 'Apex Dairy Cooperative',
    department: 'Effluent Pre-treatment',
    productionStage: 'DAF Clarifier',
    materialName: 'Organic Dairy Sludge',
    wasteType: 'CIP Sludge',
    quantity: 1200,
    unit: 'Kilograms',
    timestamp: '2026-11-05 08:30',
    reason: 'Biological flocs dewatered from dissolved air flotation cell',
    contaminationStatus: 'Low - Industrial',
    shelfLifeHours: 72,
    storageCondition: 'Sealed Drum',
    aiSuggestedCategory: 'Treatable',
    aiConfidencePercent: 91.0,
    aiExplanation: 'High volatile solids and nitrogen content. Requires anaerobic methanogenesis or vermicomposting stabilization.',
    qcVerifiedCategory: 'Treatable',
    qcVerifiedBy: 'Dr. Sunita Mehta (QC Lead)',
    qcStatus: 'Verified',
    estimatedUnitValueInr: 1.8,
    grossValueInr: 2160,
    netRecoveryValueInr: 1200,
    matchedIndustry: 'GreenBio Biomass Power Plant',
    passportId: 'PASSPORT-IN-SLUDGE-092',
  },
  {
    id: 'WB-2026-093',
    industryName: 'Apex Dairy Cooperative',
    department: 'Packaging',
    productionStage: 'Pouch Trimming Station',
    materialName: 'Contaminated Multilayer Film Scrap',
    wasteType: 'Packaging Film',
    quantity: 45,
    unit: 'Kilograms',
    timestamp: '2026-11-05 07:45',
    reason: 'Heat seal charred film rejected during temperature surge',
    contaminationStatus: 'High - Contaminated',
    shelfLifeHours: 720,
    storageCondition: 'Dry Baled',
    aiSuggestedCategory: 'Disposal',
    aiConfidencePercent: 98.2,
    aiExplanation: 'Degraded polyolefin resin with charring. Cannot be food-grade recycled; assigned to certified industrial co-processing kiln.',
    qcVerifiedCategory: 'Disposal',
    qcVerifiedBy: 'Sanjay Deshmukh (Safety Officer)',
    qcStatus: 'Verified',
    estimatedUnitValueInr: 0,
    grossValueInr: 0,
    netRecoveryValueInr: -450, // Disposal fee
    passportId: 'PASSPORT-IN-SCRAP-093',
  },
];

const initialExchangeMatches: IndustrialExchangeMatch[] = [
  {
    id: 'EX-01',
    sourceMaterial: 'Sweet Food-Grade Whey',
    availableQuantity: 3500,
    unit: 'Liters',
    dairyPlant: 'Apex Dairy Cooperative',
    partnerIndustry: 'BakeCraft Agro Ingredients Ltd',
    partnerIndustryType: 'Bakery & Confectionery',
    compatibilityScorePercent: 96,
    suggestedMaterialUse: 'Direct sugar & skimmed milk replacer in industrial cookie formulation',
    estimatedNetValueInr: 18250,
    exchangeStatus: 'Request Sent',
    distanceKm: 28,
  },
  {
    id: 'EX-02',
    sourceMaterial: 'Organic Dairy Sludge',
    availableQuantity: 1200,
    unit: 'Kilograms',
    dairyPlant: 'Apex Dairy Cooperative',
    partnerIndustry: 'GreenBio Biomass Power Plant',
    partnerIndustryType: 'Biogas Energy',
    compatibilityScorePercent: 92,
    suggestedMaterialUse: 'High-methane digester feedstock for 45 kWh electrical co-generation',
    estimatedNetValueInr: 1200,
    exchangeStatus: 'Match Discovered',
    distanceKm: 42,
  },
  {
    id: 'EX-03',
    sourceMaterial: 'Spent Nitric Acid Neutralized Salt Matrix',
    availableQuantity: 600,
    unit: 'Liters',
    dairyPlant: 'Apex Dairy Cooperative',
    partnerIndustry: 'GrowWell Liquid Biofertilizers',
    partnerIndustryType: 'Fertilizer & Agro',
    compatibilityScorePercent: 88,
    suggestedMaterialUse: 'Nitrate and mineral enrichment base for foliar agricultural spray',
    estimatedNetValueInr: 3200,
    exchangeStatus: 'Match Discovered',
    distanceKm: 35,
  },
];

const initialPassports: DigitalPassport[] = [
  {
    passportId: 'PASSPORT-IN-WHEY-091',
    batchId: 'WB-2026-091',
    materialName: 'Sweet Food-Grade Whey',
    category: 'Reusable',
    quantity: '3,500 Liters (Chilled Tanker)',
    originFacility: 'Apex Dairy Cooperative (Plant #4, Pune Highway)',
    destinationFacility: 'BakeCraft Agro Ingredients Ltd (MIDC Sector 9)',
    generationDate: '2026-11-05 10:00 IST',
    qcCertificateNumber: 'QC-CERT-2026-8819',
    storageConditions: 'Insulated 304 Stainless Tanker maintained at 3.5°C',
    transportVehicleNumber: 'MH-12-RN-4822',
    driverName: 'Balwant Singh',
    chainOfCustodyStatus: 'In Transit',
  },
  {
    passportId: 'PASSPORT-IN-SLUDGE-092',
    batchId: 'WB-2026-092',
    materialName: 'Organic Dairy Sludge',
    category: 'Treatable',
    quantity: '1,200 Kilograms',
    originFacility: 'Apex Dairy Cooperative',
    destinationFacility: 'GreenBio Biomass Energy Unit',
    generationDate: '2026-11-05 08:30 IST',
    qcCertificateNumber: 'QC-SLUDGE-774',
    storageConditions: 'HDPE drums sealed with safety seals',
    transportVehicleNumber: 'MH-12-TK-9104',
    driverName: 'Vijay Jadhav',
    chainOfCustodyStatus: 'Received at Destination',
  },
];

const initialEmployees: EmployeeProfile[] = [
  {
    id: 'EMP-01',
    employeeId: 'DP-2041',
    name: 'Aarav Sharma',
    department: 'Pasteurization Deck',
    designation: 'Senior Process Operator',
    status: 'Active',
    registeredFace: true,
    requiredPPE: ['Hairnet', 'Face Mask', 'Lab Apron', 'Nitrile Gloves', 'Safety Gumboot'],
    complianceScorePercent: 98,
    recentEntryStatus: 'Approved',
  },
  {
    id: 'EMP-02',
    employeeId: 'DP-2088',
    name: 'Pooja Hegde',
    department: 'Packaging Line 4',
    designation: 'Packaging Specialist',
    status: 'Active',
    registeredFace: true,
    requiredPPE: ['Hairnet', 'Face Mask', 'Clean Apron', 'Nitrile Gloves'],
    complianceScorePercent: 86,
    recentEntryStatus: 'Denied',
  },
  {
    id: 'EMP-03',
    employeeId: 'DP-3012',
    name: 'Manish Rawat',
    department: 'Cold Storage & Dispatch',
    designation: 'Cold Chain Custodian',
    status: 'Active',
    registeredFace: true,
    requiredPPE: ['Hairnet', 'Thermal Jacket', 'Grip Gloves', 'Safety Boots'],
    complianceScorePercent: 94,
    recentEntryStatus: 'Approved',
  },
];

const initialPreEntries: PreEntryVerification[] = [
  {
    id: 'VERIF-901',
    employeeId: 'DP-2041',
    name: 'Aarav Sharma',
    department: 'Pasteurization Deck',
    timestamp: '2026-11-05 07:55 IST',
    facialRecognitionScorePercent: 99.2,
    isFaceRecognized: true,
    ppeChecks: {
      hairnet: true,
      faceMask: true,
      gloves: true,
      apron: true,
      safetyFootwear: true,
    },
    missingPPE: [],
    entryStatus: 'APPROVED',
    cameraLocation: 'Gate A - Processing Hall Airlock',
  },
  {
    id: 'VERIF-902',
    employeeId: 'DP-2088',
    name: 'Pooja Hegde',
    department: 'Packaging Line 4',
    timestamp: '2026-11-05 08:02 IST',
    facialRecognitionScorePercent: 98.4,
    isFaceRecognized: true,
    ppeChecks: {
      hairnet: true,
      faceMask: false, // VIOLATION!
      gloves: true,
      apron: true,
      safetyFootwear: true,
    },
    missingPPE: ['Face Mask'],
    entryStatus: 'DENIED',
    cameraLocation: 'Gate B - Pouch Packaging Bay',
  },
];

const initialCCTVViolations: CCTVViolation[] = [
  {
    id: 'VIOL-401',
    violationId: 'VIO-2026-104',
    cameraId: 'CAM-03',
    cameraName: 'Packaging Hall South Angle',
    location: 'Line 4 Pouch Discharge',
    timestamp: '2026-11-05 10:14 IST',
    category: 'Missing Face Mask',
    severity: 'High',
    confidenceScorePercent: 94.8,
    evidenceFrameUrl: '/images/evidence_mask_violation.jpg',
    status: 'New',
    assignedSupervisor: 'Deepak Joshi (Floor Supervisor)',
    correctiveActionTaken: 'Supervisor dispatched backup 3-ply mask dispenser replenishment',
  },
  {
    id: 'VIOL-402',
    violationId: 'VIO-2026-105',
    cameraId: 'CAM-02',
    cameraName: 'Pasteurization Flow Channel',
    location: 'Homogenizer Valve Station',
    timestamp: '2026-11-05 09:22 IST',
    category: 'Equipment Dirt Accumulation',
    severity: 'Medium',
    confidenceScorePercent: 88.5,
    evidenceFrameUrl: '/images/evidence_dirt_accumulation.jpg',
    status: 'Confirmed',
    assignedSupervisor: 'Dr. Sunita Mehta',
    correctiveActionTaken: 'Immediate sanitizing spray wipe triggered; CIP scheduled for 13:00',
  },
];

const initialEquipment: EquipmentRecord[] = [
  {
    id: 'EQ-01',
    equipmentId: 'SILO-RAW-01',
    name: '30,000L Insulated Raw Milk Silo 1',
    category: 'Milk Storage',
    department: 'Receiving Bay',
    location: 'Yard Silo Matrix Bay 1',
    cleaningFrequency: 'Daily (24h)',
    lastCleanedTimestamp: '2026-11-04 22:30',
    nextScheduledCleaning: '2026-11-05 22:30',
    currentStatus: 'Clean',
    assignedCleaningTeam: 'Sanitation Squad Alpha',
    violationCount: 0,
  },
  {
    id: 'EQ-02',
    equipmentId: 'PST-HTST-01',
    name: 'HTST Regenerative Pasteurizer Unit',
    category: 'Thermal Processing',
    department: 'Pasteurization',
    location: 'Processing Hall Section 2',
    cleaningFrequency: 'Every 8 Hours (Shift)',
    lastCleanedTimestamp: '2026-11-05 06:00',
    nextScheduledCleaning: '2026-11-05 14:00',
    currentStatus: 'Cleaning in Progress',
    assignedCleaningTeam: 'Process Operators Team 1',
    violationCount: 1,
  },
  {
    id: 'EQ-03',
    equipmentId: 'FILL-POUCH-04',
    name: 'High-Speed Rotary Pouch Filler 4',
    category: 'Packaging Line',
    department: 'Packaging',
    location: 'Aseptic Filling Bay 4',
    cleaningFrequency: 'Every 8 Hours (Shift)',
    lastCleanedTimestamp: '2026-11-04 18:00',
    nextScheduledCleaning: '2026-11-05 02:00',
    currentStatus: 'Overdue',
    assignedCleaningTeam: 'Packaging Sanitation Crew',
    violationCount: 3,
  },
  {
    id: 'EQ-04',
    equipmentId: 'TANK-3-SILO',
    name: 'Tank 3 (Raw Milk Silo 30KL)',
    category: 'Milk Storage',
    department: 'Receiving Bay',
    location: 'Raw Silo Bay 3',
    cleaningFrequency: 'Daily (24h)',
    lastCleanedTimestamp: '2026-11-05 04:00',
    nextScheduledCleaning: '2026-11-06 04:00',
    currentStatus: 'Awaiting Verification',
    assignedCleaningTeam: 'Ramesh Verma & Sanitation Team',
    supervisorRemarks: 'Waiting for photo verification of bottom discharge butterfly valve replacement',
    violationCount: 5,
  },
];

const initialAlerts: SystemAlert[] = [
  {
    id: 'ALT-01',
    alertId: 'ALERT-WASTE-2026-01',
    pillar: 'Waste & Loss',
    title: 'Unexplained Milk Loss Exceeded 1.5% Threshold',
    description: '1,000 Litres (2.06%) of unexplained milk loss detected during Shift B on 2026-11-05 (₹45,000 financial impact). Immediate reconciliation audit required.',
    severity: 'Critical',
    timestamp: '2026-11-05 18:15',
    isResolved: false,
    actionUrl: '/loss-ledger',
  },
  {
    id: 'ALT-02',
    alertId: 'ALERT-LEAK-2026-03',
    pillar: 'Waste & Loss',
    title: 'Recurring Leak: Tank 3 Discharge Valve (5th Incident)',
    description: 'Valve near Tank 3 has leaked 5 times this month with cumulative 400L loss. Senior mechanical overhaul ticket raised.',
    severity: 'High',
    timestamp: '2026-11-05 11:20',
    isResolved: false,
    actionUrl: '/leaks',
  },
  {
    id: 'ALT-03',
    alertId: 'ALERT-ENERGY-2026-05',
    pillar: 'Energy',
    title: 'Homogenizer 2 Power Spike (+24% Anomaly)',
    description: 'High-Pressure Homogenizer drawing 720 kWh (+24.1% over historical 580 kWh baseline). Cavitation / valve wear suspected.',
    severity: 'High',
    timestamp: '2026-11-05 12:00',
    isResolved: false,
    actionUrl: '/energy',
  },
  {
    id: 'ALT-04',
    alertId: 'ALERT-HYGIENE-2026-08',
    pillar: 'Hygiene & Cleanliness',
    title: 'Biometric Pre-Entry Denied: Missing Mask at Gate B',
    description: 'Employee DP-2088 denied entrance to Packaging Line 4 due to missing mandatory face mask.',
    severity: 'Medium',
    timestamp: '2026-11-05 08:02',
    isResolved: true,
    actionUrl: '/pre-entry',
  },
  {
    id: 'ALT-05',
    alertId: 'ALERT-EQUIP-2026-09',
    pillar: 'Hygiene & Cleanliness',
    title: 'Sanitation Overdue: Rotary Pouch Filler 4',
    description: 'Scheduled 8-hour CIP wash on Pouch Filler 4 is overdue by 9 hours. Biological biofilm hazard flagged.',
    severity: 'High',
    timestamp: '2026-11-05 11:00',
    isResolved: false,
    actionUrl: '/equipment',
  },
];

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'worker';
  department: string;
  status: 'Active' | 'Inactive';
  lastActive: string;
}

export interface AppConfig {
  plantName: string;
  fssaiLicense: string;
  lossAlertThresholdPercent: number;
  electricityTariffInr: number;
  milkBasePriceInr: number;
  autoEscalateAlertsMinutes: number;
  zeroWasteTargetPercent: number;
  users: SystemUser[];
}

export const initialConfig: AppConfig = {
  plantName: 'Apex Dairy Cooperative • Plant #4 (Central Processing Hub)',
  fssaiLicense: 'FSSAI-MH-2024-00918-B4',
  lossAlertThresholdPercent: 1.5,
  electricityTariffInr: 8.20,
  milkBasePriceInr: 35.0,
  autoEscalateAlertsMinutes: 30,
  zeroWasteTargetPercent: 95.0,
  users: [
    {
      id: 'USR-001',
      name: 'Dr. Sunita Mehta',
      email: 'admin@dairypulse.in',
      role: 'admin',
      department: 'Executive Operations & Quality Assurance',
      status: 'Active',
      lastActive: 'Active Now',
    },
    {
      id: 'USR-002',
      name: 'Ramesh Kumar',
      email: 'staff@dairypulse.in',
      role: 'staff',
      department: 'Floor Operations & Processing Line 2',
      status: 'Active',
      lastActive: '5 mins ago',
    },
    {
      id: 'USR-003',
      name: 'Suresh Patil',
      email: 'worker@dairypulse.in',
      role: 'worker',
      department: 'Hygiene & Packaging Unit B',
      status: 'Active',
      lastActive: '12 mins ago',
    },
    {
      id: 'USR-004',
      name: 'Priya Sharma',
      email: 'p.sharma@dairypulse.in',
      role: 'staff',
      department: 'Quality Control & Lab Testing',
      status: 'Active',
      lastActive: '1 hour ago',
    },
    {
      id: 'USR-005',
      name: 'Anil Deshmukh',
      email: 'a.deshmukh@dairypulse.in',
      role: 'worker',
      department: 'CIP Sanitization & Equipment Checks',
      status: 'Active',
      lastActive: '25 mins ago',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Database File Storage Manager
// ─────────────────────────────────────────────────────────────────────────────

interface DatabaseState {
  machines: MachineEnergy[];
  ledgers: DailyLedgerEntry[];
  changeovers: ChangeoverRecord[];
  rinseRecovery: RinseRecoveryRecord[];
  packaging: PackagingYieldRecord[];
  resources: ResourceConsumption[];
  leaks: LeakSpillReport[];
  wasteBatches: WasteBatch[];
  exchangeMatches: IndustrialExchangeMatch[];
  passports: DigitalPassport[];
  employees: EmployeeProfile[];
  preEntries: PreEntryVerification[];
  cctvViolations: CCTVViolation[];
  equipment: EquipmentRecord[];
  alerts: SystemAlert[];
  tariffInrPerKwh: number;
  solarCapacityKw: number;
  windCapacityKw: number;
  config: AppConfig;
}

const DATA_DIR = path.resolve(process.cwd(), 'server');
const DATA_FILE = path.resolve(DATA_DIR, 'data.json');

class Database {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.config) {
          parsed.config = initialConfig;
        }
        return parsed;
      }
    } catch (err) {
      console.warn('⚠️ Could not load data.json, falling back to initial seed state.');
    }

    const defaultState: DatabaseState = {
      machines: initialMachines,
      ledgers: initialDailyLedgers,
      changeovers: initialChangeovers,
      rinseRecovery: initialRinseRecovery,
      packaging: initialPackaging,
      resources: initialResources,
      leaks: initialLeaks,
      wasteBatches: initialWasteBatches,
      exchangeMatches: initialExchangeMatches,
      passports: initialPassports,
      employees: initialEmployees,
      preEntries: initialPreEntries,
      cctvViolations: initialCCTVViolations,
      equipment: initialEquipment,
      alerts: initialAlerts,
      tariffInrPerKwh: 8.20,
      solarCapacityKw: 250,
      windCapacityKw: 100,
      config: initialConfig,
    };

    this.save(defaultState);
    return defaultState;
  }

  private save(state?: DatabaseState): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(state || this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('❌ Failed to save database to data.json:', err);
    }
  }

  // Getters
  public getMachines() { return this.state.machines; }
  public getLedgers() { return this.state.ledgers; }
  public getChangeovers() { return this.state.changeovers; }
  public getRinseRecovery() { return this.state.rinseRecovery; }
  public getPackaging() { return this.state.packaging; }
  public getResources() { return this.state.resources; }
  public getLeaks() { return this.state.leaks; }
  public getWasteBatches() { return this.state.wasteBatches; }
  public getExchangeMatches() { return this.state.exchangeMatches; }
  public getPassports() { return this.state.passports; }
  public getEmployees() { return this.state.employees; }
  public getPreEntries() { return this.state.preEntries; }
  public getCctvViolations() { return this.state.cctvViolations; }
  public getEquipment() { return this.state.equipment; }
  public getAlerts() { return this.state.alerts; }
  public getTariff() { return this.state.tariffInrPerKwh; }
  public getConfig() { return this.state.config || initialConfig; }

  // Mutations
  public updateConfig(patch: Partial<AppConfig>) {
    this.state.config = { ...this.getConfig(), ...patch };
    if (patch.electricityTariffInr !== undefined) {
      this.state.tariffInrPerKwh = patch.electricityTariffInr;
    }
    this.save();
    return this.state.config;
  }

  public updateUser(userId: string, partial: Partial<SystemUser>) {
    const config = this.getConfig();
    const user = config.users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, partial);
      this.save();
    }
    return user;
  }

  public addUser(user: SystemUser) {
    const config = this.getConfig();
    config.users.push(user);
    this.save();
    return user;
  }
  public addLedger(entry: DailyLedgerEntry) {
    this.state.ledgers.unshift(entry);
    this.save();
    return entry;
  }

  public addLeak(leak: LeakSpillReport) {
    this.state.leaks.unshift(leak);
    this.save();
    return leak;
  }

  public updateLeakStatus(id: string, status: LeakSpillReport['status']) {
    const item = this.state.leaks.find(l => l.id === id);
    if (item) {
      item.status = status;
      this.save();
    }
    return item;
  }

  public addWasteBatch(batch: WasteBatch) {
    this.state.wasteBatches.unshift(batch);
    this.save();
    return batch;
  }

  public updateWasteQC(id: string, category: WasteBatch['qcVerifiedCategory'], verifiedBy: string) {
    const item = this.state.wasteBatches.find(b => b.id === id);
    if (item) {
      item.qcVerifiedCategory = category;
      item.qcStatus = 'Verified';
      item.qcVerifiedBy = verifiedBy;
      this.save();
    }
    return item;
  }

  public addPreEntry(entry: PreEntryVerification) {
    this.state.preEntries.unshift(entry);
    this.save();
    return entry;
  }

  public addCCTVViolation(violation: CCTVViolation) {
    this.state.cctvViolations.unshift(violation);
    this.save();
    return violation;
  }

  public updateEquipmentStatus(id: string, status: EquipmentRecord['currentStatus'], photoUrl?: string, remarks?: string) {
    const item = this.state.equipment.find(e => e.id === id);
    if (item) {
      item.currentStatus = status;
      if (photoUrl) item.recentVerificationPhotoUrl = photoUrl;
      if (remarks) item.supervisorRemarks = remarks;
      if (status === 'Clean') {
        item.lastCleanedTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
      }
      this.save();
    }
    return item;
  }

  public addAlert(alert: SystemAlert) {
    this.state.alerts.unshift(alert);
    this.save();
    return alert;
  }

  public resolveAlert(id: string) {
    const alert = this.state.alerts.find(a => a.id === id);
    if (alert) {
      alert.isResolved = true;
      this.save();
    }
    return alert;
  }

  public resetDemoData() {
    this.state = {
      machines: initialMachines,
      ledgers: initialDailyLedgers,
      changeovers: initialChangeovers,
      rinseRecovery: initialRinseRecovery,
      packaging: initialPackaging,
      resources: initialResources,
      leaks: initialLeaks,
      wasteBatches: initialWasteBatches,
      exchangeMatches: initialExchangeMatches,
      passports: initialPassports,
      employees: initialEmployees,
      preEntries: initialPreEntries,
      cctvViolations: initialCCTVViolations,
      equipment: initialEquipment,
      alerts: initialAlerts,
      tariffInrPerKwh: 8.20,
      solarCapacityKw: 250,
      windCapacityKw: 100,
      config: initialConfig,
    };
    this.save();
    return true;
  }
}

export const db = new Database();

