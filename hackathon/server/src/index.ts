import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import { db, DailyLedgerEntry, LeakSpillReport, WasteBatch, PreEntryVerification, CCTVViolation } from './db.js';

const app = express();
const PORT = 5050;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health ─────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    platform: 'DairyPulse – Unified Dairy Plant Energy, Waste Analytics & AI Hygiene OS',
    timestamp: new Date().toISOString(),
  });
});

// ─── RBAC Authorization Middleware ──────────────────────────────────────────
export type UserRole = 'admin' | 'staff' | 'worker';

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawRole = (req.headers['x-user-role'] || req.query.role || 'admin') as string;
    const role = rawRole.toLowerCase() as UserRole;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Unauthorized Access: Role '${role}' does not have permission to access ${req.method} ${req.path}`,
        allowedRoles,
        currentRole: role,
      });
    }
    next();
  };
};

// ─── Admin Configuration & System Settings ──────────────────────────────────
app.get('/api/config', authorize(['admin']), (_req, res) => {
  res.json({ config: db.getConfig() });
});

app.post('/api/config', authorize(['admin']), (req, res) => {
  const updated = db.updateConfig(req.body);
  res.json({ success: true, message: 'Configuration updated successfully', config: updated });
});

app.patch('/api/config/users/:id', authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const user = db.updateUser(id, req.body);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ success: true, message: 'User updated successfully', user });
});

// ─── Energy Management (Part 1 - Admin Only) ────────────────────────────────
app.get('/api/energy/machines', authorize(['admin']), (_req, res) => {
  const machines = db.getMachines();
  const tariff = db.getTariff();
  const totalKwh = machines.reduce((acc, m) => acc + m.actualKwh, 0);
  const totalCostInr = totalKwh * tariff;
  const anomalies = machines.filter(m => m.isAnomaly);
  const potentialSavingsKwh = anomalies.reduce((acc, m) => acc + (m.potentialSavingsKwh || 0), 0);
  const potentialSavingsInr = potentialSavingsKwh * tariff;

  res.json({
    machines,
    totalKwh,
    totalCostInr,
    tariff,
    anomalyCount: anomalies.length,
    potentialSavingsKwh,
    potentialSavingsInr,
  });
});

app.get('/api/energy/departments', authorize(['admin']), (_req, res) => {
  const machines = db.getMachines();
  const tariff = db.getTariff();
  const deptMap: Record<string, { totalKwh: number; machines: typeof machines }> = {};

  machines.forEach(m => {
    if (!deptMap[m.department]) {
      deptMap[m.department] = { totalKwh: 0, machines: [] };
    }
    deptMap[m.department].totalKwh += m.actualKwh;
    deptMap[m.department].machines.push(m);
  });

  const departments = Object.keys(deptMap).map(dept => {
    const sorted = [...deptMap[dept].machines].sort((a, b) => b.actualKwh - a.actualKwh);
    return {
      department: dept,
      totalKwh: deptMap[dept].totalKwh,
      totalCostInr: deptMap[dept].totalKwh * tariff,
      machineCount: deptMap[dept].machines.length,
      highestConsumer: sorted[0]?.name || 'N/A',
    };
  });

  res.json({ departments });
});

app.get('/api/energy/renewable', authorize(['admin']), (_req, res) => {
  const machines = db.getMachines();
  const totalDemandKwh = machines.reduce((acc, m) => acc + m.actualKwh, 0);
  // Simulation estimates:
  const solarKwh = 1250;
  const windKwh = 480;
  const totalRenewableKwh = solarKwh + windKwh;
  const gridKwh = Math.max(0, totalDemandKwh - totalRenewableKwh);
  const renewableContributionPercent = Math.min(100, Math.round((totalRenewableKwh / totalDemandKwh) * 1000) / 10);
  const gridDependencyPercent = Math.round((100 - renewableContributionPercent) * 10) / 10;
  const co2SavedKg = Math.round(totalRenewableKwh * 0.82); // ~0.82 kg CO2 per kWh green energy

  res.json({
    solarKwh,
    windKwh,
    totalRenewableKwh,
    gridKwh,
    totalDemandKwh,
    renewableContributionPercent,
    gridDependencyPercent,
    co2SavedKg,
  });
});

app.post('/api/energy/simulate', authorize(['admin']), (req, res) => {
  const { reduceHours = 2, idleShutdown = true, extraRenewablePercent = 20 } = req.body;
  const machines = db.getMachines();
  const tariff = db.getTariff();

  const baselineKwh = machines.reduce((acc, m) => acc + m.actualKwh, 0);
  let simulatedKwh = 0;

  machines.forEach(m => {
    let hours = m.actualHours;
    if (m.isAnomaly && idleShutdown) {
      hours = Math.max(m.normalHoursPerDay, hours - reduceHours);
    }
    simulatedKwh += m.ratedPowerKw * hours;
  });

  const kwhSaved = Math.max(0, baselineKwh - simulatedKwh);
  const financialSavingsInr = kwhSaved * tariff;
  const baselineRenewable = 1730;
  const extraRenewableKwh = Math.round(baselineRenewable * (1 + extraRenewablePercent / 100));

  res.json({
    baselineKwh,
    simulatedKwh,
    kwhSaved,
    financialSavingsInr,
    annualProjectedSavingsInr: financialSavingsInr * 300,
    baselineRenewableKwh: baselineRenewable,
    simulatedRenewableKwh: extraRenewableKwh,
  });
});

// ─── Waste Tracking & Loss Analytics (Part 2) ───────────────────────────────
app.get('/api/waste/ledger', authorize(['admin', 'staff']), (_req, res) => {
  res.json({ ledgers: db.getLedgers() });
});

app.post('/api/waste/ledger', authorize(['admin', 'staff']), (req, res) => {
  const {
    shift = 'Shift A',
    milkReceivedLiters = 50000,
    fatPercent = 4.5,
    snfPercent = 8.5,
    pouchMilkLiters = 30000,
    curdKg = 8000,
    gheeKg = 200,
    paneerKg = 300,
    rinseRecovered = 300,
    milkSentDrain = 150,
    spills = 50,
    rejected = 0,
  } = req.body;

  // Mass-balance conversion factors
  const curdLitersEq = curdKg * 1.05;
  const gheeLitersEq = gheeKg * 22.5;
  const paneerLitersEq = paneerKg * 8.0;
  const totalProductOutputLitersEq = pouchMilkLiters + curdLitersEq + gheeLitersEq + paneerLitersEq;
  const totalRecordedLossesLiters = milkSentDrain + spills + rejected;

  // Unexplained Milk Loss = Input - Accounted Products - Recovered - Recorded Losses
  const unexplainedLossLiters = Math.max(
    0,
    milkReceivedLiters - totalProductOutputLitersEq - rinseRecovered - totalRecordedLossesLiters
  );

  const lossPercent = Math.round((unexplainedLossLiters / milkReceivedLiters) * 1000) / 10;
  const thresholdPercent = 1.5;
  const isThresholdExceeded = lossPercent > thresholdPercent;
  const fatLossKg = Math.round(((unexplainedLossLiters * fatPercent) / 100) * 10) / 10;
  const snfLossKg = Math.round(((unexplainedLossLiters * snfPercent) / 100) * 10) / 10;
  const financialLossInr = Math.round(unexplainedLossLiters * 45); // ₹45/L standard procurement price

  const entry: DailyLedgerEntry = {
    id: `LEDGER-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    shift,
    milkReceivedLiters,
    fatPercentReceived: fatPercent,
    snfPercentReceived: snfPercent,
    milkAllocatedProduction: milkReceivedLiters,
    pouchMilkLitersEq: pouchMilkLiters,
    curdLitersEq,
    gheeLitersEq,
    paneerLitersEq,
    totalProductOutputLitersEq,
    rinseMilkRecoveredLiters: rinseRecovered,
    milkSentToDrainLiters: milkSentDrain,
    recordedSpillsLiters: spills,
    rejectedLiters: rejected,
    totalRecordedLossesLiters,
    unexplainedLossLiters,
    lossPercent,
    thresholdPercent,
    isThresholdExceeded,
    fatLossKg,
    snfLossKg,
    financialLossInr,
    investigationStatus: isThresholdExceeded ? 'Alert' : 'Normal',
  };

  db.addLedger(entry);

  if (isThresholdExceeded) {
    db.addAlert({
      id: `ALT-${Date.now()}`,
      alertId: `ALERT-LOSS-${Date.now()}`,
      pillar: 'Waste & Loss',
      title: `Unexplained Milk Loss Spike: ${lossPercent}% on ${shift}`,
      description: `Unexplained variance of ${unexplainedLossLiters} L detected (Threshold: ${thresholdPercent}%). Estimated monetary loss: ₹${financialLossInr.toLocaleString()}.`,
      severity: 'Critical',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isResolved: false,
      actionUrl: '/loss-ledger',
    });
  }

  res.json({ entry });
});

