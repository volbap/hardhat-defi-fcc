const { ethers, getNamedAccounts, network } = require("hardhat")
const { getWeth, AMOUNT } = require("../scripts/getWeth")
const { networkConfig } = require("../helper-hardhat-config")

async function main() {
    // Convert our ETH to WETH, since AAVE needs everything as an ERC20 token
    await getWeth()

    // 1. DEPOSIT
    const { deployer } = await getNamedAccounts()
    const lendingPool = await getLendingPool(deployer)
    const wethTokenAddress = networkConfig[network.config.chainId].wethToken
    await approveERC20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    console.log("Depositing...")
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log("Deposited!")

    // 2. BORROW
    const availableBorrowsETH = await getBorrowUserData(lendingPool, deployer)
    const daiPrice = await getDAIPrice()
    const amountToBorrowInDAI = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    console.log(`We can borrow up to ${amountToBorrowInDAI} DAI`)
    const amountToBorrowInDAIWei = ethers.utils.parseEther(amountToBorrowInDAI.toString())
    const daiTokenAddress = networkConfig[network.config.chainId].daiToken
    await borrowAsset("DAI", daiTokenAddress, lendingPool, amountToBorrowInDAIWei, deployer)
    await getBorrowUserData(lendingPool, deployer) // at this point we'll see that we've gained some ETH in deposit (due to accrued %)

    // 3. REPAY
    await repay(amountToBorrowInDAIWei, daiTokenAddress, lendingPool, deployer)
    await getBorrowUserData(lendingPool, deployer) // at this point we'll see that there's still a little amount in debt, this is due to loan's interest
}

async function getLendingPool(account) {
    const address = networkConfig[network.config.chainId].lendingPoolAddressesProvider
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        address,
        account
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
    return lendingPool
}

async function approveERC20(tokenAddress, spenderAddress, amountToSpend, signer) {
    console.log("Approving ERC20...")
    const erc20Token = await ethers.getContractAt("IERC20", tokenAddress, signer)
    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    await tx.wait(1)
    console.log("Approved ERC20!")
}

async function getBorrowUserData(lendingPool, account) {
    console.log("Getting user account data...")
    const {
        totalCollateralETH,
        totalDebtETH,
        availableBorrowsETH,
        currentLiquidationThreshold,
        healthFactor,
    } = await lendingPool.getUserAccountData(account)
    console.log("User account data:")
    console.log(`- ETH deposited as collateral: ${toETH(totalCollateralETH)}`)
    console.log(`- ETH in debt: ${toETH(totalDebtETH)}`)
    console.log(`- ETH available to borrow: ${toETH(availableBorrowsETH)}`)
    console.log(`- Liquidation Threshold: ${currentLiquidationThreshold} `)
    console.log(`- Health Factor: ${healthFactor}`)
    return availableBorrowsETH
}

async function getDAIPrice() {
    console.log("Getting DAI / ETH price...")
    const address = networkConfig[network.config.chainId].daiEthPriceFeed
    const priceFeed = await ethers.getContractAt("AggregatorV3Interface", address)
    const price = (await priceFeed.latestRoundData())[1]
    console.log(`The DAI / ETH price is ${price.toString()}`)
    return price
}

async function borrowAsset(displayName, assetAddress, lendingPool, amount, account) {
    console.log("Borrowing...")
    const borrowTX = await lendingPool.borrow(assetAddress, amount, 1, 0, account)
    await borrowTX.wait(1)
    console.log(`Borrowed ${toETH(amount)} ${displayName}`)
}

async function repay(amount, daiAddress, lendingPool, account) {
    console.log("Repaying...")
    await approveERC20(daiAddress, lendingPool.address, amount, account)
    const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
    await repayTx.wait(1)
    console.log("Repaid!")
}

function toETH(wei) {
    return ethers.utils.formatEther(wei)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
