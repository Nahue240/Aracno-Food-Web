/* =========================================================
   ARACNO FOOD - Lógica de la tienda
   ========================================================= */

/* ---------------- CONFIGURACIÓN (editá acá) ---------------- */
const CONFIG = {
  whatsapp: "5493876181583", // 54 (Argentina) + 9 + 387 (Salta) + 6181583
  whatsappDisplay: "387 618-1583",
  currency: "$",
  extraToppingPrice: 500, // precio de cada Topping Extra
  wholesaleMinKg: 5,
};

// Precio por pote
const PRICES = {
  natural: { 250: 3400, 500: 6150, 1000: 10000 },
  griego: { 250: 4250, 500: 7250, 1000: 13000 },
};

// Precio mayorista por kilo (desde CONFIG.wholesaleMinKg, sin topping)
const WHOLESALE_PRICES = { natural: 7500, griego: 9000 };

const TYPES = {
  natural: {
    label: "Yogur Natural",
    short: "Natural",
    desc: "Cremoso, suave y sin agregados. Ideal para toda la familia.",
  },
  griego: {
    label: "Yogur Griego",
    short: "Griego",
    desc: "Más espeso y proteico. Perfecto para desayunos y postres.",
  },
};

const SIZES = [
  { key: "250", label: "250 gr", grams: 250 },
  { key: "500", label: "500 gr", grams: 500 },
  { key: "1000", label: "1 kg", grams: 1000 },
];

// Toppings. Los que tienen "variants" piden elegir sabor/variedad.
const TOPPINGS = [
  {
    key: "frutos-rojos",
    label: "Frutos rojos",
    short: "Frutos rojos",
    emoji: "🍓",
    variants: [],
  },
  {
    key: "frutos-secos",
    label: "Frutos secos o granola",
    short: "Frutos secos o granola",
    emoji: "🥜",
    variants: [],
  },
  {
    key: "cereales",
    label: "Cereales de sabores",
    short: "Cereales",
    emoji: "🥣",
    variants: [
      "Copos con azúcar",
      "Copos sin azúcar",
      "Aritos de colores",
      "Bolitas de chocolate",
    ],
  },
  {
    key: "almohaditas",
    label: "Almohaditas de sabores",
    short: "Almohaditas",
    emoji: "🍫",
    variants: ["Frutilla", "Chocolate", "Limón"],
  },
];

// Lista plana de opciones para los extras (cada una con su cantidad)
const EXTRAS = TOPPINGS.flatMap((t) =>
  t.variants.length
    ? t.variants.map((v, i) => ({
        key: `${t.key}:${i}`,
        group: t.label,
        emoji: t.emoji,
        label: v,
        msg: `${t.short} de ${v.toLowerCase()}`,
      }))
    : [
        {
          key: t.key,
          group: t.label,
          emoji: t.emoji,
          label: t.label,
          msg: t.label,
          single: true,
        },
      ],
);

const DELIVERY = {
  centro: { label: "Entrega en zona centro", emoji: "📍", msg: "zona centro" },
  coordinar: { label: "Coordinar envío", emoji: "🚚", msg: "coordinar envío" },
};

// Fotos de los marcos (carrusel). Están en la carpeta "imagenes".
// Las mismas fotos se usan para Natural y Griego: "pote" en 250 y 500 gr, "potegrande" en 1 kg.
const PHOTOS = {
  folder: "imagenes/",
  intervalMs: 3000,
  sets: {
    pote: [
      "pote.png",
      "pote_almo.png",
      "pote_cereal.png",
      "pote_rojos.png",
      "pote_secos.png",
    ],
    potegrande: [
      "potegrande.png",
      "potegrande_almo.png",
      "potegrande_cereal.png",
      "potegrande_frutos.png",
      "potegrande_secos.png",
    ],
  },
  bySize: { 250: "pote", 500: "pote", 1000: "potegrande" },
};

const MAX_EXTRA_QTY = 20;
const MAX_UNITS_PER_PRODUCT = 20;

