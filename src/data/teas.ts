export type Category = "Улун" | "Пуэр" | "Белый" | "Зелёный" | "Красный";
export interface Tea {
  id: string;
  name: string;
  chinese: string;
  category: Category;
  region: string;
  description: string;
  notes: string[];
  temperature: number;
  grams: number;
  initialTime: number;
  increment: number;
  recommendation: string;
  color: string;
  leaf: "twisted" | "rolled" | "needle" | "flat";
}

// Стартовые рецепты для гайвани 100 мл. Это ориентиры, а не универсальные правила.
export const teas: readonly Tea[] = [
  {
    id: "da-hong-pao",
    name: "Да Хун Пао",
    chinese: "大红袍",
    category: "Улун",
    region: "Уишань · Фуцзянь",
    description: "Тёплый, глубокий, с характером скал.",
    notes: ["Печёный орех", "Карамель", "Минералы"],
    temperature: 98,
    grams: 5,
    initialTime: 40,
    increment: 15,
    recommendation:
      "Прогрейте гайвань. Этот рецепт с умеренной закладкой даёт насыщенный первый пролив за 40 секунд. Если вкус слишком плотный, сократите время до 10–20 секунд. Полностью сливайте настой между проливами.",
    color: "#b38b68",
    leaf: "twisted",
  },
  {
    id: "tie-guan-yin",
    name: "Те Гуань Инь",
    chinese: "铁观音",
    category: "Улун",
    region: "Аньси · Фуцзянь",
    description: "Цветочная лёгкость и долгое послевкусие.",
    notes: ["Орхидея", "Сирень", "Сливочность"],
    temperature: 95,
    grams: 6,
    initialTime: 20,
    increment: 10,
    recommendation:
      "Оставьте скрученным листьям место для раскрытия. Для светлого улуна начните с 95 °C и коротких проливов; температуру и время подстройте под обжарку и свой вкус.",
    color: "#95a180",
    leaf: "rolled",
  },
  {
    id: "shu-puer",
    name: "Шу Пуэр",
    chinese: "熟普洱",
    category: "Пуэр",
    region: "Юньнань",
    description: "Бархатная глубина. Тишина после дождя.",
    notes: ["Тёмный шоколад", "Дерево", "Финик"],
    temperature: 100,
    grams: 5,
    initialTime: 15,
    increment: 5,
    recommendation:
      "При желании быстро промойте чай кипятком и слейте промывку до запуска таймера. Разделите прессованный кусочек аккуратно. Начинайте с коротких проливов и увеличивайте время по вкусу.",
    color: "#967665",
    leaf: "twisted",
  },
  {
    id: "sheng-puer",
    name: "Шэн Пуэр",
    chinese: "生普洱",
    category: "Пуэр",
    region: "Юньнань",
    description: "Живой, свежий, с горной прохладой.",
    notes: ["Сухофрукты", "Травы", "Мёд"],
    temperature: 95,
    grams: 5,
    initialTime: 10,
    increment: 5,
    recommendation:
      "Это мягкая отправная точка для молодого шэна. Если появляется горечь, сократите время или снизьте температуру. Выдержанный шэн может хорошо раскрываться при 100 °C.",
    color: "#a49a6a",
    leaf: "flat",
  },
  {
    id: "silver-needle",
    name: "Бай Хао Инь Чжэнь",
    chinese: "白毫银针",
    category: "Белый",
    region: "Фудин · Фуцзянь",
    description: "Нежность серебряных почек.",
    notes: ["Луговые цветы", "Дыня", "Мёд"],
    temperature: 90,
    grams: 4,
    initialTime: 30,
    increment: 10,
    recommendation:
      "Прогрейте посуду и мягко залейте почки водой. Для свежего нежного сырья начните с 90 °C. При слабом вкусе увеличьте время; более зрелый чай может требовать горячей воды.",
    color: "#bbb5a0",
    leaf: "needle",
  },
  {
    id: "long-jing",
    name: "Лун Цзин",
    chinese: "龙井",
    category: "Зелёный",
    region: "Ханчжоу · Чжэцзян",
    description: "Свежая зелень и тепло каштана.",
    notes: ["Каштан", "Молодая трава", "Горошек"],
    temperature: 80,
    grams: 4,
    initialTime: 20,
    increment: 10,
    recommendation:
      "Не обдавайте нежный лист кипятком. Начните с 80 °C, сливайте настой полностью и оставляйте крышку гайвани открытой между проливами, чтобы лист не перегревался.",
    color: "#a4ad7f",
    leaf: "flat",
  },
  {
    id: "dian-hong",
    name: "Дянь Хун",
    chinese: "滇红",
    category: "Красный",
    region: "Фэнцин · Юньнань",
    description: "Солнечный, медовый и обволакивающий.",
    notes: ["Мёд", "Какао", "Сухофрукты"],
    temperature: 90,
    grams: 4,
    initialTime: 15,
    increment: 10,
    recommendation:
      "Для мягкого вкуса начните с 90 °C и короткого первого пролива. Если хочется больше плотности, добавьте несколько секунд или немного повысьте температуру.",
    color: "#bd8f55",
    leaf: "needle",
  },
  {
    id: "dong-ding",
    name: "Дун Дин",
    chinese: "冻顶",
    category: "Улун",
    region: "Наньтоу · Тайвань",
    description: "Мягкое тепло высокогорного улуна.",
    notes: ["Жареный орех", "Сливки", "Цветы"],
    temperature: 95,
    grams: 6,
    initialTime: 25,
    increment: 10,
    recommendation:
      "Дайте скрученным листьям раскрыться в прогретой гайвани. Эти значения подходят для умеренной обжарки; для более тёмной можно попробовать более горячую воду.",
    color: "#b09b76",
    leaf: "rolled",
  },
];
export const categories: readonly Category[] = [
  "Улун",
  "Пуэр",
  "Белый",
  "Зелёный",
  "Красный",
];
export const getTea = (id: string) => teas.find((tea) => tea.id === id);
