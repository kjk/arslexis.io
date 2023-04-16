if (typeof self === "undefined") {
  self = {
    syscall: () => {
      throw new Error("Not implemented here");
    }
  };
}
export const syscall = self.syscall;
