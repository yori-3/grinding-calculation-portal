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
    status: "comingSoon",
    visible: false
  },
  {
    id: "surface-grinding",
    name: "平面研削条件計算",
    status: "comingSoon",
    visible: false
  },
  {
    id: "weight",
    name: "重量計算",
    status: "ready",
    description: "鉄系材料（密度7.85g/cm³）の丸棒・中空丸棒の概算重量を計算します。",
    render: renderWeightCalculator
  },
  {
    id: "jis-fit-tolerance",
    name: "JISはめあい公差検索",
    status: "ready",
    description: "呼び径と公差記号から、JISはめあい公差と狙い値を検索します。",
    render: renderJisFitToleranceCalculator
  },
  {
    id: "taper-angle",
    name: "テーパー角度計算",
    status: "ready",
    description: "図面条件からテーパー角度、径、長さを計算します。",
    render: renderTaperCalculator
  }
];

const app = document.getElementById("app");
const menuButtons = document.getElementById("menuButtons");
let currentCalculatorId = "";

function init() {
  renderMenu();
  openCalculator("cylindrical-grinding");
}

function renderMenu() {
  menuButtons.innerHTML = "";

  calculators.filter((calculator) => calculator.visible !== false).forEach((calculator) => {
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
  const visibleCalculators = calculators.filter((calculator) => calculator.visible !== false);
  buttons.forEach((button, index) => {
    button.classList.toggle("active", visibleCalculators[index].id === currentCalculatorId);
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

function renderJisFitToleranceCalculator(calculator) {
  app.innerHTML = `
    <div class="panel-heading">
      <h2>${calculator.name}</h2>
      <p>${calculator.description}</p>
    </div>
    <div class="calculator-layout compact-calculator-layout">
      <form class="form-panel" id="toleranceForm">
        <div class="form-group">
          <label for="nominalDiameter">呼び径</label>
          <input id="nominalDiameter" name="nominalDiameter" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
        </div>
        <div class="form-group">
          <label for="toleranceSymbol">公差記号</label>
          <select id="toleranceSymbol" name="toleranceSymbol">
            <option value="">選択してください</option>
            ${createToleranceOptions()}
          </select>
        </div>
        <div class="action-row">
          <button type="button" class="primary-button" id="clearToleranceButton">クリア</button>
        </div>
      </form>
      <section class="result-panel tolerance-result-panel" aria-label="検索結果">
        <h3>検索結果</h3>
        <div id="toleranceResultArea" class="result-box">
          ${createToleranceResultRows()}
        </div>
      </section>
    </div>
  `;

  const form = document.getElementById("toleranceForm");
  const inputs = form.querySelectorAll("input, select");
  const clearButton = document.getElementById("clearToleranceButton");

  inputs.forEach((input) => {
    input.addEventListener("input", calculateJisFitTolerance);
    input.addEventListener("change", calculateJisFitTolerance);
  });

  clearButton.addEventListener("click", () => {
    document.getElementById("nominalDiameter").value = "";
    document.getElementById("toleranceSymbol").value = "";
    document.getElementById("toleranceResultArea").innerHTML = createToleranceResultRows();
    document.getElementById("nominalDiameter").focus();
  });

  document.getElementById("nominalDiameter").focus();
}

function createToleranceOptions() {
  const data = window.toleranceData || { shaft: {}, hole: {} };
  const order = window.toleranceSymbolOrder || { shaft: [], hole: [] };
  const shaftOptions = order.shaft
    .filter((symbol) => data.shaft[symbol])
    .map((symbol) => `<option value="${symbol}">${symbol}</option>`)
    .join("");
  const holeOptions = order.hole
    .filter((symbol) => data.hole[symbol])
    .map((symbol) => `<option value="${symbol}">${symbol}</option>`)
    .join("");

  return `
    <optgroup label="軸公差">
      ${shaftOptions}
    </optgroup>
    <optgroup label="穴公差">
      ${holeOptions}
    </optgroup>
  `;
}

function calculateJisFitTolerance() {
  const nominalDiameter = document.getElementById("nominalDiameter").value;
  const symbol = document.getElementById("toleranceSymbol").value;
  const resultArea = document.getElementById("toleranceResultArea");
  const values = [{ label: "呼び径", value: nominalDiameter }];
  const error = validateInputs(values);

  if (error) {
    resultArea.innerHTML = `<div class="error-message">${error}</div>`;
    return;
  }

  if (symbol === "") {
    resultArea.innerHTML = `<div class="error-message">公差記号を選択してください</div>`;
    return;
  }

  const data = window.toleranceData || { shaft: {}, hole: {} };
  const type = data.shaft[symbol] ? "shaft" : data.hole[symbol] ? "hole" : "";
  if (!type) {
    resultArea.innerHTML = `<div class="error-message">該当するJIS公差データが登録されていません。</div>`;
    return;
  }

  const diameter = Number(nominalDiameter);
  const tolerance = data[type][symbol].find((item) => item.min < diameter && diameter <= item.max);
  if (!tolerance) {
    resultArea.innerHTML = `<div class="error-message">該当するJIS公差データが登録されていません。</div>`;
    return;
  }

  const upperDimension = diameter + tolerance.upper / 1000;
  const lowerDimension = diameter + tolerance.lower / 1000;
  const targetDimension = diameter + ((tolerance.upper / 1000 + tolerance.lower / 1000) / 2);

  if (![upperDimension, lowerDimension, targetDimension].every(Number.isFinite)) {
    resultArea.innerHTML = `<div class="error-message">計算不能です。入力値を確認してください</div>`;
    return;
  }

  resultArea.innerHTML = createToleranceResultRows({
    nominalDiameter: formatCompactNumber(diameter),
    symbol,
    upperTolerance: formatToleranceMillimeter(tolerance.upper),
    lowerTolerance: formatToleranceMillimeter(tolerance.lower),
    upperDimension: upperDimension.toFixed(3),
    lowerDimension: lowerDimension.toFixed(3),
    targetDimension: targetDimension.toFixed(3)
  });
}

function createToleranceResultRows(result = {}) {
  const rows = [
    { label: "狙い値", value: result.targetDimension || "-", className: "target-result-row" },
    { label: "呼び径", value: result.nominalDiameter || "-" },
    { label: "公差記号", value: result.symbol || "-" },
    { label: "上限公差", value: result.upperTolerance || "-" },
    { label: "下限公差", value: result.lowerTolerance || "-" },
    { label: "上限寸法", value: result.upperDimension || "-" },
    { label: "下限寸法", value: result.lowerDimension || "-" }
  ];

  return rows.map((row) => `
    <div class="result-row ${row.className || ""}">
      <div class="result-label">${row.label}</div>
      <div class="result-value">${row.value}</div>
    </div>
  `).join("");
}

function formatCompactNumber(value) {
  return Number.isInteger(value) ? String(value) : String(value);
}

function formatToleranceMillimeter(value) {
  const millimeterValue = value / 1000;
  return millimeterValue === 0 ? "0" : millimeterValue.toFixed(3);
}

function renderTaperCalculator(calculator) {
  app.innerHTML = `
    <div class="panel-heading">
      <h2>${calculator.name}</h2>
      <p>${calculator.description}</p>
    </div>
    <div class="mode-switch" role="group" aria-label="テーパー計算モード切替">
      <button type="button" class="mode-button active" data-mode="angle">角度を求める</button>
      <button type="button" class="mode-button" data-mode="diameter">径を求める</button>
      <button type="button" class="mode-button" data-mode="length">長さを求める</button>
    </div>
    <div class="calculator-layout">
      <form class="form-panel" id="taperForm">
        <div id="taperInputArea"></div>
        <div class="action-row">
          <button type="button" class="primary-button" id="clearTaperButton">クリア</button>
        </div>
      </form>
      <section class="result-panel" aria-label="計算結果">
        <h3>計算結果</h3>
        <div id="taperResultArea" class="result-box">
          ${createTaperResultRows([{ label: "結果", value: "-" }])}
        </div>
        <p class="calculation-note">本計算は一般的な円錐テーパーを対象としています。角度は片側角度を基準に計算しています。図面が片側角度か全角度かを確認して使用してください。</p>
      </section>
    </div>
  `;

  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => {
      setTaperMode(button.dataset.mode);
    });
  });

  document.getElementById("clearTaperButton").addEventListener("click", clearTaperInputs);
  setTaperMode("angle");
}

function setTaperMode(mode) {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

  document.getElementById("taperInputArea").innerHTML = getTaperInputs(mode);
  document.getElementById("taperResultArea").innerHTML = createTaperResultRows([{ label: "結果", value: "-" }]);

  const form = document.getElementById("taperForm");
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", calculateTaper);
    input.addEventListener("change", calculateTaper);
  });

  const firstInput = form.querySelector("input[type='number']");
  if (firstInput) {
    firstInput.focus();
  }
}

