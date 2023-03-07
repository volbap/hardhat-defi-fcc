const { getNamedAccounts, ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

const AMOUNT = ethers.utils.parseEther("0.1")

async function getWeth() {
    console.log("Getting WETH...")
    const { deployer } = await getNamedAccounts()

    // Obtain the WETH contract
    const iWeth = await ethers.getContractAt(
        "IWeth", // ABI (Interface)
        networkConfig[network.config.chainId].wethToken, // Address
        deployer
    )

    // Call the "deposit" function on the WETH contract
    const tx = await iWeth.deposit({ value: AMOUNT })
    await tx.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer)
    console.log(`Deployer account now has ${ethers.utils.formatEther(wethBalance.toString())} WETH`)
}

module.exports = { getWeth, AMOUNT }
