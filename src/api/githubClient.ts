import { normalizeGitHubToken } from "../auth/tokenStorage.js";

export type GitHubClientOptions = {
  owner: string;
  repo: string;
  branch: string;
  token: string;
};

type ContentsFile = {
  type: "file";
  content?: string;
  encoding?: string;
  download_url?: string | null;
};

export class InvalidTokenError extends Error {
  constructor() {
    super("GitHub token is invalid or does not have access.");
  }
}

export class ContentNotFoundError extends Error {
  constructor(path: string) {
    super(`Content not found or token lacks repository access: ${path}`);
  }
}

export class NetworkError extends Error {
  constructor(message = "Network request failed.") {
    super(message);
  }
}

export class GitHubClient {
  constructor(private readonly options: GitHubClientOptions) {}

  async readText(path: string): Promise<string> {
    const file = await this.readContentsFile(path);
    if (!file.content || file.encoding !== "base64") {
      throw new Error(`GitHub contents response for ${path} does not include base64 content.`);
    }
    return decodeBase64Utf8(file.content);
  }

  async readJson<T>(path: string): Promise<T> {
    return JSON.parse(await this.readText(path)) as T;
  }

  async readBlob(path: string): Promise<Blob> {
    const file = await this.readContentsFile(path);
    if (file.download_url) {
      try {
        return await this.fetchBlob(file.download_url, path);
      } catch (error) {
        if (!(error instanceof InvalidTokenError) && !(error instanceof ContentNotFoundError)) {
          throw error;
        }
      }
    }

    if (!file.content || file.encoding !== "base64") {
      throw new Error(`GitHub contents response for ${path} does not include downloadable audio.`);
    }
    const bytes = decodeBase64Bytes(file.content);
    const audioBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new Blob([audioBuffer], { type: "audio/mpeg" });
  }

  private async readContentsFile(path: string): Promise<ContentsFile> {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const url = `https://api.github.com/repos/${this.options.owner}/${this.options.repo}/contents/${encodedPath}?ref=${encodeURIComponent(
      this.options.branch
    )}`;
    const response = await this.request(url, path);
    const payload = (await response.json()) as ContentsFile;
    if (payload.type !== "file") {
      throw new ContentNotFoundError(path);
    }
    return payload;
  }

  private async fetchBlob(url: string, path: string): Promise<Blob> {
    const response = await this.request(url, path);
    return response.blob();
  }

  private async request(url: string, path: string): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${normalizeGitHubToken(this.options.token)}`,
          Accept: "application/vnd.github+json"
        }
      });
    } catch {
      throw new NetworkError();
    }

    if (response.status === 401 || response.status === 403) {
      throw new InvalidTokenError();
    }
    if (response.status === 404) {
      throw new ContentNotFoundError(path);
    }
    if (!response.ok) {
      throw new NetworkError(`GitHub request failed with ${response.status}.`);
    }
    return response;
  }
}

function decodeBase64Utf8(value: string): string {
  const bytes = decodeBase64Bytes(value);
  return new TextDecoder().decode(bytes);
}

function decodeBase64Bytes(value: string): Uint8Array {
  const binary = atob(value.replace(/\s/g, ""));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
