const calculators = [
  {
    id: "cylindrical-grinding",
    name: "円筒研削条件計算",
    status: "ready",
    description: "砥石周速、砥石直径、切込みから研削条件を計算します。",
    render: renderCylindricalGrindingCalculator
  },
  {
    id: "internal-grinding",
    name: "内径研削条件計算",
    status: "comingSoon"
  },
  {
    id: "surface-grinding",
    name: "平面研削条件計算",
    status: "comingSoon"
  },
  {
    id: "weight",
    name: "重量計算",
    status: "comingSoon"
  },
  {
    id: "taper-angle",
    name: "テーパー角度計算",
    status: "comingSoon"
  }
];

const app = document.getElementById("app");
const menuButtons = document.getElementById("menuButtons");
let currentCalculatorId = "";
let latestResultText = "";

function init() {
  renderMenu();
  renderTopPage();
}

function renderMenu() {
  menuButtons.innerHTML = "";

  calculators.forEach((calculator) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menu-button";
    button.textContent = calculator.name;
    button.addEventListener("click", () => openCalculator(calculator.id));
    menuButtons.appendChild(button);
  });
}

function openCalculator(calculatorId) {
  const calculator = calculators.find((item) => item.id === calculatorId);
  if (!calculator) return;

  currentCalculatorId = calculatorId;
  updateActiveMenu();

  if (calculator.status !== "ready") {
    renderComingSoon(calculator.name);
    return;
  }

  calculator.render(calculator);
}

function updateActiveMenu() {
  const buttons = menuButtons.querySelectorAll(".menu-button");
  buttons.forEach((button, index) => {
    button.classList.toggle("active", calculators[index].id === currentCalculatorId);
  });
}

function renderTopPage() {
  currentCalculatorId = "";
  latestResultText = "";
  updateActiveMenu();
  app.innerHTML = `
    <section class="empty-state">
      <h2>計算メニュー</h2>
      <p>使用する計算を選択してください。</p>
      <button type="button" class="primary-button" id="openFirstCalculator">円筒研削条件計算を開く</button>
    </section>
  `;

  document.getElementById("openFirstCalculator").addEventListener("click", () => {
    openCalculator(calculators[0].id);
  });
}

function renderCylindricalGrindingCalculator(calculator) {
  latestResultText = "";
  app.innerHTML = `
    <div class="panel-heading">
      <h2>${calculator.name}</h2>
      <p>${calculator.description}</p>
    </div>
    <div class="calculator-layout">
      <form class="form-panel" id="grindingForm">
        <div class="form-group">
          <label for="wheelSpeed">砥石周速 a（m/min）</label>
          <input id="wheelSpeed" name="wheelSpeed" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
        </div>
        <div class="form-group">
          <label for="wheelDiameter">砥石直径 b（mm）</label>
          <input id="wheelDiameter" name="wheelDiameter" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
        </div>
        <div class="form-group">
          <label for="cutDepth">切込み e（mm）</label>
          <input id="cutDepth" name="cutDepth" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
        </div>
        <div class="action-row">
          <button type="button" class="primary-button" id="clearButton">クリア</button>
          <button type="button" class="secondary-button" id="printButton">印刷</button>
          <button type="button" class="secondary-button" id="copyButton">結果コピー</button>
          <button type="button" class="secondary-button" id="topButton">トップへ戻る</button>
        </div>
        <p class="copy-status" id="copyStatus" aria-live="polite"></p>
      </form>
      <section class="result-panel" aria-label="計算結果">
        <h3>計算結果</h3>
        <div id="resultArea" class="result-box">
          ${createResultRows("-", "-", "-", "-")}
        </div>
      </section>
    </div>
  `;

  const form = document.getElementById("grindingForm");
  const inputs = form.querySelectorAll("input");
  const clearButton = document.getElementById("clearButton");
  const printButton = document.getElementById("printButton");
  const copyButton = document.getElementById("copyButton");
  const topButton = document.getElementById("topButton");

  inputs.forEach((input) => {
    input.addEventListener("input", calculateCylindricalGrinding);
  });

  clearButton.addEventListener("click", () => {
    inputs.forEach((input) => {
      input.value = "";
    });
    latestResultText = "";
    document.getElementById("resultArea").innerHTML = createResultRows("-", "-", "-", "-");
    setCopyStatus("");
    document.getElementById("wheelSpeed").focus();
  });

  printButton.addEventListener("click", () => window.print());
  copyButton.addEventListener("click", copyLatestResult);
  topButton.addEventListener("click", renderTopPage);
  document.getElementById("wheelSpeed").focus();
}

