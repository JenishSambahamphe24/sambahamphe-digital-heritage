import type { IActiveConsent, IPrivacySubject, TViewer } from "./privacy.types.js";
import type { TFieldGroup } from "@repo/contracts";

import { describe, expect, it } from "vitest";

import { PrivacyPolicyHelper } from "./privacy-policy.helper.js";

const TODAY = new Date("2026-11-10T00:00:00Z");

const ANONYMOUS: TViewer = { kind: "anonymous" };
const MEMBER: TViewer = { kind: "member", grantedGroups: new Set() };
const EDITOR: TViewer = { kind: "editor" };

function subject(overrides: Partial<IPrivacySubject>): IPrivacySubject {
  const base = {
    livingStatus: "unknown",
    deathDate: null,
    birthSortTo: null,
    ...overrides,
  } as const;
  const defaults = PrivacyPolicyHelper.defaults(base, TODAY);
  return {
    visibility: defaults.visibility,
    fieldVisibility: defaults.fieldVisibility,
    ...base,
    ...overrides,
  };
}

const deceased = subject({ livingStatus: "deceased" });
const livingAdult = subject({ livingStatus: "living", birthSortTo: "1980-12-31" });
const minor = subject({ livingStatus: "living", birthSortTo: "2015-12-31" });
const allPublic = {
  visibility: "public",
  fieldVisibility: { names: "public", vital_dates: "public" },
} as const;
const publicNamesConsent: IActiveConsent = { visibility: "public", fieldGroups: ["names"] };

describe("presumed living and minors", () => {
  it.each([
    {
      name: "living",
      input: { livingStatus: "living", birthSortTo: null },
      living: true,
      minor: false,
    },
    {
      name: "deceased",
      input: { livingStatus: "deceased", birthSortTo: null },
      living: false,
      minor: false,
    },
    {
      name: "unknown, no dates (deny by default)",
      input: { livingStatus: "unknown", birthSortTo: null },
      living: true,
      minor: false,
    },
    {
      name: "unknown, born 1850",
      input: { livingStatus: "unknown", birthSortTo: "1850-12-31" },
      living: false,
      minor: false,
    },
    {
      name: "unknown, born 1990",
      input: { livingStatus: "unknown", birthSortTo: "1990-12-31" },
      living: true,
      minor: false,
    },
    {
      name: "living, born 2015",
      input: { livingStatus: "living", birthSortTo: "2015-12-31" },
      living: true,
      minor: true,
    },
    {
      name: "living, born 2000–2009 (latest date counts)",
      input: { livingStatus: "living", birthSortTo: "2009-12-31" },
      living: true,
      minor: true,
    },
    {
      name: "turned 18 yesterday",
      input: { livingStatus: "living", birthSortTo: "2008-11-09" },
      living: true,
      minor: false,
    },
  ] as const)("$name", ({ input, living, minor: isMinor }) => {
    const value = { ...input, deathDate: null };
    expect(PrivacyPolicyHelper.presumedLiving(value, TODAY)).toBe(living);
    expect(PrivacyPolicyHelper.isMinor(value, TODAY)).toBe(isMinor);
  });

  it("treats a recorded death date as deceased even when the status is unknown", () => {
    const value = {
      livingStatus: "unknown",
      deathDate: { calendar: "AD", qualifier: "exact", year: 1990 },
      birthSortTo: null,
    } as const;
    expect(PrivacyPolicyHelper.presumedLiving(value, TODAY)).toBe(false);
  });
});

describe("who sees which field groups", () => {
  const ALL_BUT_CONTACT: TFieldGroup[] = [
    "names",
    "vital_dates",
    "places",
    "biography",
    "photos",
    "relationships",
  ];

  it.each([
    {
      name: "deceased, defaults, anonymous",
      person: deceased,
      consents: [],
      viewer: ANONYMOUS,
      groups: ALL_BUT_CONTACT,
    },
    {
      name: "living adult, defaults, anonymous",
      person: livingAdult,
      consents: [],
      viewer: ANONYMOUS,
      groups: [],
    },
    {
      name: "living adult, defaults, registered member",
      person: livingAdult,
      consents: [],
      viewer: MEMBER,
      groups: [],
    },
    {
      name: "living adult, defaults, editor",
      person: livingAdult,
      consents: [],
      viewer: EDITOR,
      groups: [...ALL_BUT_CONTACT, "contact"],
    },
    {
      name: "living adult made public without consent",
      person: { ...livingAdult, ...allPublic },
      consents: [],
      viewer: ANONYMOUS,
      groups: [],
    },
    {
      name: "living adult, public names with consent",
      person: { ...livingAdult, ...allPublic },
      consents: [publicNamesConsent],
      viewer: ANONYMOUS,
      groups: ["names"],
    },
    {
      name: "minor made public even with consent",
      person: { ...minor, ...allPublic },
      consents: [publicNamesConsent],
      viewer: ANONYMOUS,
      groups: [],
    },
    {
      name: "minor, editor",
      person: minor,
      consents: [],
      viewer: EDITOR,
      groups: [...ALL_BUT_CONTACT, "contact"],
    },
    {
      name: "living adult, member with a grant for names and dates",
      person: livingAdult,
      consents: [],
      viewer: { kind: "member", grantedGroups: new Set<TFieldGroup>(["names", "vital_dates"]) },
      groups: ["names", "vital_dates"],
    },
    {
      name: "unknown status, no dates, anonymous",
      person: subject({}),
      consents: [],
      viewer: ANONYMOUS,
      groups: [],
    },
  ] as const)("$name", ({ person, consents, viewer, groups }) => {
    const view = PrivacyPolicyHelper.view(person, consents, viewer, TODAY);
    expect([...view.groups].sort()).toEqual([...groups].sort());
    expect(view.visible).toBe(groups.includes("names" as never));
  });

  it("never lets a field be more open than the record", () => {
    const person = {
      ...deceased,
      visibility: "members",
      fieldVisibility: { names: "public" },
    } as const;
    expect(PrivacyPolicyHelper.view(person, [], ANONYMOUS, TODAY).visible).toBe(false);
    expect(PrivacyPolicyHelper.view(person, [], MEMBER, TODAY).visible).toBe(true);
  });
});

describe("violations before saving", () => {
  it.each([
    {
      name: "deceased may be public",
      person: { ...deceased, ...allPublic },
      consents: [],
      codes: [],
    },
    {
      name: "living adult public without consent",
      person: { ...livingAdult, ...allPublic },
      consents: [],
      codes: [
        "visibility:consent_required",
        "names:consent_required",
        "vital_dates:consent_required",
      ],
    },
    {
      name: "living adult with consent for names only",
      person: { ...livingAdult, ...allPublic },
      consents: [publicNamesConsent],
      codes: ["vital_dates:consent_required"],
    },
    {
      name: "minor public",
      person: { ...minor, ...allPublic },
      consents: [publicNamesConsent],
      codes: [
        "visibility:minor_not_public",
        "names:minor_not_public",
        "vital_dates:minor_not_public",
      ],
    },
    { name: "living adult kept at defaults", person: livingAdult, consents: [], codes: [] },
  ] as const)("$name", ({ person, consents, codes }) => {
    const found = PrivacyPolicyHelper.violations(person, consents, TODAY).map(
      (v) => `${v.field}:${v.code}`,
    );
    expect(found.sort()).toEqual([...codes].sort());
  });
});
