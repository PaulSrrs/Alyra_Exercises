/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-chai-matchers")
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require('solidity-coverage')

module.exports = {
    solidity: "0.8.13",
    gasReporter: {
        enabled: false
    }
};
