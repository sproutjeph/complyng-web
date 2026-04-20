import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/landing/hero";

test("Hero renders headline", () => {
  render(<Hero />);
  expect(
    screen.getByRole("heading", {
      level: 1,
      name: /Turn GAID 2025 into/i,
    }),
  ).toBeDefined();
});