app.get('/api/waste/hotspots', authorize(['admin', 'staff']), (_req, res) => {
  const hotspots = [
    { stage: 'Product Changeovers', totalLossLiters: 1250, lossPercent: 32.5, financialLossInr: 56250, incidents: 14, severity: 'High' },
    { stage: 'Airlock & Tank Leaks', totalLossLiters: 890, lossPercent: 23.1, financialLossInr: 40050, incidents: 18, severity: 'Critical' },
    { stage: 'Pouch Packaging & Scrap', totalLossLiters: 710, lossPercent: 18.4, financialLossInr: 31950, incidents: 22, severity: 'Medium' },
    { stage: 'Unrecovered CIP Rinse', totalLossLiters: 580, lossPercent: 15.1, financialLossInr: 26100, incidents: 10, severity: 'Medium' },
    { stage: 'Receiving Bay Spills', totalLossLiters: 420, lossPercent: 10.9, financialLossInr: 18900, incidents: 7, severity: 'Low' },
  ];
  res.json({ hotspots });
});

app.get('/api/waste/changeovers', authorize(['admin', 'staff']), (_req, res) => {
  res.json({ changeovers: db.getChangeovers() });
});

app.get('/api/waste/rinse-recovery', authorize(['admin', 'staff']), (_req, res) => {
  res.json({ rinseRecovery: db.getRinseRecovery() });
});

