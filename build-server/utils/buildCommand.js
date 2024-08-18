const getBuildCommand = (outDirPath) => {

    const framework = process.env.FRAMEWORK;
    const installCommand = process.env.INSTALL_COMMAND ;
    const buildCommand = process.env.BUILD_COMMAND;

    console.log(`---> Selected framework: ${framework} <---`); 
    console.log(`---> Install Command: ${installCommand} <---`); 
    console.log(`---> Build Command: ${buildCommand} <---`); 

    switch (framework) {
      case "react":
        return `cd ${outDirPath} && ${"npm install"} && ${"npm run build"}`;
      default:
        return `cd ${outDirPath} && ${installCommand || "npm install"} && ${buildCommand || "npm run build"}`;
    }
  };
  
  module.exports = getBuildCommand;