/* ---------------- UTILIDADES ---------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const money = (n) => CONFIG.currency + n.toLocaleString("es-AR");
const wspLink = (text) =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const weightText = (g) =>
  g < 1000 ? `${g} gr` : `${(g / 1000).toLocaleString("es-AR")} kg`;

/* ---------------- CATÁLOGO ---------------- */
const PRODUCTS = Object.keys(TYPES).flatMap((type) =>
  SIZES.map((size) => ({
    id: `${type}-${size.key}`,
    type,
    size: size.key,
    sizeLabel: size.label,
    grams: size.grams,
    price: PRICES[type][size.key],
  })),
);
const productById = (id) => PRODUCTS.find((p) => p.id === id);
const unitLabel = (p) => `${TYPES[p.type].label} ${p.sizeLabel}`;

const state = { category: "todos", query: "" };

function jarSVG(type) {
  return `<svg viewBox="0 0 120 140" role="img" aria-label="${TYPES[type].label}"><use href="#jar-${type}"/></svg>`;
}

function cardHTML(p) {
  const t = TYPES[p.type];
  const title = `${t.label} artesanal · ${p.sizeLabel}`;
  return `
    <article class="card" data-id="${p.id}">
      <span class="card__tag">${p.sizeLabel}</span>
      <div class="card__img carousel" data-product="${p.id}" role="group" aria-roledescription="carrusel" aria-label="Fotos de ${title}">
        <div class="carousel__fallback">${jarSVG(p.type)}</div>
        <div class="carousel__track"></div>
        <button class="carousel__btn carousel__btn--prev" type="button" aria-label="Foto anterior" hidden><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
        <button class="carousel__btn carousel__btn--next" type="button" aria-label="Foto siguiente" hidden><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
        <div class="carousel__dots" aria-hidden="true"></div>
      </div>
      <div class="card__body">
        <h3 class="card__title">${title}</h3>
        <p class="card__desc">${t.desc}</p>
        <div class="card__price">${money(p.price)}</div>
        <button class="card__btn" type="button" data-open="${p.id}">Comprar</button>
      </div>
    </article>`;
}

function render() {
  const q = state.query.trim().toLowerCase();
  const list = PRODUCTS.filter((p) => {
    if (state.category === "natural" && p.type !== "natural") return false;
    if (state.category === "griego" && p.type !== "griego") return false;
    if (!q) return true;
    const hay =
      `${TYPES[p.type].label} ${p.sizeLabel} ${p.size === "1000" ? "1kg 1 kg kilo" : ""}`.toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  });

  $("#productGrid").innerHTML = list.map(cardHTML).join("");
  initCarousels();
  $("#emptyMsg").hidden = list.length > 0;
  $("#productsCount").textContent = list.length
    ? `${list.length} producto${list.length > 1 ? "s" : ""}`
    : "";

  const titles = {
    todos: "Nuestros productos",
    natural: "Yogur Natural",
    griego: "Yogur Griego",
  };
  $("#productsTitle").textContent = q
    ? `Resultados para “${state.query.trim()}”`
    : titles[state.category];
}

function renderWholesale() {
  $("#wholesalePrices").innerHTML = Object.entries(TYPES)
    .map(
      ([k, t]) => `
    <div class="price-tile">
      <span>${t.label}</span>
      <strong>${money(WHOLESALE_PRICES[k])}</strong>
      <small>por kg · desde ${CONFIG.wholesaleMinKg} kg</small>
    </div>`,
    )
    .join("");
  $("#wholesaleBtn").href = wspLink(
    `Hola, quiero pedir ${CONFIG.wholesaleMinKg} kilos o más de yogur (compra mayorista).`,
  );
}

/* ---------------- CARRUSEL DE FOTOS ---------------- */
const carouselStops = [];
const prefersReducedMotion = matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

function photoUrls(p) {
  return PHOTOS.sets[PHOTOS.bySize[p.size]].map((file) => PHOTOS.folder + file);
}

