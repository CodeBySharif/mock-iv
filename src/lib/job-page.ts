function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJsonLdJob(html: string) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of blocks) {
    try {
      const raw = JSON.parse(match[1] ?? "");
      const nodes = Array.isArray(raw) ? raw : [raw];
      for (const node of nodes) {
        const graph = node?.["@graph"];
        const candidates = Array.isArray(graph) ? [...nodes, ...graph] : nodes;
        for (const item of candidates) {
          const type = item?.["@type"];
          const isJob =
            type === "JobPosting" ||
            (Array.isArray(type) && type.includes("JobPosting"));
          if (!isJob) continue;
          const company =
            typeof item.hiringOrganization === "string"
              ? item.hiringOrganization
              : item.hiringOrganization?.name || "";
          const description = stripTags(String(item.description || ""));
          return {
            roleTitle: String(item.title || item.name || "").trim(),
            companyName: String(company || "").trim(),
            jdText: description,
            source: "json-ld" as const,
          };
        }
      }
    } catch {
      // ignore bad JSON-LD
    }
  }
  return null;
}

export async function fetchJobPage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch job page (${response.status}). Paste the JD manually.`);
  }

  const html = await response.text();
  const jsonLd = extractJsonLdJob(html);
  const text = stripTags(html).slice(0, 40_000);

  return { html, text, jsonLd };
}