function getTaperInputs(mode) {
  if (mode === "diameter") {
    return `
      <div class="form-group">
        <label for="baseDiameter">基準径（mm）</label>
        <input id="baseDiameter" name="baseDiameter" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
      </div>
      <div class="form-group">
        <label for="diameterLength">テーパー長 L（mm）</label>
        <input id="diameterLength" name="diameterLength" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
      </div>
      <div class="form-group">
        <label for="diameterAngle">片側角度 θ（度）</label>
        <input id="diameterAngle" name="diameterAngle" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
      </div>
      <div class="form-group">
        <div class="field-label">計算方向</div>
        <div class="radio-group">
          <label class="radio-option">
            <input type="radio" name="diameterDirection" value="largeToSmall" checked>
            大径から小径を求める
          </label>
          <label class="radio-option">
            <input type="radio" name="diameterDirection" value="smallToLarge">
            小径から大径を求める
          </label>
        </div>
      </div>
    `;
  }

  if (mode === "length") {
    return `
      <div class="form-group">
        <label for="lengthLargeDiameter">大径 D（mm）</label>
        <input id="lengthLargeDiameter" name="lengthLargeDiameter" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
      </div>
      <div class="form-group">
        <label for="lengthSmallDiameter">小径 d（mm）</label>
        <input id="lengthSmallDiameter" name="lengthSmallDiameter" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
      </div>
      <div class="form-group">
        <label for="lengthAngle">片側角度 θ（度）</label>
        <input id="lengthAngle" name="lengthAngle" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
      </div>
    `;
  }

  return `
    <div class="form-group">
      <label for="largeDiameter">大径 D（mm）</label>
      <input id="largeDiameter" name="largeDiameter" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
    </div>
    <div class="form-group">
      <label for="smallDiameter">小径 d（mm）</label>
      <input id="smallDiameter" name="smallDiameter" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
    </div>
    <div class="form-group">
      <label for="taperLength">テーパー長 L（mm）</label>
      <input id="taperLength" name="taperLength" type="number" inputmode="decimal" min="0" step="any" autocomplete="off">
    </div>
  `;
}

