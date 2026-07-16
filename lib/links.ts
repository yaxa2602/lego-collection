// Внешние ссылки по набору. Ничего не парсим — только формируем URL-ы.
export function bareSetNum(setNum: string): string {
  return setNum.replace(/-\d+$/, "");
}

export function instructionsUrl(setNum: string): string {
  return `https://www.lego.com/service/building-instructions/${bareSetNum(setNum)}`;
}

export function bricklinkUrl(setNum: string): string {
  return `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${setNum}`;
}

export function avitoUrl(setNum: string, name: string): string {
  const q = encodeURIComponent(`lego ${bareSetNum(setNum)} ${name}`);
  return `https://www.avito.ru/all?q=${q}`;
}
