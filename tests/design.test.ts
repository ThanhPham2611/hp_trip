import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("typography design contract", () => {
  it("loads and prioritizes Source Sans 3 across the app", () => {
    const html = readFileSync("index.html", "utf8");
    const css = readFileSync("src/index.css", "utf8");
    const tailwindConfig = readFileSync("tailwind.config.ts", "utf8");

    expect(html).toContain("family=Source+Sans+3");
    expect(css).toContain('font-family: "Source Sans 3", ui-sans-serif, system-ui, sans-serif;');
    expect(tailwindConfig).toContain('display: ["Source Sans 3", "ui-sans-serif", "system-ui", "sans-serif"]');
    expect(tailwindConfig).toContain('body: ["Source Sans 3", "ui-sans-serif", "system-ui", "sans-serif"]');
  });
});
