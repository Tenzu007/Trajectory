# DairyPulse 🥛⚡🛡️

> **Unified Dairy Plant Energy, Waste Analytics & AI Hygiene Management System**  
> *A software-only industrial intelligence platform for sustainable, zero-waste, and compliant dairy manufacturing.*

---

## 🌟 Overview & Core Principles

**DairyPulse** is engineered specifically for modern dairy processing plants navigating strict energy quotas, FSSAI hygiene standards, high effluent biological oxygen demand (BOD), and raw milk reconciliation margins.

### Strict Software-Only Design (Zero Hardware Dependency)
- **Zero IoT or physical sensors required**: Operates through manual shift logs, photograph uploads of register sheets, and existing CCTV streams.
- **Strict Mass-Balance Accounting**:
  $$\text{Unexplained Loss} = \text{Total Milk Input} - \text{Finished Products (Eq)} - \text{Rinse Recovered} - \text{Recorded Losses}$$
- **Every Litre & Solid Accounted For**: Tracks fluid volume alongside Fat and SNF (Solids-Not-Fat) degradation.
- **Circular Industrial Waste Exchange**: Transforms unavoidable organic waste (such as food-grade sweet whey and DAF sludge) into secondary raw materials with **Cryptographic Digital Waste Passports (QR)**.
- **Vision-Based Pre-Entry Gate & Surveillance**: Leverages existing factory CCTV infrastructure and webcams for facial biometric gate checks and YOLO PPE violation detection (hairnets, masks, aprons, gloves, shoes).

---

## 🏛️ System Architecture

DairyPulse is organized into 4 cohesive operational pillars:

```
                          ┌────────────────────────┐
                          │   DairyPulse Web App   │
                          │ React 18 + Tailwind    │
                          │   (:5174 Dashboard)    │
                          └───────────┬────────────┘
                                      │ /api Proxy
                                      ▼
                          ┌────────────────────────┐
                          │   Express REST Server  │
                          │    TypeScript (:5050)  │
                          └───────────┬────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│ Part 1: Energy & Power│ │ Part 2: Waste & Loss  │ │ Part 3: AI Hygiene    │
│ • Machine Tracking    │ │ • Mass Balance Ledger │ │ • Biometric Face Gate │
│ • Historical Anomaly  │ │ • Hotspot Stage Map   │ │ • YOLO PPE Detection  │
│ • Solar / Wind Sim    │ │ • Changeover Sched.   │ │ • CCTV Stream Monitor │
│ • Tariff Modeling     │ │ • Rupee Impact Engine │ │ • Video Frame Scanner │
│ • What-If Simulator   │ │ • 3-Tier Classification│ │ • Equipment Matrix   │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x

### 2. Start Both Frontend & Backend
From the `hackathon/` directory:
```bash
# Run both Backend API (:5050) and Frontend Client (:5174) concurrently
npm run dev
```

### 3. Open in Browser
- **Frontend Application**: [http://localhost:5174](http://localhost:5174)
- **Backend API & Health**: [http://localhost:5050/health](http://localhost:5050/health)

---

## 🎯 6 Preloaded Hackathon Demo Scenarios

DairyPulse is pre-seeded with all 6 required evaluation scenarios described in the specification:

| # | Scenario Title | Module | Planted Problem & System Response |
|---|----------------|--------|-----------------------------------|
| **1** | **Unexplained Milk Loss Spike** | Daily Loss Ledger | Shift B received 50,000L milk; only 46,600L product-eq and 280L rinse accounted for. Unexplained loss of **1,000L (2.06%)** triggers a **Critical Alert** (exceeds 1.5% limit; ₹45,000 impact). |
| **2** | **Excessive Changeover Loss** | Changeover Tracker | Packaging Line 2 drained **180L** (baseline 50L) transitioning from Chocolate Milk to Plain Milk. Engine recommends reversing schedule: **"Plain Milk before Flavoured Milk"** to save 130L/cycle. |
| **3** | **Recurring Tank 3 Valve Leak** | Leak Reporter | Valve near Tank 3 has leaked **5 times this month** with 400L total loss. Automated repeat-detection triggers a **Critical Hardware Alert** (₹18,400 financial loss) and maintenance ticket. |
| **4** | **Packaging Efficiency Dip** | Packaging Yield | Pouch Machine 4 achieved only **1,120 pouches/kg** (vs 1,250 expected) with **450 leaking pouches** (89.6% efficiency). Heat-seal jaw recalibration flagged. |
| **5** | **Circular Industrial Exchange** | Industrial Exchange | 3,500L surplus Sweet Whey AI-classified as **Reusable** (96.5% confidence) and matched with **BakeCraft Agro Ingredients** (+₹18,250 net value). Generates scannable **Digital Waste Passport QR**. |
| **6** | **What-If Strategy Simulator** | Rupee Impact Engine | Interactive sliders model recovering **70% of rinse milk**, fixing Tank 3 leak, and trimming 2 idle hours. Projects **+₹1,41,750/month bottom-line EBITDA gain**. |

---

## 🎨 UI/UX Design System (Part 4)

Following the nature-inspired sustainability theme:
- **Warm Ivory Background**: `#FAF8F2`
- **Soft Cream Cards**: `#F5F1E8`
- **Muted Sage Green**: `#AFC4AD`
- **Deep Forest Green Accent**: `#526B58`
- **Deep Olive Header**: `#354C3C`
- **Typography**: Playfair Display (Serif Headings) + Plus Jakarta Sans (Body & Data Tables).

---

## 🛠️ Verification & Test
- Server Typecheck: `cd server && npx tsc --noEmit` &rarr; 0 errors
- Client Typecheck: `cd client && npx tsc --noEmit` &rarr; 0 errors
- Production Client Build: `cd client && npx vite build` &rarr; Compiled successfully in 2.70s!

