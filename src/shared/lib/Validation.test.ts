import { describe, expect, it } from "vitest";
import { validateEmail } from "./Validation";

describe("validateEmail", () => {
  it.each(["employee@coworkers.test", "a.b@company.info", "hr@example.company", "user@mail.co.kr", "x@y.io"])(
    "%s는 올바른 형식",
    (email) => {
      expect(validateEmail(email)).toEqual({ isValid: true });
    },
  );

  it.each(["", "no-at.com", "user@nodot", "user@domain.c", "@coworkers.test", "user@.com"])(
    "%s는 형식 오류",
    (email) => {
      expect(validateEmail(email).isValid).toBe(false);
    },
  );
});
