import { safeRun } from "../common/util.js";
function encodePageUrl(name) {
  return name.replaceAll(" ", "_");
}
function decodePageUrl(url) {
  return url.replaceAll("_", " ");
}
export class PathPageNavigator {
  constructor(indexPage, root = "") {
    this.indexPage = indexPage;
    this.root = root;
  }
  async navigate(page, pos, replaceState = false) {
    let encodedPage = encodePageUrl(page);
    if (page === this.indexPage) {
      encodedPage = "";
    }
    if (replaceState) {
      window.history.replaceState(
        { page, pos },
        page,
        `${this.root}/${encodedPage}`
      );
    } else {
      window.history.pushState(
        { page, pos },
        page,
        `${this.root}/${encodedPage}`
      );
    }
    window.dispatchEvent(
      new PopStateEvent("popstate", {
        state: { page, pos },
      })
    );
    await new Promise((resolve) => {
      this.navigationResolve = resolve;
    });
    this.navigationResolve = void 0;
  }
  subscribe(pageLoadCallback) {
    const cb = (event) => {
      const gotoPage = this.getCurrentPage();
      if (!gotoPage) {
        return;
      }
      safeRun(async () => {
        await pageLoadCallback(
          this.getCurrentPage(),
          event?.state?.pos || this.getCurrentPos()
        );
        if (this.navigationResolve) {
          this.navigationResolve();
        }
      });
    };
    window.addEventListener("popstate", cb);
    cb();
  }
  decodeURI() {
    let [page, pos] = decodeURI(
      location.pathname.substring(this.root.length + 1)
    ).split("@");
    if (pos) {
      if (pos.match(/^\d+$/)) {
        return [page, +pos];
      } else {
        return [page, pos];
      }
    } else {
      return [page, 0];
    }
  }
  getCurrentPage() {
    return decodePageUrl(this.decodeURI()[0]) || this.indexPage;
  }
  getCurrentPos() {
    return this.decodeURI()[1];
  }
}
