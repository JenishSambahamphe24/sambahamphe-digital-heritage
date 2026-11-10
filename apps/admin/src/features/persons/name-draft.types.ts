import type { TNameType } from "@repo/contracts";

export interface INameDraft {
  key: number;
  fullName: string;
  nameType: TNameType;
  script: string;
  isPrimary: boolean;
}