function initCarousels() {
  carouselStops.splice(0).forEach((stop) => stop()); // frena los carruseles anteriores (al filtrar/buscar)
  $$(".carousel").forEach(initCarousel);
}

function initCarousel(el) {
  const label = el.getAttribute("aria-label");
  const track = $(".carousel__track", el);
  const dots = $(".carousel__dots", el);
  const prev = $(".carousel__btn--prev", el);
  const next = $(".carousel__btn--next", el);
  let index = 0,
    paused = false,
    dead = false,
    timer = null;

  const slides = () => $$(".carousel__slide", track);

  track.innerHTML = photoUrls(productById(el.dataset.product))
    .map(
      (url, i) =>
        `<img class="carousel__slide" data-src="${url}" alt="${label} (foto ${i + 1})" draggable="false" decoding="async">`,
    )
    .join("");

  function show(i) {
    const list = slides();
    if (!list.length) return;
    index = (i + list.length) % list.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    $$(".carousel__dot", dots).forEach((d, k) =>
      d.classList.toggle("is-active", k === index),
    );
  }

  function restart() {
    clearInterval(timer);
    if (dead || prefersReducedMotion || slides().length < 2) return;
    timer = setInterval(() => {
      if (!paused) show(index + 1);
    }, PHOTOS.intervalMs);
  }

  function go(step) {
    show(index + step);
    restart();
  }

  // Se llama al inicio y cada vez que una foto no existe (se descarta y se reacomoda)
  function update() {
    const count = slides().length;
    dots.innerHTML = '<span class="carousel__dot"></span>'.repeat(count);
    prev.hidden = next.hidden = count < 2;
    show(index);
    restart();
  }

  function load(img) {
    img.addEventListener(
      "error",
      () => {
        img.remove();
        update();
      },
      { once: true },
    );
    img.src = img.dataset.src;
  }

  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));

  // Pausa con el mouse encima o con foco de teclado (no con toques en celular)
  el.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") paused = true;
  });
  el.addEventListener("pointerleave", () => {
    paused = false;
  });
  el.addEventListener("focusin", (e) => {
    if (e.target.matches(":focus-visible")) paused = true;
  });
  el.addEventListener("focusout", () => {
    paused = false;
  });

  // Deslizar con el dedo
  let startX = null;
  el.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true },
  );
  el.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  });

  // La primera foto carga ya; las demás cuando termina de cargar la página
  const imgs = slides();
  load(imgs[0]);
  const rest = () => {
    if (!dead) imgs.slice(1).forEach(load);
  };
  if (document.readyState === "complete") rest();
  else addEventListener("load", rest, { once: true });

  update();
  carouselStops.push(() => {
    dead = true;
    clearInterval(timer);
  });
}

/* ---------------- NAVEGACIÓN Y BÚSQUEDA ---------------- */
function setActiveNav(cat) {
  $$(".nav__link").forEach((a) =>
    a.classList.toggle("is-active", a.dataset.cat === cat),
  );
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-cat]");
  if (!link) return;
  const cat = link.dataset.cat;
  setActiveNav(cat);
  if (cat === "mayorista" || cat === "contacto") return; // solo hacen scroll a su sección
  state.query = "";
  $("#searchInput").value = "";
  state.category = cat;
  render();
});

$("#searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  state.query = $("#searchInput").value;
  state.category = "todos";
  setActiveNav("todos");
  render();
  $("#productos").scrollIntoView({ behavior: "smooth" });
});
$("#searchInput").addEventListener("input", (e) => {
  state.query = e.target.value;
  render();
});

/* ---------------- MODAL DE PERSONALIZACIÓN ---------------- */
/*
  order.qty    -> cantidad de potes por producto        { "griego-1000": 2, "natural-500": 1 }
  order.picks  -> topping sin cargo de cada pote        { "griego-1000#1": { topping, variant } }
  order.extras -> cantidad de cada topping extra        { "frutos-rojos": 3, "almohaditas:2": 1 }
*/
const order = {
  qty: {},
  picks: {},
  extra: false,
  extras: {},
  delivery: null,
  showErrors: false,
};
let lastFocus = null;

