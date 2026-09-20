import countries from "i18n-iso-countries";
import ar from "i18n-iso-countries/langs/ar.json";
import en from "i18n-iso-countries/langs/en.json";
import es from "i18n-iso-countries/langs/es.json";
import fr from "i18n-iso-countries/langs/fr.json";
import ru from "i18n-iso-countries/langs/ru.json";
import zh from "i18n-iso-countries/langs/zh.json";

export const LANGS = [
  { id: "en", label: "English" }, { id: "fr", label: "Français" }, { id: "es", label: "Español" },
  { id: "ru", label: "Русский" }, { id: "zh", label: "中文" }, { id: "ar", label: "العربية" },
] as const;
export type Lang = (typeof LANGS)[number]["id"];
export const isLang = (x: unknown): x is Lang => LANGS.some((l) => l.id === x);
export const dirOf = (l: Lang) => (l === "ar" ? "rtl" : "ltr");

for (const l of [ar, en, es, fr, ru, zh]) countries.registerLocale(l);

// UN short names where they differ from the ISO short name.
const UN_EN: Record<string, string> = { TUR: "Türkiye", CZE: "Czechia", PRK: "Democratic People's Republic of Korea", COD: "Democratic Republic of the Congo", VNM: "Viet Nam", RUS: "Russian Federation", MDA: "Republic of Moldova", TZA: "United Republic of Tanzania", IRN: "Iran (Islamic Republic of)", BOL: "Bolivia (Plurinational State of)", VEN: "Venezuela (Bolivarian Republic of)", GBR: "United Kingdom", USA: "United States of America", KOR: "Republic of Korea", SYR: "Syrian Arab Republic", LAO: "Lao People's Democratic Republic", PSE: "State of Palestine" };

export function countryName(iso3: string, lang: Lang): string {
  if (lang === "en" && UN_EN[iso3]) return UN_EN[iso3];
  const a2 = countries.alpha3ToAlpha2(iso3);
  const n = a2 && countries.getName(a2, lang, { select: "official" }) ? countries.getName(a2, lang, { select: "alias" }) ?? countries.getName(a2, lang) : undefined;
  return n ?? (a2 && countries.getName(a2, lang)) ?? iso3;
}

