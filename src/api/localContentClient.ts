export type LocalContentClientOptions = {
  basePath?: string;
};

export class LocalContentNotFoundError extends Error {
  constructor(path: string) {
    super(`Local content not found: ${path}`);
  }
}

export class LocalContentNetworkError extends Error {
  constructor(message = "Local content request failed.") {
    super(message);
  }
}

export class LocalContentClient {
  private readonly basePath: string;

  constructor(options: LocalContentClientOptions = {}) {
    this.basePath = normalizeBasePath(options.basePath ?? "/local-content");
  }

  async readText(path: string): Promise<string> {
    const response = await this.request(path);
    return response.text();
  }

  async readJson<T>(path: string): Promise<T> {
    return JSON.parse(await this.readText(path)) as T;
  }

  async readBlob(path: string): Promise<Blob> {
    const response = await this.request(path);
    return response.blob();
  }

  private async request(path: string): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(this.resolveUrl(path));
    } catch {
      throw new LocalContentNetworkError();
    }

    if (response.status === 404) {
      throw new LocalContentNotFoundError(path);
    }
    if (!response.ok) {
      throw new LocalContentNetworkError(`Local content request failed with ${response.status}.`);
    }
    return response;
  }

  private resolveUrl(path: string): string {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    return this.basePath ? `${this.basePath}/${encodedPath}` : `/${encodedPath}`;
  }
}

function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim().replace(/\/+$/g, "");
  if (!trimmed) {
    return "";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