function resetOrder(productId) {
  order.qty = productId ? { [productId]: 1 } : {};
  order.picks = {};
  order.extra = false;
  order.extras = {};
  order.delivery = null;
  order.showErrors = false;
}

// Un elemento por cada pote pedido, en orden
function units() {
  const list = [];
  PRODUCTS.forEach((p) => {
    for (let i = 1; i <= (order.qty[p.id] || 0); i++)
      list.push({ id: `${p.id}#${i}`, product: p });
  });
  return list;
}

const extraCount = () =>
  order.extra ? Object.values(order.extras).reduce((a, b) => a + b, 0) : 0;
const totalGrams = () => units().reduce((s, u) => s + u.product.grams, 0);
const computeTotal = () =>
  units().reduce((s, u) => s + u.product.price, 0) +
  extraCount() * CONFIG.extraToppingPrice;

function stepperHTML(attr, outId, name) {
  return `<div class="stepper">
    <button type="button" data-step="-1" ${attr} aria-label="Quitar ${name}">−</button>
    <output id="${outId}" aria-live="polite">0</output>
    <button type="button" data-step="1" ${attr} aria-label="Agregar ${name}">+</button>
  </div>`;
}

function chipHTML(name, value, label, checked) {
  return `<label class="chip"><input type="radio" name="${name}" value="${value}"${checked ? " checked" : ""}><span>${label}</span></label>`;
}

function buildModalOptions() {
  // 1. Yogures: tipo x tamaño con cantidad
  $("#unitOptions").innerHTML = Object.entries(TYPES)
    .map(
      ([type, t]) => `
    <div class="line-group">${t.label}</div>
    ${SIZES.map((s) => {
      const p = productById(`${type}-${s.key}`);
      return `<div class="line-row">
        <span class="line-row__name">${s.label}<small>${money(p.price)} c/u</small></span>
        ${stepperHTML(`data-prod="${p.id}"`, `qty-${p.id}`, `${t.label} ${s.label}`)}
      </div>`;
    }).join("")}`,
    )
    .join("");

  // 3. Extras
  let lastGroup = "";
  $("#extraList").innerHTML = EXTRAS.map((e) => {
    const head =
      !e.single && e.group !== lastGroup
        ? `<div class="line-group">${e.emoji} ${e.group}</div>`
        : "";
    lastGroup = e.group;
    return `${head}
    <div class="line-row">
      <span class="line-row__name">${e.single ? e.emoji + " " : ""}${e.label}</span>
      ${stepperHTML(`data-extra="${e.key}"`, `qty-${e.key.replace(":", "-")}`, e.msg)}
    </div>`;
  }).join("");

  // 4. Entrega
  $("#deliveryOptions").innerHTML = Object.entries(DELIVERY)
    .map(
      ([k, d]) => `
    <label class="opt"><input type="radio" name="delivery" value="${k}"><span class="opt__box">${d.emoji} ${d.label}</span></label>`,
    )
    .join("");
}

// Tarjeta de topping por cada pote
function renderUnits() {
  const box = $("#toppingUnits");
  const list = units();
  if (!list.length) {
    box.innerHTML = `<p class="muted-note">Elegí al menos un yogur en el paso 1 para sumarle su topping.</p>`;
    return;
  }
  box.innerHTML = list
    .map((u, i) => {
      const pick = order.picks[u.id] || {};
      return `
    <div class="unit-card" data-unit="${u.id}">
      <div class="unit-card__title">Pote ${i + 1} · ${unitLabel(u.product)}</div>
      <div class="chips" role="radiogroup" aria-label="Topping del pote ${i + 1}">
        ${chipHTML(`top-${u.id}`, "none", "🚫 Sin topping", pick.topping === "none")}
        ${TOPPINGS.map((t) => chipHTML(`top-${u.id}`, t.key, `${t.emoji} ${t.label}`, pick.topping === t.key)).join("")}
      </div>
      ${TOPPINGS.filter((t) => t.variants.length)
        .map(
          (t) => `
      <div class="unit-card__variants" data-variants="${t.key}"${pick.topping === t.key ? "" : " hidden"}>
        <span class="unit-card__sub">Elegí el sabor de ${t.short.toLowerCase()}:</span>
        <div class="chips" role="radiogroup" aria-label="Sabor de ${t.short.toLowerCase()} del pote ${i + 1}">
          ${t.variants.map((v, vi) => chipHTML(`var-${u.id}-${t.key}`, vi, v, pick.topping === t.key && pick.variant === vi)).join("")}
        </div>
      </div>`,
        )
        .join("")}
    </div>`;
    })
    .join("");
}

