export type ContentSource = "static" | "github" | "local";

export type AppConfig = {
  source: ContentSource;
  owner: string;
  repo: string;
  branch: string;
  staticContentBasePath: string;
  localContentBasePath: string;
};

export function readAppConfig(): AppConfig {
  return {
    source: readContentSource(import.meta.env.VITE_CONTENT_SOURCE),
    owner: import.meta.env.VITE_GITHUB_OWNER || "hiyishui",
    repo: import.meta.env.VITE_CONTENT_REPO || "english-listening-content",
    branch: import.meta.env.VITE_CONTENT_BRANCH || "main",
    staticContentBasePath: import.meta.env.VITE_STATIC_CONTENT_BASE ?? import.meta.env.BASE_URL ?? "/",
    localContentBasePath: import.meta.env.VITE_LOCAL_CONTENT_BASE || "/local-content"
  };
}

function readContentSource(value: string | undefined): ContentSource {
  if (value === "github" || value === "local") {
    return value;
  }
  return "static";
}