function calculateTaper() {
  const mode = document.querySelector(".mode-button.active").dataset.mode;
  const resultArea = document.getElementById("taperResultArea");
  const calculation = mode === "diameter"
    ? calculateTaperDiameter()
    : mode === "length"
      ? calculateTaperLength()
      : calculateTaperAngle();

  if (calculation.error) {
    resultArea.innerHTML = `<div class="error-message">${calculation.error}</div>`;
    return;
  }

  resultArea.innerHTML = createTaperResultRows(calculation.rows);
}

function calculateTaperAngle() {
  const largeDiameter = document.getElementById("largeDiameter").value;
  const smallDiameter = document.getElementById("smallDiameter").value;
  const taperLength = document.getElementById("taperLength").value;
  const values = [
    { label: "大径 D", value: largeDiameter },
    { label: "小径 d", value: smallDiameter },
    { label: "テーパー長 L", value: taperLength }
  ];
  const error = validateInputs(values);
  if (error) return { error };

  const D = Number(largeDiameter);
  const d = Number(smallDiameter);
  const L = Number(taperLength);
  if (D <= d) {
    return { error: "大径 D は小径 d より大きい数値を入力してください" };
  }

  const diameterDifference = D - d;
  const oneSideAngle = radToDeg(Math.atan((diameterDifference / 2) / L));
  const fullAngle = oneSideAngle * 2;
  const slopeValue = L / diameterDifference;

  if (![diameterDifference, oneSideAngle, fullAngle, slopeValue].every(Number.isFinite)) {
    return { error: "計算不能です。入力値を確認してください" };
  }

  return {
    rows: [
      { label: "径差", value: `${diameterDifference.toFixed(3)} mm` },
      { label: "片側角度", value: `${oneSideAngle.toFixed(4)} °` },
      { label: "片側角度（度分秒）", value: formatDms(oneSideAngle) },
      { label: "全角度", value: `${fullAngle.toFixed(4)} °` },
      { label: "全角度（度分秒）", value: formatDms(fullAngle) },
      { label: "勾配", value: `1/${slopeValue.toFixed(3)}` }
    ]
  };
}