function pickText(pick) {
  if (pick.topping === "none") return "Sin topping";
  const t = TOPPINGS.find((x) => x.key === pick.topping);
  return t.variants.length
    ? `${t.short} - ${t.variants[pick.variant]}`
    : t.label;
}

function buildMessage() {
  const list = units();
  const n = list.length;
  const lines = [
    `¡Hola Aracno Food! Quiero hacer un pedido de ${weightText(totalGrams())} de yogur (${n} pote${n !== 1 ? "s" : ""}):`,
    "",
  ];
  list.forEach((u, i) =>
    lines.push(
      `${i + 1}) ${unitLabel(u.product)} - Topping: ${pickText(order.picks[u.id])}`,
    ),
  );

  const chosen = order.extra
    ? EXTRAS.filter((e) => order.extras[e.key] > 0)
    : [];
  if (chosen.length) {
    lines.push("", `Toppings extra (+${money(CONFIG.extraToppingPrice)} c/u):`);
    chosen.forEach((e) => lines.push(`- ${order.extras[e.key]} x ${e.msg}`));
  }
  lines.push(
    "",
    `Entrega: ${DELIVERY[order.delivery].msg}`,
    "",
    `Total estimado: ${money(computeTotal())}`,
    "",
    "¡Gracias!",
  );
  return lines.join("\n");
}

// Devuelve la lista de cosas que faltan completar (vacía = pedido válido)
function validate() {
  const list = units();
  const problems = [];
  if (!list.length) {
    problems.push({ field: "units", msg: "Elegí al menos un yogur." });
  } else {
    const missing = list.filter((u) => !order.picks[u.id]).length;
    if (missing) {
      problems.push({
        field: "toppings",
        msg:
          missing === 1
            ? "Falta elegir el topping de 1 pote (o “Sin topping”)."
            : `Faltan elegir los toppings de ${missing} potes (o “Sin topping”).`,
      });
    }
  }
  if (!order.delivery)
    problems.push({
      field: "delivery",
      msg: "Elegí cómo querés recibir tu pedido.",
    });
  return problems;
}

function syncModal() {
  PRODUCTS.forEach((p) => {
    $("#qty-" + p.id).textContent = order.qty[p.id] || 0;
  });
  EXTRAS.forEach((e) => {
    $("#qty-" + e.key.replace(":", "-")).textContent = order.extras[e.key] || 0;
  });

  $("#extraCheck").checked = order.extra;
  $("#extraList").hidden = !order.extra;
  const n = extraCount();
  $("#extraPrice").textContent = n
    ? `${n} × ${money(CONFIG.extraToppingPrice)}`
    : `+ ${money(CONFIG.extraToppingPrice)} c/u`;

  const count = units().length;
  $("#orderSummary").textContent = count
    ? `${count} pote${count !== 1 ? "s" : ""} · ${weightText(totalGrams())}`
    : "Todavía no elegiste yogures";
  $("#totalPrice").textContent = money(computeTotal());

  // Validación y estado del botón
  const problems = validate();
  const ok = problems.length === 0;
  const btn = $("#wspBtn");
  btn.classList.toggle("is-disabled", !ok);
  btn.setAttribute("aria-disabled", String(!ok));
  btn.href = ok ? wspLink(buildMessage()) : "#";

  const hint = $("#orderHint");
  hint.hidden = ok;
  hint.textContent = ok ? "" : problems[0].msg;
  hint.classList.toggle("is-error", order.showErrors);

  $$(".field[data-field]").forEach((f) =>
    f.classList.toggle(
      "is-invalid",
      order.showErrors && problems.some((p) => p.field === f.dataset.field),
    ),
  );
  $$(".unit-card").forEach((c) =>
    c.classList.toggle(
      "is-invalid",
      order.showErrors && !order.picks[c.dataset.unit],
    ),
  );
}

