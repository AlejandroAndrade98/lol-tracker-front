import { useQuery } from "@tanstack/react-query";

const DATA_DRAGON = "https://ddragon.leagueoflegends.com";

export function useChampionPortrait(championName: string) {
  const catalog = useQuery({
    queryKey: ["riot", "champion-portraits"],
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const versionsResponse = await fetch(`${DATA_DRAGON}/api/versions.json`);
      if (!versionsResponse.ok) throw new Error("Champion assets unavailable");
      const versions: unknown = await versionsResponse.json();
      if (!Array.isArray(versions) || typeof versions[0] !== "string")
        throw new Error("Champion asset version unavailable");
      const version = versions[0];
      const response = await fetch(`${DATA_DRAGON}/cdn/${version}/data/en_US/champion.json`);
      if (!response.ok) throw new Error("Champion catalog unavailable");
      const body: unknown = await response.json();
      const portraits = new Map<string, string>();
      if (typeof body !== "object" || body === null || !("data" in body)) return portraits;
      if (typeof body.data !== "object" || body.data === null) return portraits;
      const entries: unknown[] = Object.values(body.data);
      for (const entry of entries) {
        if (
          typeof entry !== "object" ||
          entry === null ||
          !("id" in entry) ||
          typeof entry.id !== "string" ||
          !("name" in entry) ||
          typeof entry.name !== "string" ||
          !("image" in entry) ||
          typeof entry.image !== "object" ||
          entry.image === null ||
          !("full" in entry.image) ||
          typeof entry.image.full !== "string"
        )
          continue;
        const url = `${DATA_DRAGON}/cdn/${version}/img/champion/${entry.image.full}`;
        portraits.set(normalize(entry.id), url);
        portraits.set(normalize(entry.name), url);
      }
      return portraits;
    },
  });
  return catalog.data?.get(normalize(championName));
}

function normalize(name: string) {
  return name.replace(/[^a-z0-9]/gi, "").toLowerCase();
}