// ─── Packaging & Resource Consumption ───────────────────────────────────────
app.get('/api/resources/packaging', authorize(['admin', 'staff']), (_req, res) => {
  res.json({ packaging: db.getPackaging() });
});

app.get('/api/resources/consumption', authorize(['admin', 'staff']), (_req, res) => {
  res.json({ resources: db.getResources() });
});

// ─── Leaks & Spills ─────────────────────────────────────────────────────────
app.get('/api/leaks', authorize(['admin', 'staff']), (_req, res) => {
  res.json({ leaks: db.getLeaks() });
});

app.post('/api/leaks', authorize(['admin', 'staff']), (req, res) => {
  const { location, tankOrMachine, type, quantity, shift, reportedBy, assignedTo } = req.body;
  const existingReportsForMachine = db.getLeaks().filter(l => l.tankOrMachine.toLowerCase().includes(tankOrMachine.toLowerCase()));
  const repeatCount = existingReportsForMachine.length + 1;
  const isRecurring = repeatCount >= 3;
  const financialImpactInr = Number(quantity || 20) * 45;

  const newLeak: LeakSpillReport = {
    id: `LEAK-${Date.now()}`,
    location: location || 'Production Deck',
    tankOrMachine: tankOrMachine || 'Equipment Point',
    type: type || 'Valve Leak',
    estimatedQuantityLostLiters: Number(quantity) || 25,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    shift: shift || 'Shift A',
    reportedBy: reportedBy || 'Floor Operator',
    assignedMaintenancePerson: assignedTo || 'Duty Fitter',
    status: 'Reported',
    repeatIncidentCount: repeatCount,
    isRecurring,
    alertNote: isRecurring
      ? `CRITICAL REPEAT ISSUE: ${tankOrMachine} has leaked ${repeatCount} times this month. Immediate preventive maintenance overhaul required!`
      : undefined,
    financialImpactInr,
  };

  db.addLeak(newLeak);

  if (isRecurring) {
    db.addAlert({
      id: `ALT-LEAK-${Date.now()}`,
      alertId: `ALERT-LEAK-REPEAT-${Date.now()}`,
      pillar: 'Waste & Loss',
      title: `Recurring Leak Alert: ${tankOrMachine} (${repeatCount} Incidents)`,
      description: `Equipment ${tankOrMachine} has registered ${repeatCount} leaks. Cumulative financial damage: ₹${financialImpactInr.toLocaleString()}.`,
      severity: 'Critical',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isResolved: false,
      actionUrl: '/leaks',
    });
  }

  res.json({ leak: newLeak });
});