function openModal(productId) {
  resetOrder(productId);
  $$('input[name="delivery"]').forEach((i) => (i.checked = false));
  renderUnits();
  syncModal();
  lastFocus = document.activeElement;
  $("#modal").hidden = false;
  document.body.classList.add("no-scroll");
  $(".modal__body").scrollTop = 0;
  $(".modal__close").focus();
}

function closeModal() {
  $("#modal").hidden = true;
  document.body.classList.remove("no-scroll");
  if (lastFocus) lastFocus.focus();
}

function bindModal() {
  // Cantidad de potes por producto
  $("#unitOptions").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (!btn) return;
    const id = btn.dataset.prod;
    const cur = order.qty[id] || 0;
    const next = clamp(
      cur + Number(btn.dataset.step),
      0,
      MAX_UNITS_PER_PRODUCT,
    );
    if (next === cur) return;
    if (next < cur) delete order.picks[`${id}#${cur}`]; // se quita el último pote de ese producto
    order.qty[id] = next;
    renderUnits();
    syncModal();
  });

  // Cantidad de cada topping extra
  $("#extraList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (!btn) return;
    const key = btn.dataset.extra;
    order.extras[key] = clamp(
      (order.extras[key] || 0) + Number(btn.dataset.step),
      0,
      MAX_EXTRA_QTY,
    );
    syncModal();
  });

  // Topping, sabor, extras y entrega
  $("#modal").addEventListener("change", (e) => {
    const el = e.target;
    const card = el.closest(".unit-card");
    if (card && el.name.startsWith("top-")) {
      const t = TOPPINGS.find((x) => x.key === el.value);
      order.picks[card.dataset.unit] = {
        topping: el.value,
        variant: t && t.variants.length ? 0 : null,
      };
      $$("[data-variants]", card).forEach((group) => {
        const on = group.dataset.variants === el.value;
        group.hidden = !on;
        $$("input", group).forEach((i, idx) => (i.checked = on && idx === 0)); // primer sabor por defecto
      });
    } else if (card && el.name.startsWith("var-")) {
      order.picks[card.dataset.unit].variant = Number(el.value);
    } else if (el.name === "delivery") {
      order.delivery = el.value;
    } else if (el.id === "extraCheck") {
      order.extra = el.checked;
    }
    syncModal();
  });

  $("#modal").addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#modal").hidden) closeModal();
  });

  // Si falta algo, no abre WhatsApp: marca lo pendiente y lleva al primer problema
  $("#wspBtn").addEventListener("click", (e) => {
    const problems = validate();
    if (!problems.length) return;
    e.preventDefault();
    order.showErrors = true;
    syncModal();
    const target =
      $(".unit-card.is-invalid") ||
      $(`.field[data-field="${problems[0].field}"]`);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

$("#productGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-open]");
  if (btn) openModal(btn.dataset.open);
});

/* ---------------- INICIO ---------------- */
function init() {
  const generic = wspLink("¡Hola Aracno Food! Quisiera hacer una consulta.");
  $("#footerWsp").href = generic;
  $("#footerWsp").textContent = `WhatsApp: ${CONFIG.whatsappDisplay}`;
  $("#year").textContent = new Date().getFullYear();

  buildModalOptions();
  bindModal();
  render();
  renderWholesale();
}
init();
