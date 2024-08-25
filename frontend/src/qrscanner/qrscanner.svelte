<script module>
</script>

<script>
  import QrScanner from "qr-scanner";

  import Messages from "../Messages.svelte";
  import { fmtNum, fmtSize, len } from "../util";
  import { onMount } from "svelte";

  // https://github.com/schmich/instascan
  let videoElem;

  // let scanner = new Instascan.Scanner({
  //   video: document.getElementById("scanner"),
  // });

  // // Listen for QR code scans
  // scanner.addListener("scan", function (content) {
  //   console.log("Scanned:", content);
  //   document.getElementById("result").innerHTML = content;
  // });

  // // Start the scanner
  // Instascan.Camera.getCameras()
  //   .then(function (cameras) {
  //     if (cameras.length > 0) {
  //       scanner.start(cameras[0]);
  //     } else {
  //       console.error("No cameras found.");
  //     }
  //   })
  //   .catch(function (error) {
  //     console.error(error);
  //   });

  onMount(() => {
    console.log("onMount");
    let opts = {};
    const scanner = new QrScanner(
      videoElem,
      (result) => {
        console.log(result);
      },
      opts,
    );
    scanner.start();
  });
</script>

<video bind:this={videoElem} class="w-full h-full bg-blue-50">
  <track kind="captions" />
</video>
<div id="result"></div>

<style>
  video {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  #result {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  }
</style>
