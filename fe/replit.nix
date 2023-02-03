{ pkgs }: {
  deps = [
    pkgs.imagemagickBig
    pkgs.nodejs-19_x
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
  ];
}