function calculateTaperDiameter() {
  const baseDiameter = document.getElementById("baseDiameter").value;
  const diameterLength = document.getElementById("diameterLength").value;
  const diameterAngle = document.getElementById("diameterAngle").value;
  const direction = document.querySelector("input[name='diameterDirection']:checked").value;
  const values = [
    { label: "基準径", value: baseDiameter },
    { label: "テーパー長 L", value: diameterLength },
    { label: "片側角度 θ", value: diameterAngle }
  ];
  const error = validateInputs(values);
  if (error) return { error };

  const base = Number(baseDiameter);
  const L = Number(diameterLength);
  const theta = Number(diameterAngle);
  const diameterDifference = 2 * L * Math.tan(degToRad(theta));
  const calculatedDiameter = direction === "largeToSmall"
    ? base - diameterDifference
    : base + diameterDifference;
  const calculatedLabel = direction === "largeToSmall" ? "計算後の径（小径）" : "計算後の径（大径）";

  if (![diameterDifference, calculatedDiameter].every(Number.isFinite)) {
    return { error: "計算不能です。入力値を確認してください" };
  }

  if (calculatedDiameter <= 0) {
    return { error: "計算後の径が0以下になります。入力値を確認してください" };
  }

  return {
    rows: [
      { label: "径差", value: `${diameterDifference.toFixed(3)} mm` },
      { label: calculatedLabel, value: `${calculatedDiameter.toFixed(3)} mm` },
      { label: "全角度", value: `${(theta * 2).toFixed(4)} °` }
    ]
  };
}

function calculateTaperLength() {
  const largeDiameter = document.getElementById("lengthLargeDiameter").value;
  const smallDiameter = document.getElementById("lengthSmallDiameter").value;
  const taperAngle = document.getElementById("lengthAngle").value;
  const values = [
    { label: "大径 D", value: largeDiameter },
    { label: "小径 d", value: smallDiameter },
    { label: "片側角度 θ", value: taperAngle }
  ];
  const error = validateInputs(values);
  if (error) return { error };

  const D = Number(largeDiameter);
  const d = Number(smallDiameter);
  const theta = Number(taperAngle);
  if (D <= d) {
    return { error: "大径 D は小径 d より大きい数値を入力してください" };
  }

  const diameterDifference = D - d;
  const taperLength = (diameterDifference / 2) / Math.tan(degToRad(theta));

  if (![diameterDifference, taperLength].every(Number.isFinite) || taperLength <= 0) {
    return { error: "計算不能です。入力値を確認してください" };
  }

  return {
    rows: [
      { label: "径差", value: `${diameterDifference.toFixed(3)} mm` },
      { label: "テーパー長", value: `${taperLength.toFixed(3)} mm` },
      { label: "全角度", value: `${(theta * 2).toFixed(4)} °` }
    ]
  };
}

function clearTaperInputs() {
  const form = document.getElementById("taperForm");
  form.querySelectorAll("input[type='number']").forEach((input) => {
    input.value = "";
  });
  const firstDirection = form.querySelector("input[name='diameterDirection'][value='largeToSmall']");
  if (firstDirection) {
    firstDirection.checked = true;
  }
  document.getElementById("taperResultArea").innerHTML = createTaperResultRows([{ label: "結果", value: "-" }]);

  const firstInput = form.querySelector("input[type='number']");
  if (firstInput) {
    firstInput.focus();
  }
}

function createTaperResultRows(rows) {
  return rows.map((row) => `
    <div class="result-row">
      <div class="result-label">${row.label}</div>
      <div class="result-value">${row.value}</div>
    </div>
  `).join("");
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

function radToDeg(radians) {
  return radians * 180 / Math.PI;
}

function formatDms(degrees) {
  let totalSeconds = Math.round(degrees * 3600);
  const sign = totalSeconds < 0 ? "-" : "";
  totalSeconds = Math.abs(totalSeconds);
  const d = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${sign}${d}°${String(m).padStart(2, "0")}′${String(s).padStart(2, "0")}″`;
}

function renderComingSoon(name) {
  app.innerHTML = `
    <section class="empty-state">
      <h2>${name}</h2>
      <p>準備中</p>
    </section>
  `;
}

init();
