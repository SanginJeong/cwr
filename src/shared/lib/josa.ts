// 숫자는 한국어로 읽은 소리의 받침 (영·일·삼·육·칠·팔은 받침이 있다)
const DIGIT_HAS_FINAL = [true, true, false, true, false, false, true, true, true, false];

/** 마지막 글자에 받침이 있는지. 한글·숫자가 아니면 알 수 없으므로 null */
const hasFinalConsonant = (word: string): boolean | null => {
  const last = word.trim().at(-1);
  if (!last) return null;
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (last >= "0" && last <= "9") return DIGIT_HAS_FINAL[Number(last)];
  return null;
};

/** "와/과": 받침이 있으면 "과" (박지민과), 없으면 "와" (김하나와). 알 수 없으면 "와(과)" */
export const josaWaGwa = (word: string) => {
  const final = hasFinalConsonant(word);
  return final === null ? "와(과)" : final ? "과" : "와";
};
