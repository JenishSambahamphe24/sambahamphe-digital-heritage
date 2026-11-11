import type {
  TBoardResponse,
  TOrgUnitNodeResponse,
  TOrgUnitResponse,
  TOrgUnitTypeResponse,
  TTermResponse,
} from "@repo/contracts";

import { cache } from "react";

import { serverApiClient } from "#/lib/server-api-client";

// Server-side reads for the public board pages. Each returns null when the API
// can't answer, so a page can show "couldn't load" instead of crashing.
export class BoardsDataHelper {
  // Metadata and the page both need the tree; cache() makes it one request per render.
  static units = cache((): Promise<TOrgUnitNodeResponse[] | null> =>
    BoardsDataHelper.safely(async () => {
      const { data } = await serverApiClient.GET("/api/v1/org/units");
      return data?.data ?? null;
    }),
  );

  static unitTypes(): Promise<TOrgUnitTypeResponse[] | null> {
    return BoardsDataHelper.safely(async () => {
      const { data } = await serverApiClient.GET("/api/v1/org/unit-types");
      return data?.data ?? null;
    });
  }

  static unit(id: string): Promise<TOrgUnitResponse | null> {
    return BoardsDataHelper.safely(async () => {
      const { data } = await serverApiClient.GET("/api/v1/org/units/{id}", {
        params: { path: { id } },
      });
      return data ?? null;
    });
  }

  static terms(id: string): Promise<TTermResponse[] | null> {
    return BoardsDataHelper.safely(async () => {
      const { data } = await serverApiClient.GET("/api/v1/org/units/{id}/terms", {
        params: { path: { id } },
      });
      return data?.data ?? null;
    });
  }

  static board(id: string, termId?: string): Promise<TBoardResponse | null> {
    return BoardsDataHelper.safely(async () => {
      const { data } = await serverApiClient.GET("/api/v1/org/units/{id}/board", {
        params: { path: { id }, query: termId ? { termId } : {} },
      });
      return data ?? null;
    });
  }

  private static async safely<T>(read: () => Promise<T | null>): Promise<T | null> {
    try {
      return await read();
    } catch {
      return null;
    }
  }
}
