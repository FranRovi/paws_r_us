import { describe, it, expect } from "vitest";
import { validateRegister, validateLogin } from "./validation";

const valid = {
  firstName: "Alex",
  lastName: "Rivera",
  username: "alex.rivera",
  email: "alex@example.com",
  password: "secret123",
  confirmPassword: "secret123",
  address: "4 N 2nd St",
  city: "New York",
  zip: "10001",
  country: "United States",
  terms: true,
};

describe("validateRegister", () => {
  it("accepts a complete, valid form", () => {
    expect(validateRegister(valid)).toEqual({});
  });

  it("requires every text field", () => {
    const errors = validateRegister({
      ...valid,
      firstName: " ",
      lastName: "",
      address: "",
      city: "",
      zip: "",
    });
    expect(Object.keys(errors)).toEqual([
      "firstName",
      "lastName",
      "address",
      "city",
      "zip",
    ]);
  });

  it("rejects a malformed email", () => {
    expect(validateRegister({ ...valid, email: "alex@" }).email).toMatch(
      /valid email/i,
    );
  });

  it("rejects an invalid username", () => {
    expect(
      validateRegister({ ...valid, username: "a b" }).username,
    ).toBeDefined();
    expect(
      validateRegister({ ...valid, username: "ab" }).username,
    ).toBeDefined();
  });

  it("requires a password of at least 8 characters", () => {
    expect(
      validateRegister({
        ...valid,
        password: "short",
        confirmPassword: "short",
      }).password,
    ).toBeDefined();
  });

  it("requires the passwords to match", () => {
    expect(
      validateRegister({ ...valid, confirmPassword: "different1" })
        .confirmPassword,
    ).toMatch(/do not match/i);
  });

  it("requires accepting the terms", () => {
    expect(validateRegister({ ...valid, terms: false }).terms).toBeDefined();
  });
});

describe("validateLogin", () => {
  it("requires a valid email and a password", () => {
    expect(validateLogin({ email: "nope", password: "" })).toEqual({
      email: "Enter a valid email address.",
      password: "Enter your password.",
    });
  });

  it("accepts valid values", () => {
    expect(validateLogin({ email: "a@b.co", password: "secret" })).toEqual({});
  });
});
