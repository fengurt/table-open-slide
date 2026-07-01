const DIGIT = { 零: 0, 〇: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 两: 2 };

export function cn2num(raw) {
  const str = String(raw ?? '').replace(/\s/g, '');
  if (/^\d+$/.test(str)) return Number(str);
  if (str.includes('百')) {
    const [a, b] = str.split('百');
    const hundreds = a ? cn2num(a) : 1;
    return hundreds * 100 + (b ? cn2num(b) : 0);
  }
  if (str.includes('十')) {
    const [a, b] = str.split('十');
    const tens = a ? cn2num(a) : 1;
    return tens * 10 + (b ? cn2num(b) : 0);
  }
  let n = 0;
  for (const ch of str) n = n * 10 + (DIGIT[ch] ?? 0);
  return n;
}

export function num2cn(n) {
  const map = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (n <= 10) return map[n];
  if (n < 20) return `十${map[n - 10] === '零' ? '' : map[n - 10]}`;
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${map[t]}十${o ? map[o] : ''}`;
  }
  return String(n);
}
