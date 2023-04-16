export default (space) => {
  return {
    "space.listPages": () => {
      return space.listPages();
    },
    "space.readPage": async (_ctx, name) => {
      return (await space.readPage(name)).text;
    },
    "space.getPageMeta": (_ctx, name) => {
      return space.getPageMeta(name);
    },
    "space.writePage": (_ctx, name, text) => {
      return space.writePage(name, text);
    },
    "space.deletePage": (_ctx, name) => {
      return space.deletePage(name);
    },
    "space.listPlugs": () => {
      return space.listPlugs();
    },
    "space.listAttachments": async () => {
      return await space.fetchAttachmentList();
    },
    "space.readAttachment": async (_ctx, name) => {
      return (await space.readAttachment(name, "dataurl")).data;
    },
    "space.getAttachmentMeta": async (_ctx, name) => {
      return await space.getAttachmentMeta(name);
    },
    "space.writeAttachment": async (_ctx, name, encoding, data) => {
      return await space.writeAttachment(name, encoding, data);
    },
    "space.deleteAttachment": async (_ctx, name) => {
      await space.deleteAttachment(name);
    },
    "space.listFiles": (_ctx, path) => {
      return space.listFiles(path);
    }
  };
};
