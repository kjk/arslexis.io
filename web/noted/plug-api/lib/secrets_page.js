import { readYamlPage } from "./yaml_page.js";
export async function readSecrets(keys) {
  try {
    let allSecrets = await readYamlPage("SECRETS", ["yaml", "secrets"]);
    let collectedSecrets = [];
    for (let key of keys) {
      let secret = allSecrets[key];
      if (secret) {
        collectedSecrets.push(secret);
      } else {
        throw new Error(`No such secret: ${key}`);
      }
    }
    return collectedSecrets;
  } catch (e) {
    if (e.message === "Page not found") {
      throw new Error(`No such secret: ${keys[0]}`);
    }
    throw e;
  }
}
export async function readSecret(key) {
  try {
    const allSecrets = await readYamlPage("SECRETS", ["yaml", "secrets"]);
    const val = allSecrets[key];
    if (val === void 0) {
      throw new Error(`No such secret: ${key}`);
    }
    return val;
  } catch (e) {
    if (e.message === "Page not found") {
      throw new Error(`No such secret: ${key}`);
    }
    throw e;
  }
}
