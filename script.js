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
    status: "ready",
    description: "鉄系材料（密度7.85g/cm³）の丸棒・中空丸棒の概算重量を計算します。",
    render: renderWeightCalculator
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
  updateActiveMenu();
  app.innerHTML = `
    <section class="empty-state">
      <h2>使用する計算を選択してください。</h2>
      <button type="button" class="primary-button" id="openFirstCalculator">円筒研削条件計算を開く</button>
    </section>
  `;

  document.getElementById("openFirstCalculator").addEventListener("click", () => {
    openCalculator(calculators[0].id);
  });
}

function renderCylindricalGrindingCalculator(calculator) {
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
        </div>
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

  inputs.forEach((input) => {
    input.addEventListener("input", calculateCylindricalGrinding);
  });

  clearButton.addEventListener("click", () => {
    inputs.forEach((input) => {
      input.value = "";
    });
    document.getElementById("resultArea").innerHTML = createResultRows("-", "-", "-", "-");
    document.getElementById("wheelSpeed").focus();
  });

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
    resultArea.innerHTML = `<div class="error-message">${error}</div>`;
    return;
  }

  const a = Number(wheelSpeed);
  const b = Number(wheelDiameter);
  const e = Number(cutDepth);

  if (b === 0) {
    resultArea.innerHTML = `<div class="error-message">砥石直径 b は0より大きい数値を入力してください</div>`;
    return;
  }

  const spindleSpeed = (60 * a / Math.PI / b) * 1000;
  const roughCut = spindleSpeed * e;
  const fineCut = roughCut / 3;
  const finishCut = roughCut / 9;

  if (![spindleSpeed, roughCut, fineCut, finishCut].every(Number.isFinite)) {
    resultArea.innerHTML = `<div class="error-message">計算不能です。入力値を確認してください</div>`;
    return;
  }

  const results = {
    spindleSpeed: `${spindleSpeed.toFixed(1)} rpm`,
    roughCut: `${roughCut.toFixed(3)} mm`,
    fineCut: `${fineCut.toFixed(3)} mm`,
    finishCut: `${finishCut.toFixed(3)} mm`
  };

  resultArea.innerHTML = createResultRows(
    results.spindleSpeed,
    results.roughCut,
    results.fineCut,
    results.finishCut
  );
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

function renderWeightCalculator(calculator) {
  app.innerHTML = `
    <div class="panel-heading">
      <h2>${calculator.name}</h2>
      <p>${calculator.description}</p>
    </div>
    <div class="shape-switch" role="group" aria-label="形状切替">
      <button type="button" class="shape-button active" data-shape="solid">丸棒</button>
      <button type="button" class="shape-button" data-shape="pipe">中空丸棒（パイプ）</button>
    </div>
    <div class="calculator-layout">
      <form class="form-panel" id="weightForm">
        <div class="form-group">
          <label for="outerDiameter">外径 D（mm）</label>
          <input id="outerDiameter" name="outerDiameter" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
        </div>
        <div class="form-group" id="innerDiameterGroup" hidden>
          <label for="innerDiameter">内径 d（mm）</label>
          <input id="innerDiameter" name="innerDiameter" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
        </div>
        <div class="form-group">
          <label for="materialLength">長さ L（mm）</label>
          <input id="materialLength" name="materialLength" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
        </div>
        <div class="fixed-condition">鉄系材料密度: 7.85 g/cm³</div>
        <div class="action-row">
          <button type="button" class="primary-button" id="clearWeightButton">クリア</button>
        </div>
      </form>
      <section class="result-panel" aria-label="計算結果">
        <h3>計算結果</h3>
        <div id="weightResultArea" class="result-box">
          ${createWeightResultRow("-")}
        </div>
        <p class="calculation-note">本計算は鉄系材料（密度7.85g/cm³）の概算重量です。実際の重量は材質、寸法公差、穴加工などにより変動します。</p>
      </section>
    </div>
  `;

  const form = document.getElementById("weightForm");
  const inputs = form.querySelectorAll("input");
  const clearButton = document.getElementById("clearWeightButton");
  const shapeButtons = document.querySelectorAll(".shape-button");

  shapeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setWeightShape(button.dataset.shape);
      calculateWeight();
    });
  });

  inputs.forEach((input) => {
    input.addEventListener("input", calculateWeight);
  });

  clearButton.addEventListener("click", () => {
    inputs.forEach((input) => {
      input.value = "";
    });
    document.getElementById("weightResultArea").innerHTML = createWeightResultRow("-");
    document.getElementById("outerDiameter").focus();
  });

  document.getElementById("outerDiameter").focus();
}

function setWeightShape(shape) {
  const isPipe = shape === "pipe";
  document.getElementById("innerDiameterGroup").hidden = !isPipe;
  document.querySelectorAll(".shape-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.shape === shape);
  });

  if (!isPipe) {
    document.getElementById("innerDiameter").value = "";
  }
}

function calculateWeight() {
  const shape = document.querySelector(".shape-button.active").dataset.shape;
  const outerDiameter = document.getElementById("outerDiameter").value;
  const innerDiameter = document.getElementById("innerDiameter").value;
  const materialLength = document.getElementById("materialLength").value;
  const resultArea = document.getElementById("weightResultArea");
  const values = [
    { label: "外径 D", value: outerDiameter },
    { label: "長さ L", value: materialLength }
  ];

  if (shape === "pipe") {
    values.splice(1, 0, { label: "内径 d", value: innerDiameter });
  }

  const error = validateInputs(values);
  if (error) {
    resultArea.innerHTML = `<div class="error-message">${error}</div>`;
    return;
  }

  const D = Number(outerDiameter);
  const d = Number(innerDiameter);
  const L = Number(materialLength);

  if (shape === "pipe" && d >= D) {
    resultArea.innerHTML = `<div class="error-message">内径 d は外径 D より小さい数値を入力してください</div>`;
    return;
  }

  const density = 7.85;
  const volume = shape === "pipe"
    ? Math.PI * ((D / 2) ** 2 - (d / 2) ** 2) * L
    : Math.PI * (D / 2) ** 2 * L;
  const weight = volume * density / 1000000;

  if (!Number.isFinite(weight) || weight <= 0) {
    resultArea.innerHTML = `<div class="error-message">計算不能です。入力値を確認してください</div>`;
    return;
  }

  resultArea.innerHTML = createWeightResultRow(`${weight.toFixed(3)} kg`);
}

function createWeightResultRow(weight) {
  return `
    <div class="result-row">
      <div class="result-label">重量</div>
      <div class="result-value">${weight}</div>
    </div>
  `;
}

function renderComingSoon(name) {
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
