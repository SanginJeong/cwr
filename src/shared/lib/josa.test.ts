import { describe, expect, it } from "vitest";
import { josaWaGwa } from "./josa";

describe("josaWaGwa", () => {
  it("받침이 있으면 과, 없으면 와", () => {
    expect(josaWaGwa("박지민")).toBe("과");
    expect(josaWaGwa("백서윤")).toBe("과");
    expect(josaWaGwa("김하나")).toBe("와");
    expect(josaWaGwa("서지호")).toBe("와");
  });

  it("숫자로 끝나면 읽는 소리로 (직원1 → 일, 팀장2 → 이)", () => {
    expect(josaWaGwa("직원1")).toBe("과");
    expect(josaWaGwa("팀장2")).toBe("와");
  });

  it("한글·숫자가 아니면 와(과)", () => {
    expect(josaWaGwa("Kim")).toBe("와(과)");
    expect(josaWaGwa("")).toBe("와(과)");
  });
});
