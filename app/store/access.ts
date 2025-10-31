import {
  ServiceProvider,
  StoreKey,
  ApiPath,
  DEEPMICROPATH_BASE_URL,
} from "../constant";
import { getHeaders } from "../client/api";
import { getClientConfig } from "../config/client";
import { createPersistStore } from "../utils/store";
import { DEFAULT_CONFIG } from "./config";
import { getModelProvider } from "../utils/model";

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

const isApp = getClientConfig()?.buildMode === "export";

const DEFAULT_DEEPMICROPATH_URL = isApp
  ? DEEPMICROPATH_BASE_URL
  : ApiPath.DeepMicroPath;

const DEFAULT_ACCESS_STATE = {
  accessCode: "",
  useCustomConfig: false,

  provider: ServiceProvider.DeepMicroPath,

  // deepmicropath
  deepmicropathUrl: DEFAULT_DEEPMICROPATH_URL,
  deepmicropathApiKey: "",

  // server config
  needCode: false,
  hideUserApiKey: false,
  hideBalanceQuery: false,
  disableGPT4: false,
  disableFastLink: false,
  customModels: "",
  defaultModel: "deepmicropath-chat",
  visionModels: "",

  // tts config
  edgeTTSVoiceName: "zh-CN-YunxiNeural",
};

export const useAccessStore = createPersistStore(
  { ...DEFAULT_ACCESS_STATE },

  (set, get) => ({
    enabledAccessControl() {
      this.fetch();

      return get().needCode;
    },
    getVisionModels() {
      this.fetch();
      return get().visionModels;
    },
    edgeVoiceName() {
      this.fetch();

      return get().edgeTTSVoiceName;
    },

    isValidDeepMicroPath() {
      return true; // Always valid - no API key required
    },

    isAuthorized() {
      return true; // Always authorized for DeepMicroPath
    },
    fetch() {
      if (fetchState > 0 || getClientConfig()?.buildMode === "export") return;
      fetchState = 1;
      fetch("/api/config", {
        method: "post",
        body: null,
        headers: {
          ...getHeaders(),
        },
      })
        .then((res) => res.json())
        .then((res) => {
          const defaultModel = res.defaultModel ?? "";
          if (defaultModel !== "") {
            const [model, providerName] = getModelProvider(defaultModel);
            DEFAULT_CONFIG.modelConfig.model = model;
            DEFAULT_CONFIG.modelConfig.providerName = providerName as any;
          }

          return res;
        })
        .then((res: DangerConfig) => {
          console.log("[Config] got config from server", res);
          set(() => ({ ...res }));
        })
        .catch(() => {
          console.error("[Config] failed to fetch config");
        })
        .finally(() => {
          fetchState = 2;
        });
    },
  }),
  {
    name: StoreKey.Access,
    version: 3,
    migrate(persistedState, version) {
      const state = persistedState as any;

      if (version < 2) {
        state.openaiApiKey = state.token;
        state.azureApiVersion = "2023-08-01-preview";
      }

      // Version 3: Reset to DeepMicroPath only configuration
      if (version < 3) {
        return {
          ...DEFAULT_ACCESS_STATE,
          accessCode: state.accessCode || "",
        };
      }

      return persistedState as any;
    },
  },
);
