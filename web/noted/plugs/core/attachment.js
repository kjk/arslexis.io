import { applyQuery } from "$sb/lib/query.js";
import { space } from "$sb/silverbullet-syscall/mod.js";
export async function attachmentQueryProvider({ query }) {
  return applyQuery(query, await space.listAttachments());
}