app.patch('/api/leaks/:id/status', authorize(['admin', 'staff']), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = db.updateLeakStatus(id, status);
  res.json({ leak: updated });
});

// ─── Financial Loss & What-If Engine (Rupee Impact - Admin Only) ────────────
app.get('/api/financial/summary', authorize(['admin']), (_req, res) => {
  const ledgers = db.getLedgers();
  const leaks = db.getLeaks();
  const changeovers = db.getChangeovers();

  const totalMilkLossInr = ledgers.reduce((acc, l) => acc + l.financialLossInr, 0);
  const totalLeakCostInr = leaks.reduce((acc, l) => acc + l.financialImpactInr, 0);
  const totalChangeoverLossInr = changeovers.reduce((acc, c) => acc + c.estimatedLossInr, 0);
  const packagingWastageInr = 18400;
  const chemicalExcessInr = 9200;
  const waterExcessInr = 4500;

  const grandTotalLossInr = totalMilkLossInr + totalLeakCostInr + totalChangeoverLossInr + packagingWastageInr + chemicalExcessInr + waterExcessInr;

  const rankedRecommendations = [
    {
      id: 'REC-01',
      priority: 'P1 - High ROI',
      action: 'Recover 70% of currently unrecovered Line 1 & Curd rinse milk into standardized recombining buffer',
      monthlySavingsInr: 42000,
      annualSavingsInr: 504000,
      effort: 'Low (Piping reconfiguration)',
      confidence: '95% (Measured baseline)',
    },
    {
      id: 'REC-02',
      priority: 'P1 - Critical',
      action: 'Replace stem gasket and seat ring on Tank 3 bottom discharge valve',
      monthlySavingsInr: 18400,
      annualSavingsInr: 220800,
      effort: 'Low (1-hour maintenance shutdown)',
      confidence: '100% (Direct physical leak)',
    },
    {
      id: 'REC-03',
      priority: 'P2 - High Impact',
      action: 'Enforce "Plain Milk before Flavoured Milk" sequence rule on Line 2 packaging to eliminate 130L rinse dumps',
      monthlySavingsInr: 23400,
      annualSavingsInr: 280800,
      effort: 'Zero cost (Production schedule rule)',
      confidence: '92% (Historical shift logs)',
    },
    {
      id: 'REC-04',
      priority: 'P2 - Moderate',
      action: 'Overhaul Homogenizer 2 valve blocks to resolve 24% cavitation electrical power surge',
      monthlySavingsInr: 11480,
      annualSavingsInr: 137760,
      effort: 'Medium (Valve lapping kit)',
      confidence: '88% (Motor power signature)',
    },
  ];

  res.json({
    milkLossCostInr: totalMilkLossInr,
    leakCostInr: totalLeakCostInr,
    changeoverLossInr: totalChangeoverLossInr,
    packagingWastageInr,
    chemicalExcessInr,
    waterExcessInr,
    grandTotalLossInr,
    rankedRecommendations,
  });
});

app.post('/api/financial/what-if', authorize(['admin']), (req, res) => {
  const { rinseRecoveryTargetPercent = 70, changeoverImprovementPercent = 50, leakReductionPercent = 80 } = req.body;

  const baseUnrecoveredRinseMonthlyLiters = 4500;
  const baseChangeoverMonthlyLiters = 1800;
  const baseLeakMonthlyLiters = 1200;

  const additionalRinseRecoveredLiters = Math.round(baseUnrecoveredRinseMonthlyLiters * (rinseRecoveryTargetPercent / 100));
  const changeoverSavedLiters = Math.round(baseChangeoverMonthlyLiters * (changeoverImprovementPercent / 100));
  const leakSavedLiters = Math.round(baseLeakMonthlyLiters * (leakReductionPercent / 100));

  const totalLitersSavedMonthly = additionalRinseRecoveredLiters + changeoverSavedLiters + leakSavedLiters;
  const monthlySavingsInr = totalLitersSavedMonthly * 45;
  const annualSavingsInr = monthlySavingsInr * 12;

  res.json({
    additionalRinseRecoveredLiters,
    changeoverSavedLiters,
    leakSavedLiters,
    totalLitersSavedMonthly,
    monthlySavingsInr,
    annualSavingsInr,
  });
});

