 const { parse, readConfigFile, setDefaults } = require("/data/data/com.termux/files/home/Gitto/git_clone/code-server-4.106.3-linux-arm64/out/node/cli");
 const { runCodeServer } = require("/data/data/com.termux/files/home/Gitto/git_clone/code-server-4.106.3-linux-arm64/out/node/main");
 (async () => {
   const cliArgs = parse(process.argv.slice(2));
   const configArgs = await readConfigFile(cliArgs.config);>   const args = await setDefaults(cliArgs, configArgs);
   args.auth = "none";
   const s = await runCodeServer(args);
})();
