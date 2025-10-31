import { Mask } from "../store/mask";

import { type BuiltinMask } from "./typing";
export { type BuiltinMask } from "./typing";

// EvidenceSeek - Pharmaceutical & Microbiology Prompts
import { EVIDENCESEEK_CN_MASKS } from "./evidenceseek-cn";

export const BUILTIN_MASK_ID = 100000;

export const BUILTIN_MASK_STORE = {
  buildinId: BUILTIN_MASK_ID,
  masks: {} as Record<string, BuiltinMask>,
  get(id?: string) {
    if (!id) return undefined;
    return this.masks[id] as Mask | undefined;
  },
  add(m: BuiltinMask) {
    const mask = { ...m, id: this.buildinId++, builtin: true };
    this.masks[mask.id] = mask;
    return mask;
  },
};

// Initialize with EvidenceSeek pharmaceutical prompts
export const BUILTIN_MASKS: BuiltinMask[] = EVIDENCESEEK_CN_MASKS.map((m) =>
  BUILTIN_MASK_STORE.add(m),
);