// ─── Waste Registration, 3-Tier Classification & Passport ───────────────────
app.get('/api/classification/batches', authorize(['admin', 'staff']), (_req, res) => {
  res.json({ batches: db.getWasteBatches() });
});

app.post('/api/classification/register', authorize(['admin', 'staff']), (req, res) => {
  const {
    department = 'Processing Hall',
    productionStage = 'Centrifugal Separation',
    materialName = 'Sweet Whey Matrix',
    wasteType = 'Dairy Organic',
    quantity = 1500,
    unit = 'Liters',
    reason = 'Surplus daily production',
    contaminationStatus = 'None - Food Grade',
    shelfLifeHours = 24,
    storageCondition = 'Chilled (4°C)',
  } = req.body;

  // AI-Assisted 3-Tier Classification Logic
  let aiSuggestedCategory: WasteBatch['aiSuggestedCategory'] = 'Reusable';
  let aiConfidence = 95;
  let explanation = '';
  let unitValue = 5.0;

  if (contaminationStatus === 'High - Contaminated' || materialName.toLowerCase().includes('scrap') || materialName.toLowerCase().includes('chemical')) {
    aiSuggestedCategory = 'Disposal';
    aiConfidence = 98;
    explanation = 'Detected cross-contamination or synthetic composite residue unsuited for bioprocessing. Mandatory authorized hazardous/industrial disposal route.';
    unitValue = 0;
  } else if (contaminationStatus === 'Low - Industrial' || materialName.toLowerCase().includes('sludge') || materialName.toLowerCase().includes('effluent')) {
    aiSuggestedCategory = 'Treatable';
    aiConfidence = 92;
    explanation = 'High biological oxygen demand (BOD) and nitrogen matrix. Requires anaerobic digestion, bioreactor methanogenesis, or DAF flocculation prior to discharge.';
    unitValue = 1.5;
  } else {
    aiSuggestedCategory = 'Reusable';
    aiConfidence = 96;
    explanation = 'Safe, high-nutrient food-grade by-product. Eligible for industrial circular exchange in confectionery, animal feed, or protein extraction.';
    unitValue = 6.5;
  }

  const batchId = `WB-2026-${Math.floor(100 + Math.random() * 900)}`;
  const passportId = `PASSPORT-IN-${batchId}`;
  const grossValue = quantity * unitValue;
  const netRecoveryValue = Math.round(grossValue * 0.8);

  const newBatch: WasteBatch = {
    id: batchId,
    industryName: 'Apex Dairy Cooperative',
    department,
    productionStage,
    materialName,
    wasteType,
    quantity: Number(quantity),
    unit,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    reason,
    contaminationStatus,
    shelfLifeHours: Number(shelfLifeHours),
    storageCondition,
    aiSuggestedCategory,
    aiConfidencePercent: aiConfidence,
    aiExplanation: explanation,
    qcVerifiedCategory: aiSuggestedCategory,
    qcVerifiedBy: 'Pending QC Officer Review',
    qcStatus: 'Pending Verification',
    estimatedUnitValueInr: unitValue,
    grossValueInr: grossValue,
    netRecoveryValueInr: netRecoveryValue,
    passportId,
  };

  db.addWasteBatch(newBatch);
  res.json({ batch: newBatch });
});

app.patch('/api/classification/:id/qc-verify', authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const { category, verifiedBy } = req.body;
  const updated = db.updateWasteQC(id, category, verifiedBy || 'Dr. Sunita Mehta (QC Lead)');
  res.json({ batch: updated });
});

