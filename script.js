const campuses = {
  Lucknow: { year1: 7.7, year2: 7.55, total: 15.25 },
  Noida: { year1: 8.3, year2: 8.2, total: 16.5 },
  Jaipur: { year1: 7.5, year2: 7.25, total: 14.75 },
  Indore: { year1: 6.8, year2: 6.7, total: 13.5 },
};

const preMbaSalaryOptions = [0, 4, 5, 6, 7, 8, 9, 10];
const preMbaGrowthOptions = [6, 7, 8, 9, 10];
const projectionYears = 30;

const placementLevels = [
  { id: "top10", label: "Top 10%", salary: 15 },
  { id: "top25", label: "Top 25%", salary: 13.5 },
  { id: "top50", label: "Top 50%", salary: 12 },
  { id: "median", label: "Median", salary: 10.5 },
];

const postMbaGrowthOptions = [
  { id: "high", label: "High", growth: 16 },
  { id: "median", label: "Median", growth: 14 },
  { id: "low", label: "Low", growth: 12 },
  { id: "conservative", label: "Conservative", growth: 10 },
];

const benchmarkReturns = [
  { id: "mba", label: "Your MBA IRR", value: null },
  { id: "market", label: "Nifty return (30 yr)", value: 12.74 },
  { id: "summit", label: "Summit Securities", value: 16.1 },
  { id: "gold", label: "Gold", value: 9 },
  { id: "fd", label: "FD", value: 7 },
];

const state = {
  placementLevel: "median",
  postMbaGrowth: "median",
};

const rupeeLakhs = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

function formatLakhs(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}₹${rupeeLakhs.format(Math.abs(value))}L`;
}

function formatLakhsRounded(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}₹${Math.round(Math.abs(value)).toLocaleString("en-IN")}L`;
}

