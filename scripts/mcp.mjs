// Minimal MCP (streamable HTTP) client for the UN System Data Commons.
export const MCP_URL = "https://unsd-datacommons.gcp.un-icc.cloud/mcp";
export const REST_URL = "https://unsd-datacommons.gcp.un-icc.cloud/core/api/v2/node";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function callTool(name, args, { retries = 4 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(MCP_URL, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const line = (await res.text()).split("\n").find((l) => l.startsWith("data: "));
      const msg = JSON.parse(line.slice(6));
      if (msg.error) throw new Error(msg.error.message);
      const r = msg.result;
      if (r.isError) throw new Error(r.content?.[0]?.text ?? "tool error");
      return r.structuredContent ?? JSON.parse(r.content[0].text);
    } catch (e) {
      if (attempt >= retries) throw e;
      await sleep(1000 * 2 ** attempt);
    }
  }
}

export async function restNode(nodes, property, { retries = 4 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const u = new URL(REST_URL);
      for (const n of nodes) u.searchParams.append("nodes", n);
      u.searchParams.set("property", property);
      const res = await fetch(u);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()).data;
    } catch (e) {
      if (attempt >= retries) throw e;
      await sleep(1500 * (attempt + 1));
    }
  }
}

export { sleep };
