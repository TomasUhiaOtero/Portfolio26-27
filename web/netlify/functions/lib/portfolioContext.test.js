import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./portfolioContext.js";
import { profile } from "../../../src/data/content.js";
import { projects, localized } from "../../../src/data/projects.js";
import { services } from "../../../src/data/services.js";

describe("buildSystemPrompt", () => {
  it("names the person and instructs the model to stay on topic", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain(profile.fullName);
    expect(prompt.toLowerCase()).toContain("solo");
  });

  it("includes every project's title and stack", () => {
    const prompt = buildSystemPrompt();
    for (const project of projects) {
      expect(prompt).toContain(localized(project.title, "es"));
      for (const tech of project.stack) {
        expect(prompt).toContain(tech);
      }
    }
  });

  it("includes every service", () => {
    const prompt = buildSystemPrompt();
    for (const service of services) {
      expect(prompt).toContain(localized(service.title, "es"));
    }
  });

  it("includes contact details", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain(profile.email);
    expect(prompt).toContain(profile.github);
  });
});