// ─── Industrial Exchange & Digital Waste Passport (Admin Only) ──────────────
app.get('/api/marketplace/matches', authorize(['admin']), (_req, res) => {
  res.json({ matches: db.getExchangeMatches() });
});

app.get('/api/marketplace/demand-predictions', authorize(['admin']), (_req, res) => {
  const predictions = [
    {
      material: 'Sweet Food-Grade Whey',
      predictedQuantity: 12000,
      unit: 'Liters/month',
      confidenceScore: '94%',
      targetSector: 'Industrial Biscuit & Confectionery Plants',
      historicalGrowth: '+18% MoM demand',
      estimatedRevenueInr: 78000,
    },
    {
      material: 'DAF Clarifier Organic Sludge',
      predictedQuantity: 4500,
      unit: 'Kg/month',
      confidenceScore: '89%',
      targetSector: 'Compressed Biogas (CBG) Digesters',
      historicalGrowth: 'Consistent steady uptake',
      estimatedRevenueInr: 8100,
    },
    {
      material: 'Neutralized CIP Salts (Nitrates & Phosphates)',
      predictedQuantity: 1800,
      unit: 'Liters/month',
      confidenceScore: '86%',
      targetSector: 'Foliar Agrofertilizer Manufacturers',
      historicalGrowth: '+12% Seasonal demand',
      estimatedRevenueInr: 9600,
    },
  ];
  res.json({ predictions });
});

app.get('/api/passport/:passportId', authorize(['admin']), async (req, res) => {
  const { passportId } = req.params;
  const passport = db.getPassports().find(p => p.passportId === passportId) || db.getPassports()[0];
  
  // Generate QR Code data URL dynamically
  const qrUrl = await QRCode.toDataURL(JSON.stringify({
    passportId: passport.passportId,
    batchId: passport.batchId,
    material: passport.materialName,
    category: passport.category,
    origin: passport.originFacility,
    destination: passport.destinationFacility,
    verification: passport.qcCertificateNumber,
    timestamp: passport.generationDate,
  }));

  res.json({ passport: { ...passport, qrCodeDataUrl: qrUrl } });
});

// ─── AI-Powered Hygiene & Biometric Pre-Entry (Part 3) ──────────────────────
app.get('/api/hygiene/employees', authorize(['admin', 'worker']), (_req, res) => {
  res.json({ employees: db.getEmployees() });
});

app.get('/api/hygiene/pre-entries', authorize(['admin', 'worker']), (_req, res) => {
  res.json({ preEntries: db.getPreEntries() });
});

app.post('/api/hygiene/verify-pre-entry', authorize(['admin', 'worker']), (req, res) => {
  const {
    employeeId = 'DP-2041',
    cameraLocation = 'Gate A - Processing Hall Airlock',
    simulateMissingPpe = [],
  } = req.body;

  const employee = db.getEmployees().find(e => e.employeeId === employeeId) || db.getEmployees()[0];
  const missingPPE: string[] = simulateMissingPpe;

  const ppeChecks = {
    hairnet: !missingPPE.includes('Hairnet'),
    faceMask: !missingPPE.includes('Face Mask'),
    gloves: !missingPPE.includes('Gloves'),
    apron: !missingPPE.includes('Apron'),
    safetyFootwear: !missingPPE.includes('Safety Shoes'),
  };

  const isApproved = missingPPE.length === 0;

  const verification: PreEntryVerification = {
    id: `VERIF-${Date.now()}`,
    employeeId: employee.employeeId,
    name: employee.name,
    department: employee.department,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' IST',
    facialRecognitionScorePercent: 99.1,
    isFaceRecognized: true,
    ppeChecks,
    missingPPE,
    entryStatus: isApproved ? 'APPROVED' : 'DENIED',
    cameraLocation,
  };

  db.addPreEntry(verification);

  if (!isApproved) {
    db.addAlert({
      id: `ALT-HYG-${Date.now()}`,
      alertId: `ALERT-PPE-${Date.now()}`,
      pillar: 'Hygiene & Cleanliness',
      title: `Pre-Entry Denied: ${employee.name} (${missingPPE.join(', ')})`,
      description: `Access gate barred at ${cameraLocation}. Missing mandatory items: ${missingPPE.join(', ')}.`,
      severity: 'High',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isResolved: false,
      actionUrl: '/pre-entry',
    });
  }

  res.json({ verification });
});