/** Latin digits in every language so figures stay comparable across locales. */
const locale = (l: Lang) => `${l}-u-nu-latn`;
export function fmt(v: number, lang: Lang, max = 1): string {
  const d = Math.abs(v) >= 100 ? 0 : max;
  return new Intl.NumberFormat(locale(lang), { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(v);
}
export const fmtPct = (v: number, lang: Lang) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmt(Math.abs(v), lang, 0)}%`;

export const dict = {
  en: {
    brand: "Benchmarking Global Prosperity", tag: "From data to insight, evidence and progress",
    country: "Country", pickCountry: "Choose a country", search: "Search countries", compareWith: "Compare with", add: "Add comparator", remove: "Remove",
    countriesLabel: "Countries", groupsLabel: "Groups and regions", maxComp: "Up to three comparators",
    insight: "Insight", visualization: "Visualisation", evidence: "Sources & evidence",
    overview: "Overview", compare: "Compare", trend: "Trend", map: "Map",
    allDims: "All", theme: "Theme", light: "Light", dark: "Dark", language: "Language",
    latest: "Latest", baseline: "Since 2015", target: "Target", source: "Source", dataset: "Dataset", indicator: "Indicator", year: "Year", unit: "Unit",
    updated: "Source updated", retrieved: "Retrieved", dataLink: "Open dataset", methodLink: "Open methodology", notes: "Notes", definition: "Definition",
    notPublished: "Not published in graph metadata", noData: "No data", noDataFor: "No observations for", stale: "Older than 5 years", staleShort: "Old",
    lowerBetter: "Lower is better", higherBetter: "Higher is better", better: "Improved", worse: "Worsened", flat: "Little change",
    ahead: "Ahead", behind: "Behind", limits: "Data gap", changeTag: "Change", note: "Method note",
    showTable: "Show table", showChart: "Show chart", reproduce: "Reproduce in MCP", copy: "Copy", copied: "Copied",
    sdg: "SDG", custodian: "Custodian", frequency: "Frequency", disagg: "Disaggregation", basis: "Estimate basis", basisUnknown: "Not specified by the source",
    dcid: "Graph identifier", provenance: "Provenance", otherSeries: "Other series for this variable", groupMedian: "Group median", members: "Countries reporting",
    spread: "Middle half of countries", pickIndicator: "Pick an indicator", worldSpread: "All countries with data", hover: "Hover or focus a mark for values",
    vs: "vs", above: "above", below: "below", times: "×", pts: "points",
    dragGlobe: "Drag to rotate. Click a country to select it.", flatMap: "Flat map", globe: "Globe", legend: "Legend", observed: "Observation", gapInSeries: "Gap between observations",
    coverage: "Coverage", indicatorsWithData: "indicators with data", staleN: "older than 5 years", missingN: "with no observations",
    explain: "Findings link to their chart and source", jump: "Show in chart", loadFail: "The dataset could not be loaded.", retry: "Try again",
    skip: "Skip to content", copyLink: "Copy link", linkCopied: "Link copied", groupNote: "Median of each member's latest value since 2015",
    dims: { food: "Food security & nutrition", poverty: "Poverty & livelihoods", health: "Health", education: "Education & children" }, stripNote: "Dots show where each selection falls among all countries. Right is more favourable.", since: "since", worldMin: "Lowest", worldMax: "Highest", table: "Table", chart: "Chart", gapCol: "Gap", legendNoData: "No data", legendRange: "Value range", flatIcon: "Flat", n: "n",
    viewBaseline: "Baseline", medianCountry: "Median country", lessFav: "Less favourable", moreFav: "More favourable", gapFor: "Gap for {c}", baselineNote: "Each row is centred on the median country for that indicator. Rows are not combined into a score.", beyond: "Beyond scale",
    findings: { rel: { times: "{x}× {cmp}", diff: "{d} {dir} {cmp}" },
      gap: "{ind}: {a} in {c}, {rel} ({b}).",
      change: "{ind} {verb} from {a} in {y0} to {b} in {y1} ({pct}).",
      verbs: { better: "improved", worse: "worsened", flat: "held steady" },
      noRecent: "{n} of {m} indicators have no observation since {y} for {c}.", staleList: "{ind}: latest observation is from {y}.", none: "Choose a country to see findings.",
      years: "Observation years differ: {c} {y1}, {cmp} {y2}." } },
  fr: {
    brand: "Benchmarking Global Prosperity", tag: "Des données à l’analyse, aux preuves et au progrès",
    country: "Pays", pickCountry: "Choisir un pays", search: "Rechercher un pays", compareWith: "Comparer avec", add: "Ajouter un comparateur", remove: "Retirer",
    countriesLabel: "Pays", groupsLabel: "Groupes et régions", maxComp: "Jusqu’à trois comparateurs",
    insight: "Analyse", visualization: "Visualisation", evidence: "Sources et preuves",
    overview: "Aperçu", compare: "Comparer", trend: "Tendance", map: "Carte",
    allDims: "Tout", theme: "Thème", light: "Clair", dark: "Sombre", language: "Langue",
    latest: "Dernière valeur", baseline: "Depuis 2015", target: "Cible", source: "Source", dataset: "Jeu de données", indicator: "Indicateur", year: "Année", unit: "Unité",
    updated: "Mise à jour de la source", retrieved: "Récupéré", dataLink: "Ouvrir les données", methodLink: "Ouvrir la méthodologie", notes: "Notes", definition: "Définition",
    notPublished: "Non publié dans les métadonnées", noData: "Aucune donnée", noDataFor: "Aucune observation pour", stale: "Plus de 5 ans", staleShort: "Ancien",
    lowerBetter: "Plus bas est meilleur", higherBetter: "Plus haut est meilleur", better: "Amélioré", worse: "Dégradé", flat: "Peu de changement",
    ahead: "En avance", behind: "En retard", limits: "Lacune", changeTag: "Évolution", note: "Note de méthode",
    showTable: "Afficher le tableau", showChart: "Afficher le graphique", reproduce: "Reproduire dans MCP", copy: "Copier", copied: "Copié",
    sdg: "ODD", custodian: "Organisme responsable", frequency: "Fréquence", disagg: "Ventilation", basis: "Base d’estimation", basisUnknown: "Non précisée par la source",
    dcid: "Identifiant du graphe", provenance: "Provenance", otherSeries: "Autres séries pour cette variable", groupMedian: "Médiane du groupe", members: "Pays déclarants",
    spread: "La moitié centrale des pays", pickIndicator: "Choisir un indicateur", worldSpread: "Tous les pays avec données", hover: "Survolez une marque pour voir les valeurs",
    vs: "contre", above: "au-dessus de", below: "en dessous de", times: "×", pts: "points",
    dragGlobe: "Faites glisser pour pivoter. Cliquez sur un pays pour le choisir.", flatMap: "Carte plane", globe: "Globe", legend: "Légende", observed: "Observation", gapInSeries: "Écart entre observations",
    coverage: "Couverture", indicatorsWithData: "indicateurs avec données", staleN: "de plus de 5 ans", missingN: "sans observation",
    explain: "Chaque constat renvoie à son graphique et à sa source", jump: "Voir dans le graphique", loadFail: "Impossible de charger les données.", retry: "Réessayer",
    skip: "Aller au contenu", copyLink: "Copier le lien", linkCopied: "Lien copié", groupNote: "Médiane de la dernière valeur de chaque membre depuis 2015",
    dims: { food: "Sécurité alimentaire et nutrition", poverty: "Pauvreté et moyens de subsistance", health: "Santé", education: "Éducation et enfants" }, stripNote: "Les points situent chaque sélection parmi tous les pays. La droite est plus favorable.", since: "depuis", worldMin: "Minimum", worldMax: "Maximum", table: "Tableau", chart: "Graphique", gapCol: "Écart", legendNoData: "Aucune donnée", legendRange: "Plage de valeurs", flatIcon: "Plat", n: "n",
    viewBaseline: "Référence", medianCountry: "Pays médian", lessFav: "Moins favorable", moreFav: "Plus favorable", gapFor: "Écart pour {c}", baselineNote: "Chaque ligne est centrée sur le pays médian de l’indicateur. Aucun score global n’en est tiré.", beyond: "Hors échelle",
    findings: { rel: { times: "{x}× {cmp}", diff: "{d} {dir} {cmp}" },
      gap: "{ind} : {a} pour {c}, {rel} ({b}).",
      change: "{ind} : {verb}, de {a} en {y0} à {b} en {y1} ({pct}).",
      verbs: { better: "amélioration", worse: "dégradation", flat: "stable" },
      noRecent: "{n} indicateurs sur {m} sans observation depuis {y} pour {c}.", staleList: "{ind} : dernière observation en {y}.", none: "Choisissez un pays pour voir les constats.",
      years: "Années d’observation différentes : {c} {y1}, {cmp} {y2}." } },
  es: {
    brand: "Benchmarking Global Prosperity", tag: "De los datos al análisis, la evidencia y el progreso",
    country: "País", pickCountry: "Elegir un país", search: "Buscar países", compareWith: "Comparar con", add: "Añadir comparador", remove: "Quitar",
    countriesLabel: "Países", groupsLabel: "Grupos y regiones", maxComp: "Hasta tres comparadores",
    insight: "Análisis", visualization: "Visualización", evidence: "Fuentes y evidencia",
    overview: "Resumen", compare: "Comparar", trend: "Tendencia", map: "Mapa",
    allDims: "Todo", theme: "Tema", light: "Claro", dark: "Oscuro", language: "Idioma",
    latest: "Último dato", baseline: "Desde 2015", target: "Meta", source: "Fuente", dataset: "Conjunto de datos", indicator: "Indicador", year: "Año", unit: "Unidad",
    updated: "Actualización de la fuente", retrieved: "Obtenido", dataLink: "Abrir datos", methodLink: "Abrir metodología", notes: "Notas", definition: "Definición",
    notPublished: "No publicado en los metadatos", noData: "Sin datos", noDataFor: "Sin observaciones para", stale: "Más de 5 años", staleShort: "Antiguo",
    lowerBetter: "Menor es mejor", higherBetter: "Mayor es mejor", better: "Mejoró", worse: "Empeoró", flat: "Poco cambio",
    ahead: "Por delante", behind: "Por detrás", limits: "Vacío de datos", changeTag: "Cambio", note: "Nota metodológica",
    showTable: "Ver tabla", showChart: "Ver gráfico", reproduce: "Reproducir en MCP", copy: "Copiar", copied: "Copiado",
    sdg: "ODS", custodian: "Organismo custodio", frequency: "Frecuencia", disagg: "Desglose", basis: "Base de estimación", basisUnknown: "No especificada por la fuente",
    dcid: "Identificador del grafo", provenance: "Procedencia", otherSeries: "Otras series de esta variable", groupMedian: "Mediana del grupo", members: "Países que informan",
    spread: "La mitad central de los países", pickIndicator: "Elegir un indicador", worldSpread: "Todos los países con datos", hover: "Pase el cursor sobre una marca para ver valores",
    vs: "frente a", above: "por encima de", below: "por debajo de", times: "×", pts: "puntos",
    dragGlobe: "Arrastre para girar. Haga clic en un país para elegirlo.", flatMap: "Mapa plano", globe: "Globo", legend: "Leyenda", observed: "Observación", gapInSeries: "Brecha entre observaciones",
    coverage: "Cobertura", indicatorsWithData: "indicadores con datos", staleN: "con más de 5 años", missingN: "sin observaciones",
    explain: "Cada hallazgo enlaza con su gráfico y su fuente", jump: "Ver en el gráfico", loadFail: "No se pudieron cargar los datos.", retry: "Reintentar",
    skip: "Ir al contenido", copyLink: "Copiar enlace", linkCopied: "Enlace copiado", groupNote: "Mediana del último valor de cada miembro desde 2015",
    dims: { food: "Seguridad alimentaria y nutrición", poverty: "Pobreza y medios de vida", health: "Salud", education: "Educación e infancia" }, stripNote: "Los puntos sitúan cada selección entre todos los países. A la derecha es más favorable.", since: "desde", worldMin: "Mínimo", worldMax: "Máximo", table: "Tabla", chart: "Gráfico", gapCol: "Brecha", legendNoData: "Sin datos", legendRange: "Rango de valores", flatIcon: "Plano", n: "n",
    viewBaseline: "Referencia", medianCountry: "País mediano", lessFav: "Menos favorable", moreFav: "Más favorable", gapFor: "Brecha de {c}", baselineNote: "Cada fila se centra en el país mediano del indicador. Las filas no se combinan en una puntuación.", beyond: "Fuera de escala",
    findings: { rel: { times: "{x}× {cmp}", diff: "{d} {dir} {cmp}" },
      gap: "{ind}: {a} en {c}, {rel} ({b}).",
      change: "{ind}: {verb}, de {a} en {y0} a {b} en {y1} ({pct}).",
      verbs: { better: "mejora", worse: "empeora", flat: "estable" },
      noRecent: "{n} de {m} indicadores sin observaciones desde {y} para {c}.", staleList: "{ind}: la última observación es de {y}.", none: "Elija un país para ver los hallazgos.",
      years: "Los años de observación difieren: {c} {y1}, {cmp} {y2}." } },
  ru: {
    brand: "Benchmarking Global Prosperity", tag: "От данных к выводам, доказательствам и прогрессу",
    country: "Страна", pickCountry: "Выберите страну", search: "Поиск стран", compareWith: "Сравнить с", add: "Добавить страну сравнения", remove: "Убрать",
    countriesLabel: "Страны", groupsLabel: "Группы и регионы", maxComp: "До трёх стран сравнения",
    insight: "Выводы", visualization: "Визуализация", evidence: "Источники и доказательства",
    overview: "Обзор", compare: "Сравнение", trend: "Динамика", map: "Карта",
    allDims: "Все", theme: "Тема", light: "Светлая", dark: "Тёмная", language: "Язык",
    latest: "Последнее", baseline: "С 2015 года", target: "Цель", source: "Источник", dataset: "Набор данных", indicator: "Показатель", year: "Год", unit: "Единица",
    updated: "Обновление источника", retrieved: "Получено", dataLink: "Открыть данные", methodLink: "Открыть методологию", notes: "Примечания", definition: "Определение",
    notPublished: "Не указано в метаданных", noData: "Нет данных", noDataFor: "Нет наблюдений для", stale: "Старше 5 лет", staleShort: "Давно",
    lowerBetter: "Чем ниже, тем лучше", higherBetter: "Чем выше, тем лучше", better: "Улучшение", worse: "Ухудшение", flat: "Без изменений",
    ahead: "Впереди", behind: "Позади", limits: "Пробел в данных", changeTag: "Динамика", note: "Методологическое примечание",
    showTable: "Показать таблицу", showChart: "Показать график", reproduce: "Воспроизвести в MCP", copy: "Копировать", copied: "Скопировано",
    sdg: "ЦУР", custodian: "Ответственная организация", frequency: "Периодичность", disagg: "Разбивка", basis: "Основа оценки", basisUnknown: "Источник не указал",
    dcid: "Идентификатор в графе", provenance: "Происхождение", otherSeries: "Другие ряды этого показателя", groupMedian: "Медиана группы", members: "Страны с данными",
    spread: "Средняя половина стран", pickIndicator: "Выберите показатель", worldSpread: "Все страны с данными", hover: "Наведите на элемент, чтобы увидеть значения",
    vs: "против", above: "выше, чем", below: "ниже, чем", times: "×", pts: "п.п.",
    dragGlobe: "Перетащите, чтобы повернуть. Нажмите на страну, чтобы выбрать её.", flatMap: "Плоская карта", globe: "Глобус", legend: "Легенда", observed: "Наблюдение", gapInSeries: "Пропуск между наблюдениями",
    coverage: "Охват", indicatorsWithData: "показателей с данными", staleN: "старше 5 лет", missingN: "без наблюдений",
    explain: "Каждый вывод связан с графиком и источником", jump: "Показать на графике", loadFail: "Не удалось загрузить данные.", retry: "Повторить",
    skip: "К содержимому", copyLink: "Копировать ссылку", linkCopied: "Ссылка скопирована", groupNote: "Медиана последних значений участников с 2015 года",
    dims: { food: "Продовольственная безопасность и питание", poverty: "Бедность и средства к существованию", health: "Здравоохранение", education: "Образование и дети" }, stripNote: "Точки показывают положение каждого выбора среди всех стран. Правее — лучше.", since: "с", worldMin: "Минимум", worldMax: "Максимум", table: "Таблица", chart: "График", gapCol: "Разрыв", legendNoData: "Нет данных", legendRange: "Диапазон значений", flatIcon: "Плоская", n: "n",
    viewBaseline: "Эталон", medianCountry: "Медианная страна", lessFav: "Менее благоприятно", moreFav: "Более благоприятно", gapFor: "Разрыв для: {c}", baselineNote: "Каждая строка центрирована на медианной стране по показателю. Общий балл не рассчитывается.", beyond: "За пределами шкалы",
    findings: { rel: { times: "{x}× {cmp}", diff: "{d} {dir} {cmp}" },
      gap: "{ind}: {a} в стране {c}, {rel} ({b}).",
      change: "{ind}: {verb}, с {a} в {y0} г. до {b} в {y1} г. ({pct}).",
      verbs: { better: "улучшение", worse: "ухудшение", flat: "без изменений" },
      noRecent: "По {n} из {m} показателей нет наблюдений с {y} г. для {c}.", staleList: "{ind}: последнее наблюдение за {y} г.", none: "Выберите страну, чтобы увидеть выводы.",
      years: "Годы наблюдений различаются: {c} {y1}, {cmp} {y2}." } },
  zh: {
    brand: "全球繁荣基准", tag: "从数据到洞察、证据与进展",
    country: "国家", pickCountry: "选择国家", search: "搜索国家", compareWith: "对比对象", add: "添加对比", remove: "移除",
    countriesLabel: "国家", groupsLabel: "群组与区域", maxComp: "最多三个对比对象",
    insight: "洞察", visualization: "可视化", evidence: "来源与证据",
    overview: "概览", compare: "对比", trend: "趋势", map: "地图",
    allDims: "全部", theme: "主题", light: "浅色", dark: "深色", language: "语言",
    latest: "最新", baseline: "2015年以来", target: "目标", source: "来源", dataset: "数据集", indicator: "指标", year: "年份", unit: "单位",
    updated: "来源更新", retrieved: "获取时间", dataLink: "打开数据集", methodLink: "打开方法说明", notes: "备注", definition: "定义",
    notPublished: "图谱元数据未提供", noData: "无数据", noDataFor: "没有观测值：", stale: "超过5年", staleShort: "较旧",
    lowerBetter: "越低越好", higherBetter: "越高越好", better: "改善", worse: "恶化", flat: "变化不大",
    ahead: "领先", behind: "落后", limits: "数据缺口", changeTag: "变化", note: "方法说明",
    showTable: "显示表格", showChart: "显示图表", reproduce: "在 MCP 中复现", copy: "复制", copied: "已复制",
    sdg: "可持续发展目标", custodian: "负责机构", frequency: "频率", disagg: "分类", basis: "估计依据", basisUnknown: "来源未说明",
    dcid: "图谱标识", provenance: "出处", otherSeries: "该变量的其他序列", groupMedian: "群组中位数", members: "有数据的国家",
    spread: "中间一半的国家", pickIndicator: "选择指标", worldSpread: "所有有数据的国家", hover: "悬停或聚焦标记以查看数值",
    vs: "对比", above: "高于", below: "低于", times: "×", pts: "个百分点",
    dragGlobe: "拖动以旋转。点击国家即可选择。", flatMap: "平面地图", globe: "地球", legend: "图例", observed: "观测值", gapInSeries: "观测值之间的空档",
    coverage: "覆盖情况", indicatorsWithData: "项指标有数据", staleN: "项超过5年", missingN: "项无观测值",
    explain: "每项发现都链接到对应图表和来源", jump: "在图表中查看", loadFail: "无法加载数据。", retry: "重试",
    skip: "跳到内容", copyLink: "复制链接", linkCopied: "链接已复制", groupNote: "各成员自2015年以来最新值的中位数",
    dims: { food: "粮食安全与营养", poverty: "贫困与生计", health: "健康", education: "教育与儿童" }, stripNote: "圆点显示每个选择在所有国家中的位置。越靠右越有利。", since: "自", worldMin: "最低", worldMax: "最高", table: "表格", chart: "图表", gapCol: "差距", legendNoData: "无数据", legendRange: "数值范围", flatIcon: "平面", n: "n",
    viewBaseline: "基准", medianCountry: "中位数国家", lessFav: "较不利", moreFav: "较有利", gapFor: "{c}的差距", baselineNote: "每一行以该指标的中位数国家为中心，不合并为综合得分。", beyond: "超出刻度",
    findings: { rel: { times: "{cmp}的{x}×", diff: "{dir}{cmp} {d}" },
      gap: "{ind}：{c}为{a}，{rel}（{b}）。",
      change: "{ind}：{verb}，由{y0}年的{a}变为{y1}年的{b}（{pct}）。",
      verbs: { better: "改善", worse: "恶化", flat: "保持稳定" },
      noRecent: "{c}的{m}项指标中有{n}项自{y}年起没有观测值。", staleList: "{ind}：最新观测值来自{y}年。", none: "请选择国家以查看发现。",
      years: "观测年份不同：{c}为{y1}年，{cmp}为{y2}年。" } },
  ar: {
    brand: "قياس الازدهار العالمي", tag: "من البيانات إلى الرؤى والأدلة والتقدم",
    country: "البلد", pickCountry: "اختر بلدًا", search: "ابحث عن بلد", compareWith: "قارن مع", add: "أضف مقارنة", remove: "إزالة",
    countriesLabel: "البلدان", groupsLabel: "المجموعات والأقاليم", maxComp: "حتى ثلاث مقارنات",
    insight: "الرؤى", visualization: "التصور البصري", evidence: "المصادر والأدلة",
    overview: "نظرة عامة", compare: "مقارنة", trend: "الاتجاه", map: "الخريطة",
    allDims: "الكل", theme: "المظهر", light: "فاتح", dark: "داكن", language: "اللغة",
    latest: "الأحدث", baseline: "منذ 2015", target: "الغاية", source: "المصدر", dataset: "مجموعة البيانات", indicator: "المؤشر", year: "السنة", unit: "الوحدة",
    updated: "تحديث المصدر", retrieved: "تاريخ الاسترجاع", dataLink: "افتح البيانات", methodLink: "افتح المنهجية", notes: "ملاحظات", definition: "التعريف",
    notPublished: "غير منشور في البيانات الوصفية", noData: "لا بيانات", noDataFor: "لا توجد ملاحظات لـ", stale: "أقدم من 5 سنوات", staleShort: "قديم",
    lowerBetter: "الأقل أفضل", higherBetter: "الأعلى أفضل", better: "تحسّن", worse: "تراجع", flat: "تغيير طفيف",
    ahead: "متقدم", behind: "متأخر", limits: "فجوة بيانات", changeTag: "التغيّر", note: "ملاحظة منهجية",
    showTable: "عرض الجدول", showChart: "عرض الرسم", reproduce: "أعد الاستعلام في MCP", copy: "نسخ", copied: "تم النسخ",
    sdg: "هدف التنمية المستدامة", custodian: "الجهة المسؤولة", frequency: "التواتر", disagg: "التصنيف", basis: "أساس التقدير", basisUnknown: "لم يحدده المصدر",
    dcid: "معرّف الرسم البياني", provenance: "المنشأ", otherSeries: "سلاسل أخرى لهذا المتغير", groupMedian: "وسيط المجموعة", members: "البلدان المبلّغة",
    spread: "النصف الأوسط من البلدان", pickIndicator: "اختر مؤشرًا", worldSpread: "كل البلدان التي لديها بيانات", hover: "مرّر المؤشر فوق علامة لعرض القيم",
    vs: "مقابل", above: "أعلى من", below: "أدنى من", times: "×", pts: "نقطة",
    dragGlobe: "اسحب للتدوير. انقر على بلد لاختياره.", flatMap: "خريطة مسطحة", globe: "كرة أرضية", legend: "مفتاح", observed: "ملاحظة", gapInSeries: "فجوة بين الملاحظات",
    coverage: "التغطية", indicatorsWithData: "مؤشرات لها بيانات", staleN: "أقدم من 5 سنوات", missingN: "بلا ملاحظات",
    explain: "كل نتيجة مرتبطة برسمها ومصدرها", jump: "اعرض في الرسم", loadFail: "تعذّر تحميل البيانات.", retry: "أعد المحاولة",
    skip: "انتقل إلى المحتوى", copyLink: "انسخ الرابط", linkCopied: "تم نسخ الرابط", groupNote: "وسيط أحدث قيمة لكل عضو منذ 2015",
    dims: { food: "الأمن الغذائي والتغذية", poverty: "الفقر وسبل العيش", health: "الصحة", education: "التعليم والأطفال" }, stripNote: "تُظهر النقاط موقع كل اختيار بين جميع البلدان. اليمين أفضل.", since: "منذ", worldMin: "الأدنى", worldMax: "الأعلى", table: "جدول", chart: "رسم", gapCol: "الفجوة", legendNoData: "لا بيانات", legendRange: "نطاق القيم", flatIcon: "مسطح", n: "ن",
    viewBaseline: "خط الأساس", medianCountry: "البلد الوسيط", lessFav: "أقل ملاءمة", moreFav: "أكثر ملاءمة", gapFor: "فجوة {c}", baselineNote: "يتمحور كل صف حول البلد الوسيط للمؤشر، ولا تُدمج الصفوف في درجة واحدة.", beyond: "خارج المقياس",
    findings: { rel: { times: "{x}× {cmp}", diff: "{d} {dir} {cmp}" },
      gap: "{ind}: {a} في {c}، {rel} ({b}).",
      change: "{ind}: {verb}، من {a} في {y0} إلى {b} في {y1} ({pct}).",
      verbs: { better: "تحسّن", worse: "تراجع", flat: "ثابت" },
      noRecent: "لا توجد ملاحظات منذ {y} لـ {n} من {m} مؤشرًا في {c}.", staleList: "{ind}: أحدث ملاحظة تعود إلى {y}.", none: "اختر بلدًا لعرض النتائج.",
      years: "سنوات الملاحظة مختلفة: {c} {y1}، {cmp} {y2}." } },
} as const;

export type Dict = (typeof dict)["en"];
export const t = (l: Lang): Dict => dict[l] as unknown as Dict;
export const tpl = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
