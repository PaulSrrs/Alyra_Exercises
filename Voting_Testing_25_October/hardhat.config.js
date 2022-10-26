/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-chai-matchers")
require("@nomiclabs/hardhat-waffle");
module.exports = {
  solidity: "0.8.13",
  networks: {
    /*development: {
        host: "127.0.0.1",     // Localhost (default: none)
        port: 8545,            // Standard Ethereum port (default: none)
        network_id: "*",       // Any network (default: none)
    }*/
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    // timeout: 100000
  },
};
