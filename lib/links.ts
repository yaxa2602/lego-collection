// Внешние ссылки по набору. Ничего не парсим — только формируем URL-ы.
export function bareSetNum(setNum: string): string {
  return setNum.replace(/-\d+$/, "");
}

// Поисковый запрос вида «lego 42151 Bugatti Bolide» — общий для всех площадок.
function searchQuery(setNum: string, name: string): string {
  return encodeURIComponent(`lego ${bareSetNum(setNum)} ${name}`);
}

export function instructionsUrl(setNum: string): string {
  return `https://www.lego.com/service/building-instructions/${bareSetNum(setNum)}`;
}

export function bricklinkUrl(setNum: string): string {
  return `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${setNum}`;
}

export function avitoUrl(setNum: string, name: string): string {
  return `https://www.avito.ru/all?q=${searchQuery(setNum, name)}`;
}

export function ozonUrl(setNum: string, name: string): string {
  return `https://www.ozon.ru/search/?text=${searchQuery(setNum, name)}`;
}

export function ebayUrl(setNum: string, name: string): string {
  return `https://www.ebay.com/sch/i.html?_nkw=${searchQuery(setNum, name)}`;
}

export function amazonUrl(setNum: string, name: string): string {
  return `https://www.amazon.com/s?k=${searchQuery(setNum, name)}`;
}

export type BuyLink = { id: string; icon: string; title: string; note: string; url: string };

// Единый список площадок — используется на странице набора, в окне и в уведомлении,
// чтобы они не разъезжались.
export function buyLinks(setNum: string, name: string): BuyLink[] {
  return [
    { id: "avito", icon: "🇷🇺", title: "Avito", note: "Объявления б/у в России", url: avitoUrl(setNum, name) },
    { id: "ozon", icon: "🛒", title: "Ozon", note: "Российский маркетплейс", url: ozonUrl(setNum, name) },
    { id: "ebay", icon: "🌍", title: "eBay", note: "Международный аукцион, новые и б/у", url: ebayUrl(setNum, name) },
    { id: "amazon", icon: "📦", title: "Amazon", note: "Зарубежная розница", url: amazonUrl(setNum, name) },
    { id: "bricklink", icon: "🧱", title: "BrickLink", note: "Маркетплейс наборов и деталей для фанатов", url: bricklinkUrl(setNum) },
  ];
}
