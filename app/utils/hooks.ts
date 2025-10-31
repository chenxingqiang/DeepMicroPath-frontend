import { useMemo } from "react";
import { useAccessStore, useAppConfig } from "../store";
import { collectModelsWithDefaultModel } from "./model";

export function useAllModels() {
  const accessStore = useAccessStore();
  const configStore = useAppConfig();
  const models = useMemo(() => {
    console.log("[useAllModels] Calculating models...");
    console.log(
      "[useAllModels] configStore.models:",
      configStore.models?.length,
      configStore.models,
    );
    console.log(
      "[useAllModels] customModels:",
      configStore.customModels,
      accessStore.customModels,
    );
    console.log("[useAllModels] defaultModel:", accessStore.defaultModel);

    const result = collectModelsWithDefaultModel(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(","),
      accessStore.defaultModel,
    );

    console.log("[useAllModels] Result:", result?.length, result);
    return result;
  }, [
    accessStore.customModels,
    accessStore.defaultModel,
    configStore.customModels,
    configStore.models,
  ]);

  return models;
}
