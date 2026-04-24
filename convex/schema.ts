import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    title: v.string(),
    html: v.string(),
    css: v.string(),
    js: v.string(),
    updatedAt: v.number(),
  }),
});