function calculateCylindricalGrinding() {
  const wheelSpeed = document.getElementById("wheelSpeed").value;
  const wheelDiameter = document.getElementById("wheelDiameter").value;
  const cutDepth = document.getElementById("cutDepth").value;
  const resultArea = document.getElementById("resultArea");

  const values = [
    { label: "砥石周速 a", value: wheelSpeed },
    { label: "砥石直径 b", value: wheelDiameter },
    { label: "切込み e", value: cutDepth }
  ];

  const error = validateInputs(values);
  if (error) {
    latestResultText = "";
    resultArea.innerHTML = `<div class="error-message">${error}</div>`;
    setCopyStatus("");
    return;
  }

  const a = Number(wheelSpeed);
  const b = Number(wheelDiameter);
  const e = Number(cutDepth);

  if (b === 0) {
    latestResultText = "";
    resultArea.innerHTML = `<div class="error-message">砥石直径 b は0より大きい数値を入力してください</div>`;
    setCopyStatus("");
    return;
  }

  const spindleSpeed = (60 * a / Math.PI / b) * 1000;
  const roughCut = spindleSpeed * e;
  const fineCut = roughCut / 3;
  const finishCut = roughCut / 9;

  if (![spindleSpeed, roughCut, fineCut, finishCut].every(Number.isFinite)) {
    latestResultText = "";
    resultArea.innerHTML = `<div class="error-message">計算不能です。入力値を確認してください</div>`;
    setCopyStatus("");
    return;
  }

  const results = {
    spindleSpeed: `${spindleSpeed.toFixed(1)} rpm`,
    roughCut: `${roughCut.toFixed(3)} mm`,
    fineCut: `${fineCut.toFixed(3)} mm`,
    finishCut: `${finishCut.toFixed(3)} mm`
  };

  latestResultText = [
    "円筒研削条件計算",
    `砥石周速 a: ${a} m/min`,
    `砥石直径 b: ${b} mm`,
    `切込み e: ${e} mm`,
    `主軸回転数 f: ${results.spindleSpeed}`,
    `荒切込: ${results.roughCut}`,
    `精研切込: ${results.fineCut}`,
    `仕上切込: ${results.finishCut}`
  ].join("\n");

  resultArea.innerHTML = createResultRows(
    results.spindleSpeed,
    results.roughCut,
    results.fineCut,
    results.finishCut
  );
  setCopyStatus("");
}

function validateInputs(values) {
  const emptyItem = values.find((item) => item.value === "");
  if (emptyItem) {
    return `${emptyItem.label}を入力してください`;
  }

  const nonNumberItem = values.find((item) => Number.isNaN(Number(item.value)));
  if (nonNumberItem) {
    return `${nonNumberItem.label}は数値を入力してください`;
  }

  const zeroItem = values.find((item) => Number(item.value) === 0);
  if (zeroItem) {
    return `${zeroItem.label}は0より大きい数値を入力してください`;
  }

  const negativeItem = values.find((item) => Number(item.value) < 0);
  if (negativeItem) {
    return `${negativeItem.label}は負数ではなく、0より大きい数値を入力してください`;
  }

  return "";
}

function createResultRows(spindleSpeed, roughCut, fineCut, finishCut) {
  return `
    <div class="result-row">
      <div class="result-label">主軸回転数 f</div>
      <div class="result-value">${spindleSpeed}</div>
    </div>
    <div class="result-row">
      <div class="result-label">荒切込</div>
      <div class="result-value">${roughCut}</div>
    </div>
    <div class="result-row">
      <div class="result-label">精研切込</div>
      <div class="result-value">${fineCut}</div>
    </div>
    <div class="result-row">
      <div class="result-label">仕上切込</div>
      <div class="result-value">${finishCut}</div>
    </div>
  `;
}

async function copyLatestResult() {
  if (!latestResultText) {
    setCopyStatus("コピーできる計算結果がありません");
    return;
  }

  try {
    await navigator.clipboard.writeText(latestResultText);
    setCopyStatus("計算結果をコピーしました");
  } catch (error) {
    setCopyStatus("コピーできませんでした。ブラウザの設定を確認してください");
  }
}

function setCopyStatus(message) {
  const copyStatus = document.getElementById("copyStatus");
  if (copyStatus) {
    copyStatus.textContent = message;
  }
}

function renderComingSoon(name) {
  latestResultText = "";
  app.innerHTML = `
    <section class="empty-state">
      <h2>${name}</h2>
      <p>準備中</p>
      <button type="button" class="primary-button" id="backToReady">円筒研削条件計算へ戻る</button>
    </section>
  `;

  document.getElementById("backToReady").addEventListener("click", () => {
    openCalculator(calculators[0].id);
  });
}

init();
