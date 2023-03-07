require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
            forking: {
                url: process.env.MAINNET_RPC_URL,
            },
        },
        goerli: {
            chainId: 5,
            blockConfirmations: 6,
            url: process.env.GOERLI_RPC_URL || "",
            accounts: [process.env.PRIVATE_KEY],
        },
    },
    solidity: {
        compilers: [{ version: "0.8.17" }, { version: "0.4.19" }, { version: "0.6.12" }],
    },
    namedAccounts: {
        deployer: { default: 0 },
        player: { default: 1 },
    },
    gasReporter: {
        enabled: false,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    mocha: {
        timeout: 200000, // 200 seconds
    },
    etherscan: {
        apiKey: {
            goerli: process.env.ETHERSCAN_API_KEY,
        },
    },
}