app.get('/api/hygiene/cctv-cameras', authorize(['admin']), (_req, res) => {
  const cameras = [
    { id: 'CAM-01', name: 'Raw Milk Silo Bay 1', location: 'Receiving Dock', status: 'Live 1080p (25 FPS)', violationsToday: 0, previewImg: 'silo' },
    { id: 'CAM-02', name: 'Pasteurizer Flow Channel', location: 'Processing Room Alpha', status: 'Live 1080p (30 FPS)', violationsToday: 1, previewImg: 'pasteurizer' },
    { id: 'CAM-03', name: 'Packaging Hall South Angle', location: 'Pouch Line 4', status: 'Live 1080p (30 FPS)', violationsToday: 2, previewImg: 'packaging' },
    { id: 'CAM-04', name: 'Cold Storage Loading Bay', location: 'Finished Goods Airlock', status: 'Live 1080p (20 FPS)', violationsToday: 0, previewImg: 'coldstorage' },
  ];
  res.json({ cameras });
});

app.get('/api/hygiene/cctv-violations', authorize(['admin']), (_req, res) => {
  res.json({ violations: db.getCctvViolations() });
});

app.post('/api/hygiene/scan-video', authorize(['admin']), (req, res) => {
  const { videoFileName = 'CCTV_Packaging_Line4_ShiftB.mp4' } = req.body;

  // Realistically structured AI Computer Vision frame audit
  const auditReport = {
    fileName: videoFileName,
    videoDurationSec: 480, // 8 minutes
    analyzedFramesCount: 14400,
    fps: 30,
    complianceScorePercent: 88.4,
    detectedViolations: [
      {
        timestamp: '01:24',
        frameNumber: 2520,
        category: 'Missing Face Mask',
        confidence: '95.2%',
        location: 'Packaging Line 4 Discharge',
        severity: 'High',
        evidenceNote: 'Operator adjusted mask below nose while sealing pouches',
      },
      {
        timestamp: '04:15',
        frameNumber: 7650,
        category: 'Face Touching Violation',
        confidence: '91.8%',
        location: 'Pouch Infeed Station',
        severity: 'Medium',
        evidenceNote: 'Gloved hand touched forehead without subsequent sanitizing rub',
      },
      {
        timestamp: '06:50',
        frameNumber: 12300,
        category: 'Visible Product Residue Accumulation',
        confidence: '89.4%',
        location: 'Conveyor Track Belt 3',
        severity: 'Medium',
        evidenceNote: 'Milk drops splashed on guide rails uncleaned for >15 minutes',
      },
    ],
  };

  res.json({ report: auditReport });
});

// ─── Equipment Cleanliness Monitoring ───────────────────────────────────────
app.get('/api/equipment', authorize(['admin', 'worker']), (_req, res) => {
  res.json({ equipment: db.getEquipment() });
});

app.patch('/api/equipment/:id/status', authorize(['admin', 'worker']), (req, res) => {
  const { id } = req.params;
  const { status, remarks, photoUrl } = req.body;
  const updated = db.updateEquipmentStatus(id, status, photoUrl, remarks);
  res.json({ equipment: updated });
});

// ─── Centralized Alert & Notification System ────────────────────────────────
app.get('/api/alerts', authorize(['admin', 'worker']), (_req, res) => {
  res.json({ alerts: db.getAlerts() });
});

app.patch('/api/alerts/:id/resolve', authorize(['admin', 'worker']), (req, res) => {
  const { id } = req.params;
  const resolved = db.resolveAlert(id);
  res.json({ alert: resolved });
});

// ─── Reset Demo Scenario Data (Admin Only) ──────────────────────────────────
app.post('/api/demo/reset', authorize(['admin']), (_req, res) => {
  db.resetDemoData();
  res.json({ success: true, message: 'All demo datasets, scenarios and initial state restored!' });
});

app.listen(PORT, () => {
  console.log(`🚀 DairyPulse Backend API running on http://localhost:${PORT}`);
});