function formatCrores(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}₹${(Math.abs(value) / 100).toFixed(1)}Cr`;
}

function formatPercent(value, digits = 1) {
  if (!Number.isFinite(value)) return "Not viable";
  return `${value.toFixed(digits)}%`;
}

function academicYearLabel(startYear) {
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

function populateSelects() {
  const campusSelect = document.querySelector("#campus");
  campusSelect.innerHTML = Object.keys(campuses)
    .map((campus) => `<option value="${campus}">${campus}</option>`)
    .join("");

  const salarySelect = document.querySelector("#preMbaSalary");
  salarySelect.innerHTML = preMbaSalaryOptions
    .map((salary) => `<option value="${salary}">₹${salary} lakh</option>`)
    .join("");
  salarySelect.value = "0";

  const growthSelect = document.querySelector("#preMbaGrowth");
  growthSelect.innerHTML = preMbaGrowthOptions
    .map((growth) => `<option value="${growth}">${growth}%</option>`)
    .join("");
  growthSelect.value = "7";
}

function createChoices(containerId, options, stateKey, valueKey) {
  const container = document.querySelector(containerId);
  container.innerHTML = options
    .map(
      (option) => `
        <button class="choice" type="button" data-id="${option.id}" aria-pressed="${state[stateKey] === option.id}">
          ${option.label}<br><small>₹${option[valueKey]}L</small>
        </button>
      `,
    )
    .join("");

  container.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    state[stateKey] = button.dataset.id;
    container.querySelectorAll("button").forEach((choice) => {
      choice.setAttribute("aria-pressed", choice.dataset.id === state[stateKey]);
    });
    updateCalculator();
  });
}

function createGrowthChoices() {
  const container = document.querySelector("#postMbaGrowth");
  container.innerHTML = postMbaGrowthOptions
    .map(
      (option) => `
        <button class="choice" type="button" data-id="${option.id}" aria-pressed="${state.postMbaGrowth === option.id}">
          ${option.label}<br><small>${option.growth}%</small>
        </button>
      `,
    )
    .join("");

  container.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    state.postMbaGrowth = button.dataset.id;
    container.querySelectorAll("button").forEach((choice) => {
      choice.setAttribute("aria-pressed", choice.dataset.id === state.postMbaGrowth);
    });
    updateCalculator();
  });
}

function populateFeeTable() {
  const rows = Object.entries(campuses)
    .map(
      ([campus, fee]) => `
        <tr>
          <td>${campus}</td>
          <td>${formatLakhs(fee.year1)}</td>
          <td>${formatLakhs(fee.year2)}</td>
          <td>${formatLakhs(fee.total)}</td>
        </tr>
      `,
    )
    .join("");
  document.querySelector("#feeTable").innerHTML = rows;
}

function calculateIrr(cashFlows) {
  const hasPositive = cashFlows.some((flow) => flow > 0);
  const hasNegative = cashFlows.some((flow) => flow < 0);
  if (!hasPositive || !hasNegative) return Number.NaN;

  let low = -0.95;
  let high = 5;

  const npv = (rate) =>
    cashFlows.reduce((sum, flow, index) => sum + flow / (1 + rate) ** index, 0);

  let lowNpv = npv(low);
  let highNpv = npv(high);
  let attempts = 0;

  while (lowNpv * highNpv > 0 && attempts < 20) {
    high *= 2;
    highNpv = npv(high);
    attempts += 1;
  }

  if (lowNpv * highNpv > 0) return Number.NaN;

  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2;
    const midNpv = npv(mid);
    if (Math.abs(midNpv) < 0.00001) return mid * 100;
    if (lowNpv * midNpv < 0) {
      high = mid;
      highNpv = midNpv;
    } else {
      low = mid;
      lowNpv = midNpv;
    }
  }

  return ((low + high) / 2) * 100;
}

function buildCashFlowRows({ fee, preSalary, preGrowth, postSalary, postGrowth, years }) {
  const rows = [];
  const year0LostSalary = preSalary;
  const year1LostSalary = preSalary * (1 + preGrowth);

  rows.push({
    label: academicYearLabel(2026),
    scaleGroup: "study",
    total: -(fee.year1 + year0LostSalary),
    parts: [
      { label: "Fee", value: fee.year1, type: "fee" },
      { label: "Foregone salary", value: year0LostSalary, type: "lost" },
    ],
  });

  rows.push({
    label: academicYearLabel(2027),
    scaleGroup: "study",
    total: -(fee.year2 + year1LostSalary),
    parts: [
      { label: "Fee", value: fee.year2, type: "fee" },
      { label: "Foregone salary", value: year1LostSalary, type: "lost" },
    ],
  });

  for (let year = 0; year < years; year += 1) {
    const noMbaSalary = preSalary * (1 + preGrowth) ** (year + 2);
    const mbaSalary = postSalary * (1 + postGrowth) ** year;
    rows.push({
      label: academicYearLabel(2028 + year),
      scaleGroup: "work",
      total: mbaSalary - noMbaSalary,
      foregoneSalary: noMbaSalary,
      postMbaSalary: mbaSalary,
      parts: [{ label: "Incremental salary", value: mbaSalary - noMbaSalary, type: "positive" }],
    });
  }

  return rows;
}

function renderInvestmentSplit({ fee, preSalary, preGrowth }) {
  const foregoneSalary = preSalary + preSalary * (1 + preGrowth);
  const total = fee.total + foregoneSalary;
  document.querySelector("#investmentSplit").innerHTML = `
    <article>
      <span>Total Jaipuria fee</span>
      <strong>${formatLakhs(fee.total)}</strong>
    </article>
    <article>
      <span>Total foregone salary</span>
      <strong>${formatLakhs(foregoneSalary)}</strong>
    </article>
    <article>
      <span>Investment used in IRR</span>
      <strong>${formatLakhs(total)}</strong>
    </article>
  `;
}

function renderBenchmarks(irr) {
  const benchmarks = benchmarkReturns.map((benchmark) => ({
    ...benchmark,
    value: benchmark.id === "mba" ? irr : benchmark.value,
  }));
  const validValues = benchmarks
    .map((benchmark) => benchmark.value)
    .filter((value) => Number.isFinite(value));
  const maxValue = Math.max(15, ...validValues, 0);

  document.querySelector("#benchmarkBars").innerHTML = benchmarks
    .map((benchmark) => {
      const isViable = Number.isFinite(benchmark.value);
      const width = isViable ? Math.max((Math.max(benchmark.value, 0) / maxValue) * 100, 4) : 4;
      const value = isViable ? formatPercent(benchmark.value, benchmark.id === "market" ? 2 : 1) : "Not viable";
      return `
        <div class="benchmark-row">
          <span>${benchmark.label}</span>
          <div class="benchmark-track">
            <div class="benchmark-fill ${benchmark.id}" style="width: ${width}%"></div>
          </div>
          <span class="benchmark-value">${value}</span>
        </div>
      `;
    })
    .join("");

  const fd = benchmarkReturns.find((benchmark) => benchmark.id === "fd").value;
  const gold = benchmarkReturns.find((benchmark) => benchmark.id === "gold").value;
  const market = benchmarkReturns.find((benchmark) => benchmark.id === "market").value;
  const summit = benchmarkReturns.find((benchmark) => benchmark.id === "summit").value;
  const note = Number.isFinite(irr)
    ? `This MBA case is ${(irr - market).toFixed(1)} pp vs Nifty, ${(irr - summit).toFixed(1)} pp vs Summit Securities (incl. subsidiaries), ${(irr - gold).toFixed(1)} pp vs gold, and ${(irr - fd).toFixed(1)} pp vs FD.`
    : "This MBA case does not generate a viable IRR within the selected projection horizon.";
  document.querySelector("#benchmarkNote").textContent = note;
}

function partValue(row, type) {
  return row.parts.find((part) => part.type === type)?.value || 0;
}

function renderCashflowTable(rows) {
  const tableRows = rows
    .map((row) => {
      const fee = partValue(row, "fee");
      const lostSalary = partValue(row, "lost") || row.foregoneSalary || 0;
      const postMbaSalary = row.postMbaSalary || 0;
      const incrementalSalary = partValue(row, "positive");
      const netClass = row.total < 0 ? "negative-cell" : "positive-cell";
      const formatCell = (value, className = "") =>
        value ? `<td class="${className}">${formatLakhs(value)}</td>` : `<td class="empty-cell">--</td>`;

      return `
        <tr>
          <td>${row.label}</td>
          ${formatCell(fee, "negative-cell")}
          ${formatCell(lostSalary, "negative-cell")}
          ${formatCell(postMbaSalary)}
          ${formatCell(incrementalSalary, "positive-cell")}
          <td class="total-cell ${netClass}">${formatLakhs(row.total)}</td>
        </tr>
      `;
    })
    .join("");

  const totals = rows.reduce(
    (sum, row) => {
      sum.fee += partValue(row, "fee");
      sum.lostSalary += partValue(row, "lost") || row.foregoneSalary || 0;
      sum.postMbaSalary += row.postMbaSalary || 0;
      sum.incrementalSalary += partValue(row, "positive");
      sum.net += row.total;
      return sum;
    },
    { fee: 0, lostSalary: 0, postMbaSalary: 0, incrementalSalary: 0, net: 0 },
  );

  const totalNetClass = totals.net < 0 ? "negative-cell" : "positive-cell";
  const totalRow = `
    <tr class="cashflow-total-row">
      <td>Total</td>
      <td class="negative-cell">${formatLakhs(totals.fee)}</td>
      <td class="negative-cell">${formatLakhs(totals.lostSalary)}</td>
      <td>${formatLakhs(totals.postMbaSalary)}</td>
      <td class="positive-cell">${formatLakhs(totals.incrementalSalary)}</td>
      <td class="total-cell ${totalNetClass}">${formatLakhs(totals.net)}</td>
    </tr>
  `;

  document.querySelector("#cashflowRows").innerHTML = tableRows + totalRow;
}

function updateCalculator() {
  const campus = document.querySelector("#campus").value;
  const fee = campuses[campus];
  const preSalary = Number(document.querySelector("#preMbaSalary").value);
  const preGrowth = Number(document.querySelector("#preMbaGrowth").value) / 100;
  const years = projectionYears;
  const placement = placementLevels.find((item) => item.id === state.placementLevel);
  const growth = postMbaGrowthOptions.find((item) => item.id === state.postMbaGrowth);

  const rows = buildCashFlowRows({
    fee,
    preSalary,
    preGrowth,
    postSalary: placement.salary,
    postGrowth: growth.growth / 100,
    years,
  });
  const cashFlows = rows.map((row) => row.total);

  const irr = calculateIrr(cashFlows);
  const totalInvestment = Math.abs(cashFlows[0]) + Math.abs(cashFlows[1]);
  const netGain = cashFlows.reduce((sum, flow) => sum + flow, 0);

  document.querySelector("#irrValue").textContent = formatPercent(irr);
  document.querySelector("#heroIrr").textContent = formatPercent(irr);
  document.querySelector("#investmentValue").textContent = formatLakhs(totalInvestment);
  document.querySelector("#netGainValue").textContent = formatCrores(netGain);
  document.querySelector("#scenarioLabel").textContent = `${campus}, ${placement.label}, ${growth.label} growth`;

  renderBenchmarks(irr);
  renderInvestmentSplit({ fee, preSalary, preGrowth });
  renderCashflowTable(rows);
}

function bindInputs() {
  ["campus", "preMbaSalary", "preMbaGrowth"].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener("input", updateCalculator);
  });
}

populateSelects();
createChoices("#placementLevel", placementLevels, "placementLevel", "salary");
createGrowthChoices();
populateFeeTable();
bindInputs();
updateCalculator();
