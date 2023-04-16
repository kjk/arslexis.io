export default function assetSyscalls(system) {
  return {
    "asset.readAsset": (ctx, name) => {
      return system.loadedPlugs.get(ctx.plug.name).assets.readFileAsDataUrl(
        name
      );
    }
  };
}
